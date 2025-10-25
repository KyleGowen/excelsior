package main

import (
	"bufio"
	"context"
	"crypto/tls"
	"crypto/sha1"
	"encoding/hex"
	"flag"
	"fmt"
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

// -------------------- flags & globals --------------------

var (
	indexURL   string
	outDir     string
	workers    int
	reqDelay   time.Duration
	httpClient *http.Client
)

func init() {
	flag.StringVar(&indexURL, "index", "https://cardguide.fandom.com/wiki/Marvel_OverPower_(expansion)", "Index page to crawl")
	flag.StringVar(&outDir, "out", "md", "Output directory for Markdown tables")
	flag.IntVar(&workers, "workers", 8, "Concurrent workers")
	flag.DurationVar(&reqDelay, "delay", 250*time.Millisecond, "Delay between requests per worker")

	httpClient = &http.Client{
		Timeout: 45 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        200,
			MaxIdleConnsPerHost: 100,
			DisableCompression:  false,
			TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
		},
	}
}

// -------------------- types --------------------

type CardRecord struct {
	PageURL      string
	Name         string
	KV           map[string]string // Statistics table rows
	ImageURL     string
	ImageName    string
	SchemaKey    string // stable key for grouping: sorted keys joined by |
	OrderedKeys  []string
	Error        error
}

// -------------------- main --------------------

func main() {
	flag.Parse()

	if err := os.MkdirAll(outDir, 0o755); err != nil {
		fatalf("create out dir: %v", err)
	}

	cardPages, err := collectCardPages(indexURL)
	if err != nil {
		fatalf("collect pages: %v", err)
	}
	if len(cardPages) == 0 {
		fmt.Println("[WARN] found 0 pages")
		return
	}
	fmt.Printf("[INFO] Found %d card pages\n", len(cardPages))

	recs := scrapeAll(cardPages)

	bySchema := groupBySchema(recs)
	if err := writeMarkdownGroups(bySchema, outDir); err != nil {
		fatalf("write markdown: %v", err)
	}

	if err := writeIndex(bySchema, outDir); err != nil {
		fatalf("write index: %v", err)
	}

	fmt.Printf("[DONE] Wrote %d group files to %s (plus README.md)\n", len(bySchema), outDir)
}

