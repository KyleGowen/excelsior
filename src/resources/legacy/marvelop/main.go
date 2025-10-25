// main.go
package main

import (
	"bufio"
	"context"
	"crypto/tls"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var (
	indexURL   string
	outDir     string
	workers    int
	reqDelay   time.Duration
	httpClient *http.Client
)

func init() {
	flag.StringVar(&indexURL, "index", "https://cardguide.fandom.com/wiki/Marvel_OverPower_(expansion)", "Index page to crawl")
	flag.StringVar(&outDir, "out", "images", "Output directory for downloaded images")
	flag.IntVar(&workers, "workers", 8, "Number of concurrent download workers")
	flag.DurationVar(&reqDelay, "delay", 200*time.Millisecond, "Delay between requests per worker")

	httpClient = &http.Client{
		Timeout: 45 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 50,
			TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
		},
	}
}

func main() {
	flag.Parse()

	if err := os.MkdirAll(outDir, 0o755); err != nil {
		fmt.Printf("[FATAL] create output dir: %v\n", err)
		os.Exit(1)
	}

	cardPages, err := collectCardPages(indexURL)
	if err != nil {
		fmt.Printf("[FATAL] collect card pages: %v\n", err)
		os.Exit(1)
	}

	if len(cardPages) == 0 {
		fmt.Println("[WARN] Found 0 card pages. Is the index URL correct?")
		return
	}

	fmt.Printf("[INFO] Found %d card pages\n", len(cardPages))

	type job struct {
		CardURL string
	}
	jobs := make(chan job, len(cardPages))
	results := make(chan error, len(cardPages))

	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			limiter := time.NewTicker(reqDelay)
			defer limiter.Stop()

			for j := range jobs {
				<-limiter.C

				imgURL, err := findImageURL(j.CardURL)
				if err != nil {
					fmt.Printf("[ERR] Worker %d resolve image: %v\n", id, err)
					results <- err
					continue
				}

				if err := downloadImage(imgURL, outDir); err != nil {
					fmt.Printf("[ERR] Worker %d download: %v\n", id, err)
					results <- err
					continue
				}
				results <- nil
			}
		}(i + 1)
	}

	for _, u := range cardPages {
		jobs <- job{CardURL: u}
	}
	close(jobs)

	wg.Wait()
	close(results)

	var ok, fail int
	for err := range results {
		if err == nil {
			ok++
		} else {
			fail++
		}
	}

	fmt.Printf("[DONE] %d succeeded, %d failed. Files saved to %s\n", ok, fail, outDir)
}

// collectCardPages grabs every link on the index page that looks like a card page.
// For MVOP, each page typically includes "(MVOP)" in the title/URL.
func collectCardPages(index string) ([]string, error) {
	doc, err := fetchDoc(index)
	if err != nil {
		return nil, err
	}

	base, err := url.Parse(index)
	if err != nil {
		return nil, err
	}

	links := make(map[string]struct{})
	doc.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		if href == "" || strings.HasPrefix(href, "#") {
			return
		}
		if !strings.HasPrefix(href, "/wiki/") {
			return
		}
		// Skip categories & file namespace
		if strings.Contains(href, ":Category") || strings.Contains(href, ":File") {
			return
		}
		// Heuristic for card pages
		if !(strings.Contains(href, "(MVOP)") || strings.Contains(strings.ToUpper(s.Text()), "(MVOP)")) {
			return
		}
		u, err := base.Parse(href)
		if err != nil {
			return
		}
		links[u.String()] = struct{}{}
	})

	out := make([]string, 0, len(links))
	for u := range links {
		out = append(out, u)
	}
	return out, nil
}

// findImageURL finds the full-size image for a given card page.
// Strategy:
//   1) Prefer the anchor that points to "?file=..." (like the example).
//   2) Fallback to the OpenGraph image meta (og:image).
//   3) Fallback to the first <a class="image"> link.
func findImageURL(cardPage string) (string, error) {
	doc, err := fetchDoc(cardPage)
	if err != nil {
		return "", err
	}

	base, _ := url.Parse(cardPage)

	// (1) links that end up at the file page, e.g. ?file=CaptainAmerica...jpg
	if node := doc.Find(`a[href*="?file="]`).First(); node.Length() > 0 {
		if href, ok := node.Attr("href"); ok {
			u, err := base.Parse(href)
			if err == nil {
				return u.String(), nil
			}
		}
	}

	// (2) og:image
	if meta := doc.Find(`meta[property="og:image"]`).First(); meta.Length() > 0 {
		if content, ok := meta.Attr("content"); ok && content != "" {
			return content, nil
		}
	}

	// (3) sometimes there’s a link with class "image" to the media
	if node := doc.Find(`a.image`).First(); node.Length() > 0 {
		if href, ok := node.Attr("href"); ok {
			u, err := base.Parse(href)
			if err == nil {
				return u.String(), nil
			}
		}
	}

	return "", fmt.Errorf("no image link found on %s", cardPage)
}

