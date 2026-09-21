#!/usr/bin/env python3
"""Return The Orange King USD price for a card name."""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from typing import Any


BASE_URL = "https://theorangeking.com"
SUGGEST_URL = f"{BASE_URL}/search/suggest.json"
COLLECTION_PRODUCTS_URL = f"{BASE_URL}/collections/overpower-original-set/products.json"
COLLECTION_HANDLES = {
    "original": "overpower-original-set",
    "original-overpower": "overpower-original-set",
    "original-overpower-1995": "overpower-original-set",
    "powersurge": "powersurge",
    "power-surge": "powersurge",
    "mission-control": "mission-control",
    "missioncontrol": "mission-control",
    "dc": "dc",
    "dc-overpower": "dc",
    "batman-superman": "dc",
    "dc-batman-superman": "dc",
    "iq": "iq",
    "iq-overpower": "iq",
}
USER_AGENT = "Mozilla/5.0 (compatible; Codex OrangeKingPrice/1.0)"


@dataclass(frozen=True)
class Product:
    title: str
    handle: str
    price: Decimal
    available: bool
    product_type: str
    tags: tuple[str, ...]
    url: str


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.casefold().replace("&", " and ")
    value = re.sub(r"[^a-z0-9+]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def segments(value: str) -> list[str]:
    return [normalize(part) for part in re.split(r"\s+-\s+", value) if normalize(part)]


def decimal_price(value: Any) -> Decimal:
    try:
        if isinstance(value, int):
            return Decimal(value) / Decimal(100)
        return Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"Invalid price value: {value!r}") from exc


def product_from_suggest(item: dict[str, Any]) -> Product:
    return Product(
        title=str(item.get("title", "")).strip(),
        handle=str(item.get("handle", "")).strip(),
        price=decimal_price(item.get("price_min") or item.get("price")),
        available=bool(item.get("available", False)),
        product_type=str(item.get("type", "")).strip(),
        tags=tuple(str(tag) for tag in item.get("tags", [])),
        url=BASE_URL + str(item.get("url", "")).split("?", 1)[0],
    )


def product_from_collection(item: dict[str, Any]) -> Product | None:
    variants = item.get("variants") or []
    prices = [decimal_price(variant.get("price")) for variant in variants if variant.get("price") is not None]
    if not prices:
        return None
    handle = str(item.get("handle", "")).strip()
    return Product(
        title=str(item.get("title", "")).strip(),
        handle=handle,
        price=min(prices),
        available=any(bool(variant.get("available", False)) for variant in variants),
        product_type=str(item.get("product_type", "")).strip(),
        tags=tuple(str(tag) for tag in item.get("tags", [])),
        url=f"{BASE_URL}/products/{handle}" if handle else "",
    )


def fetch_suggest_products(card_name: str, limit: int) -> list[Product]:
    params = {
        "q": card_name,
        "resources[type]": "product",
        "resources[limit]": str(limit),
    }
    url = f"{SUGGEST_URL}?{urllib.parse.urlencode(params)}"
    data = fetch_json(url)
    raw_products = data.get("resources", {}).get("results", {}).get("products", [])
    return [product_from_suggest(item) for item in raw_products]


def fetch_original_op_products(max_pages: int = 20) -> list[Product]:
    return fetch_collection_products("overpower-original-set", max_pages)


def collection_handle(value: str | None) -> str | None:
    if not value:
        return None
    normalized = normalize(value).replace(" ", "-")
    return COLLECTION_HANDLES.get(normalized, value.strip("/"))


def fetch_collection_products(handle: str, max_pages: int = 20) -> list[Product]:
    products: list[Product] = []
    for page in range(1, max_pages + 1):
        url = f"{BASE_URL}/collections/{handle}/products.json?limit=250&page={page}"
        raw_products = fetch_json(url).get("products", [])
        if not raw_products:
            break
        for item in raw_products:
            product = product_from_collection(item)
            if product is not None:
                products.append(product)
    return products


def score_product(card_name: str, product: Product) -> float:
    query = normalize(card_name)
    title = normalize(product.title)
    if not query or not title:
        return 0.0

    if query == title:
        return 1000.0

    query_segments = segments(card_name)
    title_segments = segments(product.title)
    if len(query_segments) > 1 and title_segments[: len(query_segments)] == query_segments:
        return 980.0 - max(len(title) - len(query), 0) * 0.25

    if len(query_segments) == 1 and title_segments and query_segments[0] == title_segments[0]:
        if "character" in product.product_type.casefold() or "op character" in title:
            return 940.0 - max(len(title) - len(query), 0) * 0.25
        return 700.0 - max(len(title) - len(query), 0) * 0.25

    if title.startswith(query + " "):
        return 920.0 - max(len(title) - len(query), 0) * 0.3

    if query in title:
        return 880.0 - max(len(title) - len(query), 0) * 0.3

    query_tokens = query.split()
    if all(token in title.split() for token in query_tokens):
        return 730.0 - max(len(title) - len(query), 0) * 0.2

    return SequenceMatcher(None, query, title).ratio() * 650.0


def find_best(card_name: str, products: list[Product]) -> tuple[Product, list[tuple[float, Product]]]:
    ranked = sorted(((score_product(card_name, product), product) for product in products), reverse=True, key=lambda row: row[0])
    ranked = [row for row in ranked if row[0] >= 650.0]
    if not ranked:
        raise LookupError(f"No confident The Orange King product match for {card_name!r}")

    best_score, best_product = ranked[0]
    if len(ranked) > 1:
        second_score, second_product = ranked[1]
        different_price = second_product.price != best_product.price
        if different_price and second_score >= best_score - 8.0 and best_score < 960.0:
            raise LookupError(
                "Ambiguous The Orange King product match for "
                f"{card_name!r}: "
                + "; ".join(f"{product.title} (${product.price:.2f})" for _, product in ranked[:5])
            )
    return best_product, ranked


def lookup_price(
    card_name: str,
    suggest_limit: int,
    collection: str | None = None,
) -> tuple[Product, list[tuple[float, Product]]]:
    handle = collection_handle(collection)
    if handle:
        try:
            return find_best(card_name, fetch_collection_products(handle))
        except LookupError:
            pass
    products = fetch_suggest_products(card_name, suggest_limit)
    try:
        return find_best(card_name, products)
    except LookupError:
        products = fetch_original_op_products()
        return find_best(card_name, products)


def main() -> int:
    parser = argparse.ArgumentParser(description="Look up The Orange King USD price for a card name.")
    parser.add_argument("card_name", help="Card name to look up")
    parser.add_argument("--collection", help="Optional The Orange King collection handle or set alias")
    parser.add_argument("--json", action="store_true", help="Print match details as JSON")
    parser.add_argument("--suggest-limit", type=int, default=10, help="Shopify search-suggest product limit")
    args = parser.parse_args()

    try:
        product, ranked = lookup_price(args.card_name, args.suggest_limit, args.collection)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        print(
            json.dumps(
                {
                    "price": f"${product.price:.2f}",
                    "amount": f"{product.price:.2f}",
                    "currency": "USD",
                    "title": product.title,
                    "url": product.url,
                    "available": product.available,
                    "candidates": [
                        {"score": round(score, 2), "title": candidate.title, "price": f"${candidate.price:.2f}"}
                        for score, candidate in ranked[:5]
                    ],
                },
                indent=2,
            )
        )
    else:
        print(f"${product.price:.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
