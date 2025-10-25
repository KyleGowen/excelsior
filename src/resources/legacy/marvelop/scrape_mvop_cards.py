#!/usr/bin/env python3
"""
Scrape MVOP card images from Fandom and zip them.

Usage (Python 3.9+ recommended):
    python scrape_mvop_cards.py \
      --start-url "https://cardguide.fandom.com/wiki/Marvel_OverPower_(expansion)" \
      --out-zip mvop_cards.zip \
      --max-workers 8 \
      --delay-seconds 0.5

What it does
------------
1) Loads the expansion page and collects links to individual card pages.
2) Visits each card page, finds the primary/infobox image, and downloads it.
3) Saves all images into ./images/ and produces a ZIP of the results.

Notes
-----
- Be respectful: default adds a small delay between requests. Increase if needed.
- If a card page has multiple images, this targets the main/infobox image first,
  with fallbacks to content images if needed.
- Re-runs will skip already-downloaded files (by filename), unless --force is used.
"""

import argparse
import concurrent.futures
import os
import re
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

DEFAULT_START_URL = "https://cardguide.fandom.com/wiki/Marvel_OverPower_(expansion)"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MVOP-Scraper/1.0; +https://example.org/)"
}

IMG_EXTS = (".png", ".jpg", ".jpeg", ".webp")

@dataclass
class ScrapeResult:
    url: str
    image_url: Optional[str]
    saved_path: Optional[Path]
    error: Optional[str] = None


def sanitize_filename(name: str) -> str:
    # Keep alnum, dash, underscore, plus; replace others with underscore
    s = re.sub(r"[^A-Za-z0-9\-\_\+]+", "_", name).strip("_")
    s = re.sub(r"_+", "_", s)
    return s or "file"


def fetch_html(url: str, session: requests.Session, delay: float) -> Optional[str]:
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        if delay > 0:
            time.sleep(delay)
        return resp.text
    except Exception as e:
        print(f"[WARN] Failed to fetch {url}: {e}")
        return None


def extract_card_links(index_html: str, base_url: str) -> List[str]:
    soup = BeautifulSoup(index_html, "html.parser")
    links = set()
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        href_abs = urljoin(base_url, href)
        # Limit to the same site and /wiki/ namespace
        if "/wiki/" in href_abs and urlparse(href_abs).netloc.endswith("fandom.com"):
            # Heuristic: include page links that likely represent card pages.
            # For MVOP pages, many links include "(MVOP)" in the title.
            # We'll include any link that contains "(MVOP)" OR has "Marvel_OverPower" in path
            # but exclude index/category/file/talk/special pages.
            path = urlparse(href_abs).path
            title_lower = a.get("title", "").lower()
            if any(seg in path.lower() for seg in ["/wiki/"]) and not any(
                seg in path.lower()
                for seg in [":", "/file:", "/category:", "/special:", "/talk:", "/help:"]
            ):
                # Prefer links that look like card entries: contain (MVOP) or not a category/index
                if "(MVOP)" in href_abs or "(MVOP)" in (a.get("title") or ""):
                    links.add(href_abs)
                # Some pages may omit (MVOP); fall back for entries that look like card names
                elif "marvel_overpower" not in path.lower():
                    # Simple heuristic: if anchor text seems like a specific card (contains +, digits, or a slash combo)
                    text = (a.get_text() or "").strip()
                    if len(text) > 0 and any(ch.isdigit() for ch in text):
                        links.add(href_abs)
    return sorted(links)