// downloadImage fetches the given URL (following redirects) and writes it to outDir with a safe filename.
// It also handles the case where the URL is a media page that redirects to a static image CDN.
func downloadImage(raw string, outDir string) error {
	const maxRetries = 5
	backoff := 500 * time.Millisecond

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err := httpGetWithUA(context.Background(), raw)
		if err != nil {
			lastErr = err
		} else {
			if resp.StatusCode >= 300 && resp.StatusCode < 400 {
				// should be auto-followed; just in case…
				loc := resp.Header.Get("Location")
				resp.Body.Close()
				if loc == "" {
					lastErr = fmt.Errorf("redirect without Location from %s", raw)
				} else {
					raw = resolveMaybe(resp.Request.URL, loc)
					continue
				}
			} else if resp.StatusCode == 200 {
				defer resp.Body.Close()

				finalURL := resp.Request.URL // after redirects
				filename := pickFilename(finalURL)
				fullpath := filepath.Join(outDir, filename)

				// If file already exists with content, skip
				if fi, err := os.Stat(fullpath); err == nil && fi.Size() > 0 {
					fmt.Printf("[SKIP] %s (exists)\n", filename)
					return nil
				}

				// ensure dir exists
				if err := os.MkdirAll(filepath.Dir(fullpath), 0o755); err != nil {
					return fmt.Errorf("mkdir: %w", err)
				}

				// Use a unique temp file to avoid .part collisions across workers
				tmpFile, err := os.CreateTemp(outDir, filename+".*.part")
				if err != nil {
					return fmt.Errorf("create temp: %w", err)
				}
				tmp := tmpFile.Name()

				bw := bufio.NewWriterSize(tmpFile, 1<<20)
				_, copyErr := io.Copy(bw, resp.Body)
				flushErr := bw.Flush()
				closeErr := tmpFile.Close()

				if copyErr != nil {
					_ = os.Remove(tmp)
					return fmt.Errorf("write: %w", copyErr)
				}
				if flushErr != nil {
					_ = os.Remove(tmp)
					return fmt.Errorf("flush: %w", flushErr)
				}
				if closeErr != nil {
					_ = os.Remove(tmp)
					return fmt.Errorf("close: %w", closeErr)
				}

				// Try to move into place; if a worker already wrote it, treat as success
				if err := os.Rename(tmp, fullpath); err != nil {
					// If target now exists, assume success and remove temp
					if _, statErr := os.Stat(fullpath); statErr == nil {
						_ = os.Remove(tmp)
						fmt.Printf("[OK] %s (already present)\n", filename)
						return nil
					}
					_ = os.Remove(tmp)
					return fmt.Errorf("rename %s -> %s: %w", tmp, fullpath, err)
				}

				fmt.Printf("[OK] %s\n", filename)
				return nil
			} else if resp.StatusCode == 429 || resp.StatusCode >= 500 {
				lastErr = fmt.Errorf("server returned %d for %s", resp.StatusCode, raw)
				resp.Body.Close()
			} else {
				body, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
				resp.Body.Close()
				return fmt.Errorf("unexpected status %d for %s: %s", resp.StatusCode, raw, strings.TrimSpace(string(body)))
			}
		}

		time.Sleep(backoff)
		backoff *= 2
	}

	return fmt.Errorf("download failed after retries: %w", lastErr)
}

func httpGetWithUA(ctx context.Context, raw string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", raw, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "mvop-scraper/1.1 (+https://cardguide.fandom.com/)")
	req.Header.Set("Accept", "*/*")
	return httpClient.Do(req)
}

func fetchDoc(raw string) (*goquery.Document, error) {
	resp, err := httpGetWithUA(context.Background(), raw)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		defer resp.Body.Close()
		return nil, fmt.Errorf("GET %s: %s", raw, resp.Status)
	}
	defer resp.Body.Close()

	return goquery.NewDocumentFromReader(resp.Body)
}

// ---------- filename helpers ----------

var badNameChars = regexp.MustCompile(`[^A-Za-z0-9._\-]+`)

func pickFilename(u *url.URL) string {
	// 1) If there's an explicit file name in the query, prefer it
	if f := u.Query().Get("file"); f != "" {
		return sanitizeFilename(f)
	}

	// 2) MediaWiki static path pattern:
	//    .../SomeCard-MVOP.jpg/revision/latest?cb=123456
	//    We want "SomeCard-MVOP.jpg", optionally suffixed with _cb123456
	segments := strings.Split(strings.Trim(u.Path, "/"), "/")
	name := filepath.Base(u.Path) // default

	// If the path includes "/revision/latest", the segment before "revision" is the real filename
	for i := len(segments) - 1; i >= 0; i-- {
		if segments[i] == "revision" && i-1 >= 0 {
			name = segments[i-1]
			break
		}
	}

	// Some URLs may still end in "latest"; try previous segment
	if name == "latest" && len(segments) >= 2 {
		name = segments[len(segments)-2]
	}

	// Append cache-buster if present to avoid collisions across pages
	if cb := u.Query().Get("cb"); cb != "" {
		ext := filepath.Ext(name)
		base := strings.TrimSuffix(name, ext)
		if base == "" {
			base = "image"
		}
		if ext == "" {
			ext = ".jpg"
		}
		name = fmt.Sprintf("%s_cb%s%s", base, cb, ext)
	}

	// If we somehow still don't have an extension, assume jpg (most cards are jpgs)
	if !strings.Contains(name, ".") {
		name += ".jpg"
	}

	return sanitizeFilename(name)
}

func sanitizeFilename(name string) string {
	// URL-decode, normalize spaces, strip ugly chars
	if dec, err := url.PathUnescape(name); err == nil && dec != "" {
		name = dec
	}
	name = strings.ReplaceAll(name, " ", "_")
	name = badNameChars.ReplaceAllString(name, "_")

	// Avoid extremely short names; add a small prefix to reduce risk of collisions
	if len(name) <= 6 {
		name = "wikia_" + name
	}
	return name
}

func resolveMaybe(base *url.URL, ref string) string {
	u, err := base.Parse(ref)
	if err != nil {
		return ref
	}
	return u.String()
}

