package main

import (
	"bufio"
	"context"
	"crypto/sha1"
	"crypto/tls"
	"encoding/csv"
	"encoding/hex"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// ---------- Flags & globals ----------

var (
	indexURL   string
	outImages  string
	outMD      string
	workers    int
	reqDelay   time.Duration
	httpClient *http.Client
)

func init() {
	flag.StringVar(&indexURL, "index", "https://cardguide.fandom.com/wiki/Classic_OverPower_(expansion)", "Index page to crawl")
	flag.StringVar(&outImages, "out-images", "images", "Directory for downloaded images")
	flag.StringVar(&outMD, "out-md", "md", "Directory for generated Markdown")
	flag.IntVar(&workers, "workers", 10, "Concurrent workers")
	flag.DurationVar(&reqDelay, "delay", 300*time.Millisecond, "Delay between requests per worker")

	httpClient = &http.Client{
		Timeout: 45 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        200,
			MaxIdleConnsPerHost: 100,
			TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
		},
	}
}

// ---------- Types ----------

type CardRecord struct {
	PageURL     string
	Name        string
	KV          map[string]string
	OrderedKeys []string

	ImageURL  string
	ImageName string

	SchemaKey string
	Error     error
}

// ---------- Main ----------

func main() {
	flag.Parse()

	must(os.MkdirAll(outImages, 0o755))
	must(os.MkdirAll(outMD, 0o755))

	pages, err := collectCardPages(indexURL)
	must(err)
	if len(pages) == 0 {
		fmt.Println("[WARN] No card pages found; check the index URL.")
		return
	}
	fmt.Printf("[INFO] Found %d candidate pages\n", len(pages))

	// Scrape + download in one pass with worker pool
	recs := scrapeAndDownloadAll(pages)

	// Group by schema & write Markdown + README
	groups := groupBySchema(recs)
	must(writeMarkdownGroups(groups, outMD))
	must(writeIndex(groups, outMD))

	// Write manifest CSV
	must(writeManifestCSV(recs, "manifest.csv"))

	ok, fail := 0, 0
	for _, r := range recs {
		if r.Error == nil {
			ok++
		} else {
			fail++
		}
	}
	fmt.Printf("[DONE] %d ok, %d failed. Images -> %s | Markdown -> %s | manifest.csv written.\n", ok, fail, outImages, outMD)
}

// ---------- Collect links from index ----------

func collectCardPages(index string) ([]string, error) {
	doc, err := fetchDoc(index)
	if err != nil {
		return nil, err
	}
	base, err := url.Parse(index)
	if err != nil {
		return nil, err
	}

	links := map[string]struct{}{}
	// Be permissive: include any internal /wiki/ link from the main content area.
	// We'll later filter out pages lacking a Statistics table.
	doc.Find("#mw-content-text a[href]").Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		if href == "" || !strings.HasPrefix(href, "/wiki/") {
			return
		}
		// Exclude obvious non-card namespaces
		if strings.Contains(href, ":Category") || strings.Contains(href, ":File") {
			return
		}
		u, err := base.Parse(href)
		if err == nil {
			links[u.String()] = struct{}{}
		}
	})

	out := make([]string, 0, len(links))
	for u := range links {
		out = append(out, u)
	}
	sort.Strings(out)
	return out, nil
}

// ---------- Scrape + Download ----------

func scrapeAndDownloadAll(pages []string) []CardRecord {
	type job struct{ URL string }
	jobs := make(chan job, len(pages))
	results := make(chan CardRecord, len(pages))

	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			limiter := time.NewTicker(reqDelay)
			defer limiter.Stop()

			for j := range jobs {
				<-limiter.C
				rec := scrapeOne(j.URL)
				if rec.Error == nil && rec.ImageURL != "" && rec.ImageName != "" {
					if err := downloadImage(rec.ImageURL, filepath.Join(outImages, rec.ImageName)); err != nil {
						rec.Error = fmt.Errorf("download image: %w", err)
					}
				}
				if rec.Error != nil {
					fmt.Printf("[ERR] Worker %d: %s (%v)\n", id, j.URL, rec.Error)
				} else {
					fmt.Printf("[OK ] Worker %d: %s\n", id, rec.Name)
				}
				results <- rec
			}
		}(i + 1)
	}

	for _, u := range pages {
		jobs <- job{URL: u}
	}
	close(jobs)

	wg.Wait()
	close(results)

	var out []CardRecord
	for r := range results {
		out = append(out, r)
	}
	return out
}