// -------------------- crawling --------------------

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

	// Heuristic: internal wiki links to pages containing "(MVOP)"
	doc.Find("a[href]").Each(func(_ int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		if href == "" || !strings.HasPrefix(href, "/wiki/") {
			return
		}
		// exclude categories/files
		if strings.Contains(href, ":Category") || strings.Contains(href, ":File") {
			return
		}
		if !(strings.Contains(href, "(MVOP)") || strings.Contains(strings.ToUpper(s.Text()), "(MVOP)")) {
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

func scrapeAll(pages []string) []CardRecord {
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
				if rec.Error != nil {
					fmt.Printf("[ERR] Worker %d %s: %v\n", id, j.URL, rec.Error)
				} else {
					fmt.Printf("[OK ] Worker %d %s\n", id, rec.Name)
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

	// page title fallback
	rec.Name = strings.TrimSpace(doc.Find("#firstHeading").Text())

	// statistics table: find table whose first header cell contains "Statistics"
	var statTable *goquery.Selection
	doc.Find("table").EachWithBreak(func(i int, t *goquery.Selection) bool {
		th := t.Find("tr").First().Find("th").First()
		if strings.Contains(strings.ToLower(strings.TrimSpace(th.Text())), "statistics") {
			statTable = t
			return false
		}
		return true
	})
	if statTable == nil {
		rec.Error = fmt.Errorf("no statistics table on %s", pageURL)
		return rec
	}

	// try to read the card name from the table header (second <th> in first row)
	firstRow := statTable.Find("tr").First()
	if ths := firstRow.Find("th"); ths.Length() >= 2 {
		name := strings.TrimSpace(cleanInline(ths.Eq(1).Text()))
		if name != "" {
			rec.Name = name
		}
	}

	// parse key/value rows
	statTable.Find("tr").Each(func(i int, tr *goquery.Selection) {
		// skip the first header row
		if i == 0 {
			return
		}
		cells := tr.ChildrenFiltered("th,td")
		if cells.Length() < 2 {
			return
		}
		key := strings.TrimSpace(cleanInline(cells.Eq(0).Text()))
		val := strings.TrimSpace(cleanInline(textWithLinkFallback(cells.Eq(1))))
		if key != "" && val != "" {
			rec.KV[key] = val
		}
	})

	// resolve image URL and filename
	imgURL, _ := findImageURL(pageURL)
	rec.ImageURL = imgURL
	if imgURL != "" {
		if u, err := url.Parse(imgURL); err == nil {
			rec.ImageName = pickFilename(u)
		}
	}

	// schema key (sorted keys)
	keys := make([]string, 0, len(rec.KV))
	for k := range rec.KV {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	rec.OrderedKeys = keys
	rec.SchemaKey = strings.Join(keys, "|")

	return rec
}

// -------------------- HTML helpers --------------------

func textWithLinkFallback(sel *goquery.Selection) string {
	// Prefer visible text; if empty, try link text; finally inner text without refs
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
	// collapse whitespace and replace fancy quotes
	s = strings.ReplaceAll(s, "\u00A0", " ")
	s = strings.ReplaceAll(s, "’", "'")
	s = strings.ReplaceAll(s, "“", "\"")
	s = strings.ReplaceAll(s, "”", "\"")
	s = strings.Join(strings.Fields(s), " ")
	return s
}

// -------------------- image helpers (same logic as downloader) --------------------

var badNameChars = regexp.MustCompile(`[^A-Za-z0-9._\\-]+`)

func pickFilename(u *url.URL) string {
	// 1) Prefer explicit ?file=...
	if f := u.Query().Get("file"); f != "" {
		return sanitizeFilename(f)
	}
	// 2) Look for /.../SomeCard.jpg/revision/latest?cb=...
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

func findImageURL(cardPage string) (string, error) {
	doc, err := fetchDoc(cardPage)
	if err != nil {
		return "", err
	}
	base, _ := url.Parse(cardPage)

	// 1) anchor with ?file=
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

// -------------------- HTTP --------------------

func httpGetWithUA(ctx context.Context, raw string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", raw, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "mvop-tables/1.0 (+https://cardguide.fandom.com/)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
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

// -------------------- grouping & output --------------------

type SchemaGroup struct {
	SchemaKey   string
	OrderedKeys []string // column order for KV
	Records     []CardRecord
	FileName    string   // md file name
	Title       string   // pretty title
}

func groupBySchema(recs []CardRecord) []SchemaGroup {
	tmp := map[string]*SchemaGroup{}

	for _, r := range recs {
		if r.Error != nil {
			// keep errored entries out of tables
			fmt.Printf("[WARN] skipping errored page: %s (%v)\n", r.PageURL, r.Error)
			continue
		}
		key := r.SchemaKey
		if key == "" {
			// ensure at least an empty grouping
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

	// finalize list
	var groups []SchemaGroup
	for _, g := range tmp {
		// deterministic filename by hashing schema key
		sum := sha1.Sum([]byte(g.SchemaKey))
		short := hex.EncodeToString(sum[:])[:10]
		base := "group-" + short
		if g.Title != "" {
			slug := slugify(g.Title)
			if slug != "" {
				base = slug + "-" + short
			}
		}
		g.FileName = base + ".md"

		// sort records by Name
		sort.Slice(g.Records, func(i, j int) bool { return g.Records[i].Name < g.Records[j].Name })
		groups = append(groups, *g)
	}

	// sort groups by title then filename
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
	// Put common fields first in the title if present
	pinned := []string{"Type", "Control", "Characters", "Numbers", "Game Text", "Rarity"}
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
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}
	for _, g := range groups {
		path := filepath.Join(outDir, g.FileName)
		f, err := os.Create(path)
		if err != nil {
			return err
		}
		w := bufio.NewWriter(f)

		// Header
		fmt.Fprintf(w, "# %s\n\n", g.Title)
		fmt.Fprintf(w, "_%d cards_\n\n", len(g.Records))

		// Columns: Name | keys... | Image
		headers := append([]string{"Name"}, append(g.OrderedKeys, "Image")...)
		writeMDHeader(w, headers)

		for _, r := range g.Records {
			row := []string{escapePipes(r.Name)}
			for _, k := range g.OrderedKeys {
				row = append(row, escapePipes(r.KV[k]))
			}
			img := r.ImageName
			if img == "" && r.ImageURL != "" {
				img = r.ImageURL
			}
			row = append(row, escapePipes(img))
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

func writeMDHeader(w *bufio.Writer, headers []string) {
	// header
	fmt.Fprint(w, "| ")
	fmt.Fprint(w, strings.Join(headers, " | "))
	fmt.Fprintln(w, " |")
	// separator
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

func writeIndex(groups []SchemaGroup, outDir string) error {
	path := filepath.Join(outDir, "README.md")
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)

	fmt.Fprintln(w, "# MVOP Card Tables")
	fmt.Fprintln(w)
	fmt.Fprintf(w, "_%d groups_\n\n", len(groups))
	for _, g := range groups {
		fmt.Fprintf(w, "- [%s](%s) — %d cards\n", g.Title, g.FileName, len(g.Records))
	}
	return w.Flush()
}

// -------------------- tiny utils --------------------

func fatalf(format string, args ...any) {
	fmt.Printf("[FATAL] "+format+"\n", args...)
	os.Exit(1)
}

func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, " ", "-")
	s = regexp.MustCompile(`[^a-z0-9\-]+`).ReplaceAllString(s, "")
	s = strings.Trim(s, "-")
	return s
}

func escapePipes(s string) string {
	// Keep markdown simple—escape pipes
	return strings.ReplaceAll(s, "|", "\\|")
}