def choose_best_image_from_card_page(html: str, base_url: str) -> Optional[str]:
    """
    Try common Fandom patterns to get the primary/infobox image first.
    Fallback to any content image in the page content.
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1) Infobox images (common on Fandom)
    # Look for images inside aside.infobox or figure or within .pi-image
    candidates = []
    for sel in [
        "aside .image img",
        "aside figure img",
        ".infobox .image img",
        ".pi-image img",
    ]:
        for img in soup.select(sel):
            src = img.get("src") or img.get("data-src")
            if src:
                candidates.append(src)

    # 2) Content images as fallback
    if not candidates:
        for img in soup.select("img"):
            src = img.get("src") or img.get("data-src")
            if src:
                candidates.append(src)

    # Filter out tiny or UI images and pick the first plausible card image
    def is_plausible(url: str) -> bool:
        low = url.lower()
        if any(token in low for token in ["avatar", "icon", "sprite", "wds"]):
            return False
        # Require image extension or static domain often used by Fandom
        return low.endswith(IMG_EXTS) or "static.wikia.nocookie.net" in low

    for src in candidates:
        if is_plausible(src):
            return urljoin(base_url, src)

    return None


def download_image(img_url: str, dest_dir: Path, session: requests.Session, delay: float) -> Optional[Path]:
    try:
        # Use card name guess from URL for filename
        parsed = urlparse(img_url)
        filename = sanitize_filename(os.path.basename(parsed.path))
        if not filename.lower().endswith(IMG_EXTS):
            # Try to infer extension from query or fallback to .jpg
            if any(ext in img_url.lower() for ext in IMG_EXTS):
                for ext in IMG_EXTS:
                    if ext in img_url.lower():
                        filename += ext
                        break
            else:
                filename += ".jpg"
        out_path = dest_dir / filename

        if out_path.exists():
            return out_path

        with session.get(img_url, headers=HEADERS, timeout=60, stream=True) as r:
            r.raise_for_status()
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        if delay > 0:
            time.sleep(delay)
        return out_path
    except Exception as e:
        print(f"[WARN] Failed to download image {img_url}: {e}")
        return None


def scrape_card(session: requests.Session, url: str, images_dir: Path, delay: float) -> ScrapeResult:
    html = fetch_html(url, session, delay)
    if not html:
        return ScrapeResult(url=url, image_url=None, saved_path=None, error="fetch_failed")
    img_url = choose_best_image_from_card_page(html, url)
    if not img_url:
        return ScrapeResult(url=url, image_url=None, saved_path=None, error="no_image_found")
    saved = download_image(img_url, images_dir, session, delay)
    return ScrapeResult(url=url, image_url=img_url, saved_path=saved, error=None if saved else "download_failed")


def zip_directory(src_dir: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(src_dir.rglob("*")):
            if p.is_file():
                arcname = p.relative_to(src_dir)
                zf.write(p, arcname)


def main():
    parser = argparse.ArgumentParser(description="Scrape MVOP card images and zip them.")
    parser.add_argument("--start-url", default=DEFAULT_START_URL, help="Expansion index URL to start from.")
    parser.add_argument("--out-zip", default="mvop_cards.zip", help="Output ZIP file path.")
    parser.add_argument("--images-dir", default="images", help="Directory to store downloaded images before zipping.")
    parser.add_argument("--max-workers", type=int, default=8, help="Max concurrent worker threads.")
    parser.add_argument("--delay-seconds", type=float, default=0.5, help="Delay between HTTP requests (politeness).")
    parser.add_argument("--force", action="store_true", help="Re-download even if file exists (by filename).")
    args = parser.parse_args()

    base_dir = Path.cwd()
    images_dir = base_dir / args.images_dir
    images_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()

    print(f"[INFO] Fetching index: {args.start_url}")
    index_html = fetch_html(args.start_url, session, args.delay_seconds)
    if not index_html:
        raise SystemExit("Failed to fetch the expansion page.")

    print("[INFO] Extracting card links...")
    links = extract_card_links(index_html, args.start_url)
    print(f"[INFO] Found {len(links)} candidate card pages.")

    if not links:
        raise SystemExit("No card links found. The page structure may have changed.")

    results: List[ScrapeResult] = []

    # Prepare work items
    work_items = [(link) for link in links]

    def worker(card_url: str) -> ScrapeResult:
        try:
            return scrape_card(session, card_url, images_dir, args.delay_seconds)
        except Exception as e:
            return ScrapeResult(url=card_url, image_url=None, saved_path=None, error=str(e))

    # Process concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        for res in executor.map(worker, work_items):
            results.append(res)
            if res.error:
                print(f"[WARN] {res.url} -> {res.error}")
            else:
                print(f"[OK]   {res.url} -> {res.saved_path.name}")

    # Report summary
    success = [r for r in results if r.saved_path]
    failures = [r for r in results if not r.saved_path]
    print(f"[INFO] Downloaded {len(success)} images; {len(failures)} failed.")

    # Zip results
    out_zip = base_dir / args.out_zip
    print(f"[INFO] Creating ZIP: {out_zip}")
    zip_directory(images_dir, out_zip)
    print(f"[DONE] Wrote ZIP: {out_zip.resolve()}")

if __name__ == "__main__":
    main()