func scrapeOne(pageURL string) CardRecord {
	rec := CardRecord{
		PageURL: pageURL,
		KV:      map[string]string{},
	}

	doc, err := fetchDoc(pageURL)
	if err != nil {
		rec.Error = err
		return rec
	}

	rec.Name = strings.TrimSpace(doc.Find("#firstHeading").Text())

	// Find the “Statistics” table
	var statTable *goquery.Selection
	doc.Find("table").EachWithBreak(func(_ int, t *goquery.Selection) bool {
		th := t.Find("tr").First().Find("th").First()
		if strings.Contains(strings.ToLower(strings.TrimSpace(th.Text())), "statistics") {
			statTable = t
			return false
		}
		return true
	})

	if statTable == nil {
		rec.Error = fmt.Errorf("no Statistics table")
		return rec
	}

	// If the 1st row has two THs, the second is often the card name
	ths := statTable.Find("tr").First().Find("th")
	if ths.Length() >= 2 {
		if altName := strings.TrimSpace(cleanInline(ths.Eq(1).Text())); altName != "" {
			rec.Name = altName
		}
	}

	// Parse rows key/value
	var keys []string
	statTable.Find("tr").Each(func(i int, tr *goquery.Selection) {
		if i == 0 {
			return // header row
		}
		cells := tr.ChildrenFiltered("th,td")
		if cells.Length() < 2 {
			return
		}
		k := strings.TrimSpace(cleanInline(cells.Eq(0).Text()))
		v := strings.TrimSpace(cleanInline(textWithLinkFallback(cells.Eq(1))))
		if k != "" && v != "" {
			rec.KV[k] = v
		}
	})
	for k := range rec.KV {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	rec.OrderedKeys = keys
	rec.SchemaKey = strings.Join(keys, "|")

	// Resolve image URL + filename
	if imgURL, _ := findImageURLFromDoc(doc, pageURL); imgURL != "" {
		rec.ImageURL = imgURL
		if u, err := url.Parse(imgURL); err == nil {
			rec.ImageName = pickFilename(u)
		}
	}

	return rec
}

// ---------- HTML helpers ----------

func textWithLinkFallback(sel *goquery.Selection) string {
	txt := strings.TrimSpace(sel.Text())
	if txt != "" {
		return txt
	}
	if a := sel.Find("a").First(); a.Length() > 0 {
		return strings.TrimSpace(a.Text())
	}
	return strings.TrimSpace(sel.Clone().Children().Remove().End().Text())
}

func cleanInline(s string) string {
	s = strings.ReplaceAll(s, "\u00A0", " ")
	s = strings.ReplaceAll(s, "’", "'")
	s = strings.ReplaceAll(s, "“", "\"")
	s = strings.ReplaceAll(s, "”", "\"")
	s = strings.Join(strings.Fields(s), " ")
	return s
}

// ---------- Image helpers ----------

var badNameChars = regexp.MustCompile(`[^A-Za-z0-9._\-]+`)

func pickFilename(u *url.URL) string {
	// 1) Prefer explicit ?file=...
	if f := u.Query().Get("file"); f != "" {
		return sanitizeFilename(f)
	}

	// 2) .../SomeCard.jpg/revision/latest?cb=123456
	segments := strings.Split(strings.Trim(u.Path, "/"), "/")
	name := filepath.Base(u.Path)
	for i := len(segments) - 1; i >= 0; i-- {
		if segments[i] == "revision" && i-1 >= 0 {
			name = segments[i-1]
			break
		}
	}
	if name == "latest" && len(segments) >= 2 {
		name = segments[len(segments)-2]
	}
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
	if !strings.Contains(name, ".") {
		name += ".jpg"
	}
	return sanitizeFilename(name)
}

func sanitizeFilename(name string) string {
	if dec, err := url.PathUnescape(name); err == nil && dec != "" {
		name = dec
	}
	name = strings.ReplaceAll(name, " ", "_")
	name = badNameChars.ReplaceAllString(name, "_")
	if len(name) <= 6 {
		name = "wikia_" + name
	}
	return name
}

func findImageURLFromDoc(doc *goquery.Document, pageURL string) (string, error) {
	base, _ := url.Parse(pageURL)

	// 1) ?file=...
	if node := doc.Find(`a[href*="?file="]`).First(); node.Length() > 0 {
		if href, ok := node.Attr("href"); ok {
			if u, err := base.Parse(href); err == nil {
				return u.String(), nil
			}
		}
	}
	// 2) og:image
	if meta := doc.Find(`meta[property="og:image"]`).First(); meta.Length() > 0 {
		if content, ok := meta.Attr("content"); ok && content != "" {
			return content, nil
		}
	}
	// 3) <a class="image">
	if node := doc.Find(`a.image`).First(); node.Length() > 0 {
		if href, ok := node.Attr("href"); ok {
			if u, err := base.Parse(href); err == nil {
				return u.String(), nil
			}
		}
	}
	return "", fmt.Errorf("no image link found")
}

func downloadImage(srcURL, destPath string) error {
	const maxRetries = 5
	backoff := 500 * time.Millisecond

	if fi, err := os.Stat(destPath); err == nil && fi.Size() > 0 {
		// already there
		return nil
	}
	must(os.MkdirAll(filepath.Dir(destPath), 0o755))

	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err := httpGetWithUA(context.Background(), srcURL)
		if err != nil {
			lastErr = err
		} else {
			if resp.StatusCode == 200 {
				defer resp.Body.Close()
				tmp, err := os.CreateTemp(filepath.Dir(destPath), "part-*")
				if err != nil {
					resp.Body.Close()
					return err
				}
				tmpName := tmp.Name()

				bw := bufio.NewWriterSize(tmp, 1<<20)
				_, copyErr := io.Copy(bw, resp.Body)
				flushErr := bw.Flush()
				closeErr := tmp.Close()
				if copyErr != nil || flushErr != nil || closeErr != nil {
					_ = os.Remove(tmpName)
					if copyErr != nil {
						return copyErr
					}
					if flushErr != nil {
						return flushErr
					}
					return closeErr
				}
				if err := os.Rename(tmpName, destPath); err != nil {
					// if destination appeared meanwhile, consider success
					if _, statErr := os.Stat(destPath); statErr == nil {
						_ = os.Remove(tmpName)
						return nil
					}
					_ = os.Remove(tmpName)
					return err
				}
				return nil
			}
			// Handle retryables
			if resp.StatusCode == 429 || resp.StatusCode >= 500 {
				lastErr = fmt.Errorf("status %d", resp.StatusCode)
				resp.Body.Close()
			} else {
				body, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
				resp.Body.Close()
				return fmt.Errorf("unexpected status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
			}
		}
		time.Sleep(backoff)
		backoff *= 2
	}
	return fmt.Errorf("download failed after retries: %v", lastErr)
}

// ---------- HTTP ----------

func httpGetWithUA(ctx context.Context, raw string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", raw, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "overpower-scrape/1.0 (+https://cardguide.fandom.com/)")
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
	return goquery.NewDocumentFromReader(bufio.NewReader(resp.Body))
}

// ---------- Grouping & Markdown output ----------

type SchemaGroup struct {
	SchemaKey   string
	OrderedKeys []string
	Records     []CardRecord
	FileName    string
	Title       string
}

func groupBySchema(recs []CardRecord) []SchemaGroup {
	tmp := map[string]*SchemaGroup{}

	for _, r := range recs {
		if r.Error != nil {
			continue
		}
		key := r.SchemaKey
		if key == "" {
			key = "_empty"
		}
		g, ok := tmp[key]
		if !ok {
			title := deriveGroupTitle(r.OrderedKeys)
			tmp[key] = &SchemaGroup{
				SchemaKey:   key,
				OrderedKeys: append([]string{}, r.OrderedKeys...),
				Records:     []CardRecord{},
				Title:       title,
			}
			g = tmp[key]
		}
		g.Records = append(g.Records, r)
	}

	var groups []SchemaGroup
	for _, g := range tmp {
		sum := sha1.Sum([]byte(g.SchemaKey))
		short := hex.EncodeToString(sum[:])[:10]
		base := "group-" + short
		if g.Title != "" {
			if slug := slugify(g.Title); slug != "" {
				base = slug + "-" + short
			}
		}
		g.FileName = base + ".md"
		sort.Slice(g.Records, func(i, j int) bool { return g.Records[i].Name < g.Records[j].Name })
		groups = append(groups, *g)
	}

	sort.Slice(groups, func(i, j int) bool {
		if groups[i].Title == groups[j].Title {
			return groups[i].FileName < groups[j].FileName
		}
		return groups[i].Title < groups[j].Title
	})

	return groups
}

func deriveGroupTitle(keys []string) string {
	if len(keys) == 0 {
		return "Misc"
	}
	pinned := []string{"Type", "Control", "Numbers", "Game Text", "Characters", "Rarity"}
	var have []string
	for _, p := range pinned {
		for _, k := range keys {
			if k == p {
				have = append(have, p)
			}
		}
	}
	if len(have) == 0 {
		return strings.Join(keys, " / ")
	}
	return strings.Join(have, " / ")
}

func writeMarkdownGroups(groups []SchemaGroup, outDir string) error {
	must(os.MkdirAll(outDir, 0o755))
	for _, g := range groups {
		path := filepath.Join(outDir, g.FileName)
		f, err := os.Create(path)
		if err != nil {
			return err
		}
		w := bufio.NewWriter(f)

		fmt.Fprintf(w, "# %s\n\n", g.Title)
		fmt.Fprintf(w, "_%d cards_\n\n", len(g.Records))

		headers := append([]string{"Name"}, append(g.OrderedKeys, "Image")...)
		writeMDHeader(w, headers)

		for _, r := range g.Records {
			row := []string{escapePipes(r.Name)}
			for _, k := range g.OrderedKeys {
				row = append(row, escapePipes(r.KV[k]))
			}
			row = append(row, escapePipes(r.ImageName))
			writeMDRow(w, row)
		}

		if err := w.Flush(); err != nil {
			_ = f.Close()
			return err
		}
		if err := f.Close(); err != nil {
			return err
		}
	}
	return nil
}

func writeIndex(groups []SchemaGroup, outDir string) error {
	path := filepath.Join(outDir, "README.md")
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)

	fmt.Fprintln(w, "# Classic OverPower — Card Tables")
	fmt.Fprintln(w)
	fmt.Fprintf(w, "_%d groups_\n\n", len(groups))
	for _, g := range groups {
		fmt.Fprintf(w, "- [%s](%s) — %d cards\n", g.Title, g.FileName, len(g.Records))
	}
	return w.Flush()
}

func writeMDHeader(w *bufio.Writer, headers []string) {
	fmt.Fprint(w, "| ")
	fmt.Fprint(w, strings.Join(headers, " | "))
	fmt.Fprintln(w, " |")
	fmt.Fprint(w, "| ")
	seps := make([]string, len(headers))
	for i := range seps {
		seps[i] = "---"
	}
	fmt.Fprint(w, strings.Join(seps, " | "))
	fmt.Fprintln(w, " |")
}

func writeMDRow(w *bufio.Writer, cols []string) {
	fmt.Fprint(w, "| ")
	fmt.Fprint(w, strings.Join(cols, " | "))
	fmt.Fprintln(w, " |")
}

// ---------- Manifest CSV ----------

func writeManifestCSV(recs []CardRecord, path string) error {
	// Gather all keys to make consistent columns
	allKeysSet := map[string]struct{}{}
	for _, r := range recs {
		for k := range r.KV {
			allKeysSet[k] = struct{}{}
		}
	}
	var allKeys []string
	for k := range allKeysSet {
		allKeys = append(allKeys, k)
	}
	sort.Strings(allKeys)

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := csv.NewWriter(f)

	header := append([]string{"Name", "ImageName", "PageURL"}, allKeys...)
	if err := w.Write(header); err != nil {
		return err
	}

	for _, r := range recs {
		if r.Error != nil {
			continue
		}
		row := []string{r.Name, r.ImageName, r.PageURL}
		for _, k := range allKeys {
			row = append(row, r.KV[k])
		}
		if err := w.Write(row); err != nil {
			return err
		}
	}
	w.Flush()
	return w.Error()
}

// ---------- Utils ----------

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = regexp.MustCompile(`[^a-z0-9\-]+`).ReplaceAllString(s, "")
	return strings.Trim(s, "-")
}

func escapePipes(s string) string {
	return strings.ReplaceAll(s, "|", "\\|")
}

func must(err error) {
	if err != nil {
		fmt.Println("[FATAL]", err)
		os.Exit(1)
	}
}

