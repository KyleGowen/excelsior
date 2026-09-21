#!/usr/bin/env python3
"""Generate standalone priced OverPower checklist HTML pages."""

from __future__ import annotations

import argparse
import csv
import html
import importlib.util
import json
import re
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[4]
ORANGE_SKILL = REPO_ROOT / ".agents/skills/orange-king-price/scripts/orange_king_price.py"
PLACEHOLDER_IMAGE = "FandomFireLogo_cb20210713142711.png"
CARD_NAME_FIXES_BY_IMAGE = {
    "EyeOfTheStorm4-DCOP_cb20200627161456.jpg": 'Eye of the Storm 4 - "Stewing!"',
    "HuntressCrossbow-DCOP_cb20200415181030.jpg": "Huntress - Crossbow",
    "PenguinFlameThrowerUmbrella-DCOP_cb20200421112155.jpg": "Penguin - Flame Thrower Umbrella",
    "RaceAgainstCrime1-DCOP_cb20200627190059.jpg": 'Race Against Crime 1 - "Why?"',
    "SuperboyCoolShades-DCOP_cb20200425202754.jpg": "Superboy - Cool Shades",
}


@dataclass(frozen=True)
class Preset:
    slug: str
    title: str
    subtitle: str
    source_files: tuple[Path, ...]
    image_dir: Path
    price_collection: str
    type_order: tuple[str, ...]
    output: Path
    progress_output: Path
    price_cache: Path
    order_file: Path | None = None
    default_sort: str = "number"


PRESETS = {
    "original-overpower-1995": Preset(
        slug="original-overpower-1995",
        title="Original OverPower 1995 Checklist",
        subtitle=(
            "Standalone personal checklist generated from Excelsior's local OverPower documentation. "
            "Checkbox progress is saved in this browser and can be exported or connected to a portable JSON file."
        ),
        source_files=(
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/characters.md",
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/characters2.md",
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/special.md",
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/power.md",
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/universe.md",
            REPO_ROOT / "src/resources/legacy/marvelop/mvop-tables/md/missions.md",
        ),
        image_dir=REPO_ROOT / "src/resources/legacy/marvelop/images",
        price_collection="overpower-original-set",
        type_order=(
            "Character",
            "Special",
            "Power",
            "Universe - Basic",
            "Universe - Training",
            "Universe - Teamwork",
            "Mission",
            "Reference - List Card",
            "Reference - Crib Card",
        ),
        output=REPO_ROOT / "data/personal/original-overpower-1995-checklist.html",
        progress_output=REPO_ROOT / "data/personal/original-overpower-1995-checklist-progress.json",
        price_cache=REPO_ROOT / "data/personal/original-overpower-1995-prices.json",
    ),
    "powersurge": Preset(
        slug="powersurge",
        title="PowerSurge Checklist",
        subtitle=(
            "Standalone personal checklist generated from Excelsior's local PowerSurge documentation. "
            "Checkbox progress is saved in this browser and can be exported or connected to a portable JSON file."
        ),
        source_files=(
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--numbers--characters--rarity-512ae0986a.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--numbers--characters--rarity-5e94e1f2a0.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--control--numbers--game-text--characters--rarity-bd1d49c1d0.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--control--numbers--game-text--characters--rarity-efc8e46731.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--characters--rarity-6bdcb47e99.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--numbers--game-text--characters--rarity-b6d9cb625e.md",
            REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-md/type--characters--rarity-f98bb0d3db.md",
        ),
        image_dir=REPO_ROOT / "src/resources/legacy/powersurgeop/mission-control-images",
        price_collection="powersurge",
        type_order=(
            "Character",
            "Special",
            "Power",
            "Universe - Basic",
            "Universe - Training",
            "Universe - Teamwork",
            "Mission",
        ),
        output=REPO_ROOT / "data/personal/powersurge-checklist.html",
        progress_output=REPO_ROOT / "data/personal/powersurge-checklist-progress.json",
        price_cache=REPO_ROOT / "data/personal/powersurge-prices.json",
        order_file=REPO_ROOT / "src/resources/legacy/powersurgeop/manifest.csv",
        default_sort="number",
    ),
    "mission-control": Preset(
        slug="mission-control",
        title="Mission Control Checklist",
        subtitle=(
            "Standalone personal checklist generated from Excelsior's local Mission Control documentation. "
            "Checkbox progress is saved in this browser and can be exported or connected to a portable JSON file."
        ),
        source_files=(
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--numbers--characters--rarity-512ae0986a.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--numbers--characters--rarity-5e94e1f2a0.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--numbers--characters--rarity-a98b10208a.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--control--numbers--game-text--characters--rarity-bd1d49c1d0.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--characters--rarity-6bdcb47e99.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--game-text--characters--rarity-132451d720.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--game-text--characters--rarity-52df3a7d15.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--game-text--characters--rarity-a98f8e960f.md",
            REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-md/type--rarity-27763a2b54.md",
        ),
        image_dir=REPO_ROOT / "src/resources/legacy/missioncontrolop/mission-control-images",
        price_collection="mission-control",
        type_order=(
            "Character",
            "Special",
            "Mission",
            "Event",
            "Insert",
        ),
        output=REPO_ROOT / "data/personal/mission-control-checklist.html",
        progress_output=REPO_ROOT / "data/personal/mission-control-checklist-progress.json",
        price_cache=REPO_ROOT / "data/personal/mission-control-prices.json",
        order_file=REPO_ROOT / "src/resources/legacy/missioncontrolop/manifest.csv",
        default_sort="number",
    ),
    "dc-overpower-batman-superman": Preset(
        slug="dc-overpower-batman-superman",
        title="DC OverPower Batman/Superman Checklist",
        subtitle=(
            "Standalone personal checklist generated from Excelsior's local DC OverPower Batman/Superman documentation. "
            "Checkbox progress is saved in this browser and can be exported or connected to a portable JSON file."
        ),
        source_files=(
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--characters--rarity-6bdcb47e99.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--characters--rarity-f98bb0d3db.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--control--numbers--game-text--characters--rarity-3028e2ea6e.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--game-text--characters--rarity-132451d720.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--numbers--characters--rarity-5db0deff64.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--numbers--characters--rarity-a5c928cd31.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--numbers--characters--rarity-bcc6a4c707.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--numbers--game-text--characters--rarity-b6d9cb625e.md",
            REPO_ROOT / "src/resources/legacy/dcop/mission-control-md/type--numbers--game-text--characters--rarity-baddda311d.md",
        ),
        image_dir=REPO_ROOT / "src/resources/legacy/dcop/mission-control-images",
        price_collection="dc",
        type_order=(
            "Character",
            "Special",
            "Power",
            "Universe - Basic",
            "Universe - Training",
            "Universe - Teamwork",
            "Mission",
            "Event",
        ),
        output=REPO_ROOT / "data/personal/dc-overpower-batman-superman-checklist.html",
        progress_output=REPO_ROOT / "data/personal/dc-overpower-batman-superman-checklist-progress.json",
        price_cache=REPO_ROOT / "data/personal/dc-overpower-batman-superman-prices.json",
        order_file=REPO_ROOT / "src/resources/legacy/dcop/manifest.csv",
        default_sort="number",
    ),
    "iq-overpower": Preset(
        slug="iq-overpower",
        title="IQ OverPower Checklist",
        subtitle=(
            "Standalone personal checklist generated from Excelsior's local IQ OverPower documentation. "
            "Checkbox progress is saved in this browser and can be exported or connected to a portable JSON file."
        ),
        source_files=(
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--characters--rarity-6bdcb47e99.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--control--numbers--game-text--characters--rarity-6b522b190a.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--control--numbers--game-text--characters--rarity-bd1d49c1d0.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--numbers--characters--rarity-512ae0986a.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--numbers--characters--rarity-5e94e1f2a0.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--numbers--game-text--characters--rarity-80a479084f.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--numbers--game-text--characters--rarity-b6d9cb625e.md",
            REPO_ROOT / "src/resources/legacy/iqop/mission-control-md/type--numbers--game-text--characters--rarity-c89c5505c2.md",
        ),
        image_dir=REPO_ROOT / "src/resources/legacy/iqop/mission-control-images",
        price_collection="iq",
        type_order=(
            "Character",
            "Special",
            "Power",
            "Universe - Basic",
            "Universe - Training",
            "Universe - Teamwork",
        ),
        output=REPO_ROOT / "data/personal/iq-overpower-checklist.html",
        progress_output=REPO_ROOT / "data/personal/iq-overpower-checklist-progress.json",
        price_cache=REPO_ROOT / "data/personal/iq-overpower-prices.json",
        order_file=REPO_ROOT / "src/resources/legacy/iqop/manifest.csv",
        default_sort="number",
    ),
}


@dataclass
class Card:
    card_id: str
    name: str
    type: str
    rarity: str
    image: str
    source: str
    card_number: int | None = None
    price: str = "No TOK price"
    price_source: str = ""


def normalize_ascii(value: str) -> str:
    value = value.replace("™", "")
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"\bTM\b", "", value)
    return re.sub(r"\s+", " ", value).strip()


def slug_text(value: str) -> str:
    value = normalize_ascii(value).casefold().replace("&", " and ")
    value = re.sub(r"[^a-z0-9+]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def split_markdown_row(line: str) -> list[str]:
    cells = line.strip().strip("|").split("|")
    return [cell.strip().replace("\\|", "|") for cell in cells]


def parse_markdown_table(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    header: list[str] | None = None
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("|") or not line.endswith("|"):
            continue
        cells = split_markdown_row(line)
        if header is None:
            header = cells
            continue
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        if len(cells) != len(header):
            continue
        rows.append(dict(zip(header, cells)))
    return rows


def display_type(row: dict[str, str]) -> str:
    card_type = row.get("Type", "").strip()
    subtype = row.get("Subtype", "").strip()
    if card_type == "Universe":
        if subtype in {"Training", "Teamwork"}:
            return f"Universe - {subtype}"
        return "Universe - Basic"
    if card_type == "List Card":
        return "Reference - List Card"
    if card_type == "Crib Card":
        return "Reference - Crib Card"
    return card_type or "Unknown"


def load_card_number_map(preset: Preset) -> dict[str, list[int]]:
    if preset.order_file is None or not preset.order_file.exists():
        return {}
    with preset.order_file.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    order: dict[str, list[int]] = {}
    for index, row in enumerate(rows, start=1):
        image = row.get("ImageName", "").strip()
        name = normalize_ascii(row.get("Name", ""))
        if image and name:
            order.setdefault(f"card:{slug_text(name)}|{image}", []).append(index)
        if image and image != PLACEHOLDER_IMAGE:
            order.setdefault(f"image:{image}", []).append(index)
        if name:
            order.setdefault(f"name:{slug_text(name)}", []).append(index)
    return order


def load_cards(preset: Preset) -> list[Card]:
    cards: list[Card] = []
    card_numbers = load_card_number_map(preset)
    claimed_card_numbers: set[int] = set()

    def claim_card_number(keys: tuple[str, ...]) -> int:
        for key in keys:
            for candidate in card_numbers.get(key, []):
                if candidate not in claimed_card_numbers:
                    claimed_card_numbers.add(candidate)
                    return candidate
        candidate = len(cards) + 1
        while candidate in claimed_card_numbers:
            candidate += 1
        claimed_card_numbers.add(candidate)
        return candidate

    for source_path in preset.source_files:
        rows = parse_markdown_table(source_path)
        for index, row in enumerate(rows):
            source_name = normalize_ascii(row.get("Name", ""))
            image = row.get("Image", "").strip()
            name = CARD_NAME_FIXES_BY_IMAGE.get(image, source_name)
            if not name:
                continue
            card_number = claim_card_number(
                (
                    f"card:{slug_text(source_name)}|{image}",
                    f"image:{image}",
                    f"name:{slug_text(source_name)}",
                )
            )
            cards.append(
                Card(
                    card_id=f"{source_path.name}:{index}:{image}",
                    name=name,
                    type=display_type(row),
                    rarity=row.get("Rarity", "").strip() or "Unknown",
                    image=image,
                    source=source_path.name,
                    card_number=card_number,
                )
            )
    return cards


def load_seed_progress(path: Path | None) -> dict[str, bool]:
    if path is None or not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8") or "{}")
    checked = payload.get("checked", payload) if isinstance(payload, dict) else {}
    return {str(key): True for key, value in checked.items() if value}


def write_initial_progress(path: Path, cards: list[Card], state: dict[str, bool]) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": f"{path.stem}/v1",
        "updatedAt": date.today().isoformat(),
        "cardCount": len(cards),
        "checkedCount": len(state),
        "checked": state,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_price_cache(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8") or "{}")
    if not isinstance(payload, dict):
        return {}
    prices = payload.get("prices", payload)
    if not isinstance(prices, dict):
        return {}
    return {
        str(key): value
        for key, value in prices.items()
        if isinstance(value, dict) and "price" in value
    }


def clean_mission_title(value: str) -> str:
    value = value.strip().strip('"')
    value = value.replace("'round", "round")
    value = re.sub(r"[?]", "", value)
    return re.sub(r"\s+", " ", value).strip()


def stat_abbrev(value: str) -> str:
    return {"Energy": "E", "Fighting": "F", "Strength": "S", "Intellect": "I", "MultiPower": "M"}.get(value, value[:1])


def power_product_stat(value: str) -> str:
    return {
        "Energy": "energy",
        "Fighting": "fight",
        "Strength": "strength",
        "Intellect": "intellect",
        "MultiPower": "multi",
    }.get(value, value.lower())


def compact_stat_pair(first: str, second: str) -> str:
    letters = [stat_abbrev(first), stat_abbrev(second)]
    order = {"E": 1, "F": 2, "S": 3, "I": 4}
    return "".join(sorted(letters, key=lambda letter: order.get(letter, 99)))


def price_query_variants(card: Card) -> list[str]:
    name = card.name
    variants: list[str] = []
    typo_fixes = {
        "Annihilation Affair - Infinity Army Scatters!": "Age of Apocalypse - Infinite Army Scatters!",
        "Bishop - Absorp Energy": "Bishop - Absorb Energy",
        "Inivisible Woman - Invisibility": "Invisible Woman - Invisibility",
        "Blac Cat - Cat Fight": "Black Cat - Cat Fight",
        "Blob - Absorp Impact": "Blob - Absorb Impact",
        "Comm. Gordon and the G.C.P.D.": "Comm. Gordon & G.C.P.D.",
        "Doctor Doom - Expandable Ally": "Doctor Doom - Expendable Ally",
        "Domino - Trip Wire": "Domino - Tripwire",
        "Dr. Strange - Crimson Band of Cytorak": "Doctor Strange - Crimson Bands of Cytorak",
        "Dr. Strange - Eldritch Blasts": "Doctor Strange - Eldritch Blasts",
        "Dr. Strange - Eye of Agamotto": "Doctor Strange - Eye of Agamotto",
        "Dr. Strange - Mists of Morpheus": "Doctor Strange - Mists of Morpheus",
        "Dr. Strange - Necromancy": "Doctor Strange - Necromancy",
        "Dr. Strange - Sorcerer Supreme": "Doctor Strange - Sorcerer Supreme",
        "Dark Phoenix Saga 6 - \"Deady Rebirth\"": "Dark Phoenix Saga 6 - \"Deadly Rebirth\"",
        "Fatal Attractions - The Best Laid Plans...": "Fatal Attractions - The Best Laid Pans...",
        "Huntres - Crossbow": "Huntress - Crossbow",
        "Inivisible Woman - Invisible Saboteur": "Invisible Woman - Invisible Saboteur",
        "Omega Red - Secret Pheromones": "Omega Red - Secrete Pheromones",
        "Penguin - Flamethrower Umbrella": "Penguin - Flame Thrower Umbrella",
        "Superboy - Cool Glasses": "Superboy - Cool Shades",
        "Two-Face - Tommygun": "Two-Face - Tommy Gun",
        "Maximum Carnage 1 of 7 - \"A Luncatic on the Loose\"": "Maximum Carnage 1 A Lunatic on the Loose",
    }
    if name in typo_fixes:
        variants.insert(0, typo_fixes[name])
    canonical_name = typo_fixes.get(name, name)

    without_sic = re.sub(r"\s+\(sic\)", "", name)
    if without_sic != name:
        variants.append(without_sic)
    if card.type == "Character":
        variants.insert(0, f"{without_sic} DC character")
    if "She Hulk" in without_sic:
        variants.append(without_sic.replace("She Hulk", "She-Hulk"))
    if "Super Skrull" in without_sic:
        variants.append(without_sic.replace("Fists of Strength", "Fists of Stone"))
        variants.append(without_sic.replace("Imitation", "Immitation"))
    if "Dr. Strange" in name:
        variants.append(name.replace("Dr. Strange", "Doctor Strange"))

    mission = re.match(r"^(.+?)\s+(\d+)(?:\s+of\s+7)?\s+-\s+\"?(.*?)\"?$", canonical_name)
    if card.type == "Mission" and mission:
        series, number, title = mission.groups()
        title = clean_mission_title(title)
        series_variants = [series]
        if series.casefold().startswith("the "):
            series_variants.append(f"{series[4:]}, The")
        if title:
            for series_variant in series_variants:
                variants.extend(
                    [
                        f"{series_variant} Mission {number} DC",
                        f"{series_variant} Mission {number} {title}",
                        f"{series_variant} {number} of 7 {title}",
                        f"{series_variant} {number} {title}",
                        f"{series_variant} Mission {number}",
                        f"{series_variant} {number}",
                    ]
                )
        else:
            for series_variant in series_variants:
                variants.extend(
                    [
                        f"{series_variant} Mission {number} DC",
                        f"{series_variant} Mission {number}",
                        f"{series_variant} {number}",
                    ]
                )

    event = re.match(r"^(.+?)\s+-\s+Justice League Case Files?\s+#\d+\.(\d+)$", canonical_name)
    if card.type == "Event" and event:
        series, file_number = event.groups()
        variants.extend(
            [
                f"{series} Event - File {file_number}",
                f"{series} Event File {file_number}",
            ]
        )

    power = re.match(r"^(\d+)\s+(Energy|Fighting|Strength|Intellect|MultiPower)$", name)
    if card.type == "Power" and power:
        number, stat = power.groups()
        variants.extend(
            [
                f"POWER {number}{stat_abbrev(stat)}",
                f"POWER {number} {power_product_stat(stat)}",
                f"{stat} {number}",
                f"{number}{stat_abbrev(stat)}",
                f"{stat} {number} OP",
            ]
        )

    training = re.match(
        r"^(\d+)\s+(Energy|Fighting|Strength|Intellect)\s+(Energy|Fighting|Strength|Intellect)\s+(\+\d+)$",
        name,
    )
    if card.type == "Universe - Training" and training:
        cap, first, second, bonus = training.groups()
        variants.extend(
            [
                f"TRAINING {cap}{stat_abbrev(first)}{stat_abbrev(second)} {bonus}",
                f"TRAINING {cap}{compact_stat_pair(first, second)} {bonus}",
                f"Training {cap} {first} {second} {bonus}",
                f"TR {cap}{stat_abbrev(first)} {stat_abbrev(second)} {bonus.replace('+', '')}",
            ]
        )

    teamwork = re.match(
        r"^(\d+)\s+(Energy|Fighting|Strength|Intellect)\s+(Energy|Fighting|Strength|Intellect)/(Energy|Fighting|Strength|Intellect)\s+(\+\d+)\s+(\+\d+)$",
        name,
    )
    if card.type == "Universe - Teamwork" and teamwork:
        level, primary, second, third, first_bonus, second_bonus = teamwork.groups()
        variants.extend(
            [
                (
                    f"TEAMWORK {level}{stat_abbrev(primary)} "
                    f"{stat_abbrev(second)}{stat_abbrev(third)} "
                    f"{first_bonus}{second_bonus}"
                ),
                (
                    f"TEAMWORK {level}{stat_abbrev(primary)} "
                    f"{stat_abbrev(third)}{stat_abbrev(second)} "
                    f"{first_bonus}{second_bonus}"
                ),
                (
                    f"TW {level}{stat_abbrev(primary)} "
                    f"{stat_abbrev(second)}{stat_abbrev(third)} "
                    f"{first_bonus.replace('+', '')} {second_bonus.replace('+', '')}"
                ),
                f"Teamwork {level} {primary} {second} {third} {first_bonus} {second_bonus}",
            ]
        )

    if card.type == "Universe - Basic":
        variants.extend([f"{name} Universe", f"{name} OP"])

    variants.append(name)

    deduped: list[str] = []
    seen: set[str] = set()
    for variant in variants:
        key = slug_text(variant)
        if key and key not in seen:
            seen.add(key)
            deduped.append(variant)
    return deduped


def save_price_cache(path: Path, prices: dict[str, dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": "The Orange King",
        "fetchedAt": date.today().isoformat(),
        "prices": prices,
    }
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def import_orange_price_module() -> Any:
    spec = importlib.util.spec_from_file_location("orange_king_price", ORANGE_SKILL)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not import {ORANGE_SKILL}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["orange_king_price"] = module
    previous_bytecode_setting = sys.dont_write_bytecode
    sys.dont_write_bytecode = True
    try:
        spec.loader.exec_module(module)
    finally:
        sys.dont_write_bytecode = previous_bytecode_setting
    return module


def attach_prices(cards: list[Card], cache_path: Path, collection: str) -> tuple[int, int]:
    cache = load_price_cache(cache_path)
    orange = import_orange_price_module()
    products = orange.fetch_collection_products(orange.collection_handle(collection) or collection)
    priced = 0
    missing = 0

    def is_single_card_product(product: Any) -> bool:
        title = slug_text(str(product.title))
        return not re.search(r"\b(?:lot|player|set)\b", title)

    for card in cards:
        key = f"{card.type}|{card.name}"
        cached = cache.get(key)
        if cached and cached.get("price") != "No TOK price":
            card.price = cached.get("price", "No TOK price")
            card.price_source = cached.get("url", "")
        else:
            card.price = "No TOK price"
            card.price_source = ""
            for query in price_query_variants(card):
                try:
                    product, _ranked = orange.find_best(query, products)
                    if not is_single_card_product(product):
                        continue
                    card.price = f"${Decimal(product.price):.2f}"
                    card.price_source = product.url
                    break
                except Exception:
                    continue
            if not card.price_source:
                for query in price_query_variants(card)[:4]:
                    try:
                        suggested_products = orange.fetch_suggest_products(query, 10)
                        product, _ranked = orange.find_best(query, suggested_products)
                        if not is_single_card_product(product):
                            continue
                        card.price = f"${Decimal(product.price):.2f}"
                        card.price_source = product.url
                        break
                    except Exception:
                        continue
            cache[key] = {"price": card.price, "url": card.price_source}

        if card.price_source:
            priced += 1
        else:
            missing += 1

    save_price_cache(cache_path, cache)
    return priced, missing


def format_js_object(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, separators=(",", ":"))


def price_tier_class(price: str, price_source: str) -> str:
    if not price_source:
        return "card-price is-missing"
    match = re.search(r"\$?([0-9]+(?:\.[0-9]{1,2})?)", price)
    if not match:
        return "card-price is-missing"
    amount = Decimal(match.group(1))
    if amount <= Decimal("0.50"):
        return "card-price price-tier-050"
    if amount <= Decimal("1.99"):
        return "card-price price-tier-199"
    if amount <= Decimal("4.99"):
        return "card-price price-tier-499"
    if amount <= Decimal("9.99"):
        return "card-price price-tier-999"
    if amount <= Decimal("19.99"):
        return "card-price price-tier-1999"
    return "card-price price-tier-2000"


def html_row(card: Card, checked: bool) -> str:
    checked_attr = " checked" if checked else ""
    price_class = price_tier_class(card.price, card.price_source)
    price_modifier = next((part for part in price_class.split() if part.startswith("price-tier-")), "")
    if not price_modifier and "is-missing" in price_class.split():
        price_modifier = "is-missing"
    price_title = "The Orange King listed price" if card.price_source else "No matching The Orange King product"
    card_number = f"{card.card_number:03d}" if card.card_number is not None else ""
    number_pill = f"<span>#{card_number}</span>" if card_number else ""
    return f"""
      <label class="card-row" data-card-row data-type="{html.escape(card.type, quote=True)}" data-rarity="{html.escape(card.rarity, quote=True)}" data-name="{html.escape(slug_text(card.name), quote=True)}" data-number="{card_number}" data-price="{html.escape(card.price, quote=True)}" data-price-tier="{html.escape(price_modifier, quote=True)}" data-price-source="{html.escape(card.price_source, quote=True)}">
        <input type="checkbox" data-card-id="{html.escape(card.card_id, quote=True)}"{checked_attr} />
        <span class="check-face" aria-hidden="true"></span>
        <span class="card-main">
          <span class="card-name">{html.escape(card.name)}</span>
          <span class="card-meta">{number_pill}<span>{html.escape(card.type)}</span><span>{html.escape(card.rarity)}</span><span class="{price_class}" title="{html.escape(price_title, quote=True)}">{html.escape(card.price)}</span></span>
        </span>
      </label>"""


def render_html(
    *,
    preset: Preset,
    cards: list[Card],
    output: Path,
    progress_output: Path,
    seed_state: dict[str, bool],
    image_base_url: str,
    priced_count: int,
    missing_price_count: int,
) -> str:
    type_counts = Counter(card.type for card in cards)
    type_options = "\n".join(
        f'          <option value="{html.escape(card_type, quote=True)}">{html.escape(card_type)} ({type_counts[card_type]})</option>'
        for card_type in preset.type_order
        if type_counts[card_type]
    )
    chips = "\n".join(
        f'        <span class="chip"><span>{html.escape(card_type)}</span><strong>{type_counts[card_type]}</strong></span>'
        for card_type in preset.type_order
        if type_counts[card_type]
    )
    type_rank = {card_type: index + 1 for index, card_type in enumerate(preset.type_order)}
    def initial_sort_key(card: Card) -> tuple[Any, ...]:
        if preset.default_sort == "number":
            return (card.card_number is None, card.card_number or 999999, slug_text(card.name), card.card_id)
        return (type_rank.get(card.type, 99), slug_text(card.name), card.card_id)

    sorted_cards = sorted(cards, key=initial_sort_key)
    rows = "\n".join(html_row(card, seed_state.get(card.card_id, False)) for card in sorted_cards)
    source_files = ", ".join(f"<code>{html.escape(str(path.relative_to(REPO_ROOT)))}</code>" for path in preset.source_files)
    scan_count = sum(1 for card in cards if card.image and card.image != PLACEHOLDER_IMAGE and (preset.image_dir / card.image).exists())
    price_note = (
        f"Prices are listed product prices from The Orange King Shopify data fetched on {date.today().isoformat()}; "
        "shipping, tax, discounts, and cart behavior are not included. "
        f"{priced_count} cards have matched prices and {missing_price_count} cards are marked <code>No TOK price</code>."
    )
    if preset.order_file:
        number_note = f"Card-number order comes from <code>{html.escape(str(preset.order_file.relative_to(REPO_ROOT)))}</code>."
    else:
        number_note = "Card-number order uses stable <code>#001...</code> numbering from the configured source-file order because these local source files do not include printed collector numbers."
    progress_name = progress_output.name
    source_note = (
        f"Source files: {source_files}. Images load from <code>{html.escape(str(preset.image_dir))}</code>. "
        f"Generated on {date.today().isoformat()} from local files. {number_note} {price_note}"
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(preset.title)}</title>
  <style>
    :root {{
      --color-bg-base: #070b16;
      --color-bg-surface: #0d1526;
      --color-bg-elevated: #141f35;
      --color-bg-input: #0a1220;
      --color-bg-hover: #18243d;
      --color-accent: #00c8e8;
      --color-accent-bright: #00e5ff;
      --color-accent-soft: rgba(0, 200, 232, .14);
      --color-accent-glow: rgba(0, 229, 255, .35);
      --color-text: #e8edf7;
      --color-text-muted: #8aa0c2;
      --color-text-on-accent: #021018;
      --color-border: #1d2c47;
      --color-border-strong: #2a3e63;
      --color-border-accent: rgba(0, 200, 232, .45);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-8: 32px;
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}

    * {{ box-sizing: border-box; }}

    body {{
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top left, rgba(0, 200, 232, .10), transparent 28rem), var(--color-bg-base);
      color: var(--color-text);
    }}

    .shell {{
      width: min(1480px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 36px 0 48px;
    }}

    header {{
      display: flex;
      justify-content: space-between;
      gap: var(--space-6);
      align-items: flex-start;
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }}

    h1 {{
      margin: 0 0 var(--space-2);
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.05;
      letter-spacing: 0;
    }}

    .subtitle {{
      margin: 0;
      max-width: 760px;
      color: var(--color-text-muted);
      line-height: 1.55;
    }}

    .progress-card {{
      min-width: 220px;
      padding: var(--space-4);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
      box-shadow: 0 18px 45px rgba(0, 0, 0, .25);
    }}

    .progress-number {{
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-accent-bright);
    }}

    .progress-label {{
      color: var(--color-text-muted);
      font-size: .9rem;
    }}

    progress {{
      width: 100%;
      height: 10px;
      margin-top: var(--space-3);
      accent-color: var(--color-accent);
    }}

    .toolbar {{
      position: sticky;
      top: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: minmax(220px, 1fr) minmax(180px, 260px) minmax(170px, 230px) max-content;
      gap: 10px;
      align-items: center;
      margin: var(--space-6) 0;
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: rgba(13, 21, 38, .96);
      backdrop-filter: blur(14px);
    }}

    .toolbar-actions {{
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      white-space: nowrap;
    }}

    input[type="search"], select {{
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-input);
      color: var(--color-text);
      padding: 0 var(--space-3);
      font: inherit;
    }}

    button, .file-button {{
      min-height: 34px;
      border: 1px solid var(--color-border-accent);
      border-radius: var(--radius-md);
      background: var(--color-accent-soft);
      color: var(--color-text);
      padding: 0 13px;
      font: inherit;
      font-size: .8rem;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }}

    button:hover, .file-button:hover {{ background: var(--color-bg-hover); }}
    button.is-connected {{ background: var(--color-accent); border-color: var(--color-accent-bright); color: var(--color-text-on-accent); }}
    .file-button input {{ display: none; }}

    .persist-status {{
      margin: calc(var(--space-6) * -1 + 8px) 0 var(--space-5);
      color: var(--color-text-muted);
      font-size: .85rem;
      line-height: 1.45;
    }}

    .persist-status strong {{ color: var(--color-text); }}

    .chips {{
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }}

    .chip {{
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 6px 10px;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: var(--color-bg-surface);
      color: var(--color-text-muted);
      font-size: .85rem;
    }}

    .chip strong {{ color: var(--color-text); }}

    .checklist-workbench {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
      gap: var(--space-5);
      align-items: start;
    }}

    .list {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-3);
      min-width: 0;
    }}

    .card-row {{
      display: grid;
      grid-template-columns: 20px 1fr;
      gap: var(--space-3);
      align-items: start;
      min-height: 62px;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-surface);
      cursor: pointer;
      transition: border-color .15s ease, background .15s ease;
    }}

    .card-row:hover {{ border-color: var(--color-border-accent); background: var(--color-bg-hover); }}
    .card-row.is-previewed {{ border-color: var(--color-border-accent); box-shadow: inset 3px 0 0 var(--color-accent); }}
    .card-row.is-checked {{ border-color: var(--color-border-accent); background: var(--color-accent-soft); }}
    .card-row input {{ position: absolute; opacity: 0; pointer-events: none; }}

    .check-face {{
      width: 20px;
      height: 20px;
      margin-top: 1px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-input);
      display: grid;
      place-items: center;
    }}

    .card-row input:focus-visible + .check-face {{ outline: 2px solid var(--color-border-accent); outline-offset: 2px; }}
    .card-row input:checked + .check-face {{ border-color: var(--color-border-accent); background: var(--color-accent-soft); box-shadow: 0 0 0 1px var(--color-accent-glow); }}
    .card-row input:checked + .check-face::after {{
      content: "";
      width: 10px;
      height: 6px;
      border-left: 2px solid var(--color-accent-bright);
      border-bottom: 2px solid var(--color-accent-bright);
      transform: rotate(-45deg) translate(1px, -1px);
    }}

    .card-main {{ min-width: 0; }}
    .card-name {{ display: block; color: var(--color-text); font-weight: 650; line-height: 1.25; overflow-wrap: anywhere; }}
    .card-row.is-checked .card-name {{ text-decoration: line-through; text-decoration-color: var(--color-accent-bright); }}

    .card-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
      color: var(--color-text-muted);
      font-size: .8rem;
    }}

    .card-meta span, .preview-panel__meta span {{
      padding: 2px 7px;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: rgba(10, 18, 32, .75);
    }}

    .card-meta .card-price,
    .preview-panel__meta .card-price {{
      font-variant-numeric: tabular-nums;
      font-weight: 700;
    }}

    .card-meta .card-price.is-missing,
    .preview-panel__meta .card-price.is-missing {{
      font-variant-numeric: normal;
      color: var(--color-text-muted);
    }}

    .price-tier-050 {{
      color: #56647a;
      border-color: #1b283f !important;
      background: rgba(10, 18, 32, .72) !important;
    }}

    .price-tier-199 {{
      color: #8895a8;
      border-color: #24344f !important;
      background: rgba(14, 23, 38, .78) !important;
    }}

    .price-tier-499 {{
      color: #c7d0df;
      border-color: #344762 !important;
      background: rgba(18, 29, 48, .82) !important;
    }}

    .price-tier-999 {{
      color: #f2f6fb;
      border-color: #455b79 !important;
      background: rgba(23, 36, 58, .88) !important;
    }}

    .price-tier-1999 {{
      color: var(--color-accent-bright);
      border-color: var(--color-border-accent) !important;
      background: var(--color-accent-soft) !important;
    }}

    .price-tier-2000 {{
      color: #ff6b6b;
      border-color: rgba(255, 107, 107, .55) !important;
      background: rgba(255, 107, 107, .12) !important;
    }}

    .preview-panel {{
      position: sticky;
      top: calc(var(--space-4) + 82px);
      display: grid;
      grid-template-rows: max-content minmax(0, 1fr) max-content;
      gap: var(--space-3);
      max-height: calc(100vh - 112px);
      min-height: 540px;
      padding: var(--space-4);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
      box-shadow: 0 18px 45px rgba(0, 0, 0, .25);
    }}

    .preview-panel__header {{ min-width: 0; padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); }}
    .preview-panel__eyebrow {{ margin: 0 0 6px; color: var(--color-accent-bright); font-size: .78rem; font-weight: 700; text-transform: uppercase; }}
    .preview-panel__title {{ margin: 0; color: var(--color-text); font-size: 1.05rem; line-height: 1.25; overflow-wrap: anywhere; }}
    .preview-panel__meta {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; color: var(--color-text-muted); font-size: .78rem; }}
    .preview-panel__image-wrap {{ display: flex; align-items: center; justify-content: center; min-height: 0; overflow: hidden; }}
    .preview-panel__image {{ display: block; width: 100%; height: 100%; max-height: 100%; object-fit: contain; border-radius: var(--radius-md); }}
    .preview-panel__empty {{ display: none; align-items: center; justify-content: center; width: 100%; min-height: 320px; border: 1px dashed var(--color-border); border-radius: var(--radius-md); color: var(--color-text-muted); text-align: center; }}
    .preview-panel.is-empty .preview-panel__image {{ display: none; }}
    .preview-panel.is-empty .preview-panel__empty {{ display: flex; }}
    .preview-panel__note {{ margin: 0; padding-top: var(--space-3); border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: .82rem; line-height: 1.45; }}
    .source-note {{ margin-top: var(--space-8); padding-top: var(--space-5); border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: .9rem; line-height: 1.55; }}
    .hidden {{ display: none !important; }}

    @media (max-width: 1180px) {{
      .checklist-workbench {{ grid-template-columns: minmax(0, 1fr) minmax(260px, 320px); }}
      .list {{ grid-template-columns: 1fr; }}
    }}

    @media (max-width: 820px) {{
      header, .toolbar {{ grid-template-columns: 1fr; display: grid; }}
      .progress-card {{ min-width: 0; }}
      .checklist-workbench {{ grid-template-columns: 1fr; }}
      .preview-panel {{ position: static; min-height: 420px; max-height: none; }}
      .shell {{ width: min(100vw - 24px, 1180px); padding-top: 24px; }}
    }}
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div>
        <h1>{html.escape(preset.title)}</h1>
        <p class="subtitle">{html.escape(preset.subtitle)}</p>
      </div>
      <section class="progress-card" aria-label="Checklist progress">
        <span class="progress-number" id="progressText">0 / {len(cards)}</span>
        <span class="progress-label">cards checked</span>
        <progress id="progressBar" max="{len(cards)}" value="0"></progress>
      </section>
    </header>

    <section class="toolbar" aria-label="Checklist controls">
      <input id="search" type="search" placeholder="Search cards" autocomplete="off" />
      <select id="typeFilter" aria-label="Filter by type">
        <option value="all">All types ({len(cards)})</option>
{type_options}
      </select>
      <select id="sortOrder" aria-label="Sort cards">
        <option value="number"{' selected' if preset.default_sort == 'number' else ''}>Sort: Card number</option>
        <option value="type"{' selected' if preset.default_sort == 'type' else ''}>Sort: Type, then name</option>
        <option value="name"{' selected' if preset.default_sort == 'name' else ''}>Sort: Name</option>
        <option value="rarity"{' selected' if preset.default_sort == 'rarity' else ''}>Sort: Rarity, then name</option>
      </select>
      <div class="toolbar-actions" aria-label="Progress actions">
        <button id="connectProgressFile" type="button">Connect File</button>
        <button id="clearVisible" type="button">Clear Visible</button>
        <button id="exportProgress" type="button">Export</button>
        <label class="file-button">Import<input id="importProgress" type="file" accept="application/json" /></label>
      </div>
    </section>

    <p class="persist-status" id="persistStatus">
      Progress is cached in this browser. Connect <strong>{html.escape(progress_name)}</strong> to write every checkbox change into the Excelsior project.
    </p>

    <section class="chips" aria-label="Card type counts">
{chips}
    </section>

    <div class="checklist-workbench">
      <section class="list" id="cardList" aria-label="Cards">
{rows}
      </section>

      <aside class="preview-panel is-empty" id="previewPanel" aria-label="Card image preview">
        <header class="preview-panel__header">
          <p class="preview-panel__eyebrow">Card Preview</p>
          <h2 class="preview-panel__title" id="previewTitle">Hover a card</h2>
          <div class="preview-panel__meta" id="previewMeta">
            <span>Images load from the local Excelsior card folder</span>
          </div>
        </header>
        <div class="preview-panel__image-wrap">
          <img class="preview-panel__image" id="previewImage" alt="" />
          <div class="preview-panel__empty" id="previewEmpty">Hover a checklist row to see the full card image.</div>
        </div>
        <p class="preview-panel__note" id="previewNote">{scan_count} cards have local scans. Placeholder rows use the local source placeholder art.</p>
      </aside>
    </div>

    <p class="source-note">{source_note}</p>
  </main>

  <script>
    const progressSchema = '{preset.slug}-checklist-progress/v1';
    const storageKey = '{preset.slug}-checklist:v1';
    const fileHandleDbName = '{preset.slug}-checklist';
    const fileHandleStoreName = 'file-handles';
    const fileHandleKey = 'portable-progress-json';
    const seedState = {format_js_object(seed_state)};
    const boxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-card-id]'));
    const rows = Array.from(document.querySelectorAll('[data-card-row]'));
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const search = document.getElementById('search');
    const typeFilter = document.getElementById('typeFilter');
    const sortOrder = document.getElementById('sortOrder');
    const cardList = document.getElementById('cardList');
    const connectProgressFile = document.getElementById('connectProgressFile');
    const persistStatus = document.getElementById('persistStatus');
    const previewPanel = document.getElementById('previewPanel');
    const previewTitle = document.getElementById('previewTitle');
    const previewMeta = document.getElementById('previewMeta');
    const previewImage = document.getElementById('previewImage');
    const previewEmpty = document.getElementById('previewEmpty');
    const previewNote = document.getElementById('previewNote');
    const imageBaseUrl = '{image_base_url}';
    const placeholderImage = '{PLACEHOLDER_IMAGE}';
    let previewedRow = null;
    let portableFileHandle = null;
    let portableWriteQueue = Promise.resolve();
    const typeRank = {format_js_object(type_rank)};
    const rarityRank = {{ 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Ultra Rare': 4, 'SuperCommon': 5 }};

    rows.forEach((row, index) => {{
      row.dataset.sourceOrder = String(index);
      row.dataset.price = row.querySelector('.card-price')?.textContent.trim() || '';
    }});

    function loadState() {{
      try {{ return JSON.parse(localStorage.getItem(storageKey) || '{{}}'); }}
      catch {{ return {{}}; }}
    }}

    function normalizeProgressPayload(payload) {{
      if (!payload || typeof payload !== 'object') return {{}};
      const checked = payload.checked && typeof payload.checked === 'object' ? payload.checked : payload;
      return Object.fromEntries(Object.entries(checked).filter(([, value]) => Boolean(value)));
    }}

    function currentState() {{
      const state = {{}};
      boxes.forEach((box) => {{ if (box.checked) state[box.dataset.cardId] = true; }});
      return state;
    }}

    function buildProgressPayload(state = currentState()) {{
      return {{
        schema: progressSchema,
        updatedAt: new Date().toISOString(),
        cardCount: boxes.length,
        checkedCount: Object.keys(state).length,
        checked: state
      }};
    }}

    function setPersistStatus(message, connected = Boolean(portableFileHandle)) {{
      persistStatus.innerHTML = message;
      connectProgressFile.classList.toggle('is-connected', connected);
      connectProgressFile.textContent = connected ? 'File Connected' : 'Connect File';
    }}

    function saveState() {{
      const state = currentState();
      localStorage.setItem(storageKey, JSON.stringify(state));
      updateProgress();
      persistPortableState(state);
    }}

    function openFileHandleStore() {{
      return new Promise((resolve, reject) => {{
        const request = indexedDB.open(fileHandleDbName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(fileHandleStoreName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      }});
    }}

    async function getStoredFileHandle() {{
      const db = await openFileHandleStore();
      return new Promise((resolve, reject) => {{
        const transaction = db.transaction(fileHandleStoreName, 'readonly');
        const request = transaction.objectStore(fileHandleStoreName).get(fileHandleKey);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      }});
    }}

    async function setStoredFileHandle(handle) {{
      const db = await openFileHandleStore();
      return new Promise((resolve, reject) => {{
        const transaction = db.transaction(fileHandleStoreName, 'readwrite');
        transaction.objectStore(fileHandleStoreName).put(handle, fileHandleKey);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
      }});
    }}

    async function ensureReadWritePermission(handle) {{
      const options = {{ mode: 'readwrite' }};
      if ((await handle.queryPermission(options)) === 'granted') return true;
      return (await handle.requestPermission(options)) === 'granted';
    }}

    async function readPortableState(handle) {{
      try {{
        const file = await handle.getFile();
        return normalizeProgressPayload(JSON.parse(await file.text() || '{{}}'));
      }} catch {{
        return {{}};
      }}
    }}

    async function writePortableState(state = currentState()) {{
      if (!portableFileHandle) return false;
      if (!(await ensureReadWritePermission(portableFileHandle))) {{
        setPersistStatus('Progress is cached in this browser. File permission is needed to write the portable JSON.', false);
        return false;
      }}
      const writable = await portableFileHandle.createWritable();
      await writable.write(JSON.stringify(buildProgressPayload(state), null, 2) + '\\n');
      await writable.close();
      setPersistStatus(`Every checkbox change is writing to <strong>${{portableFileHandle.name}}</strong>. Last saved ${{new Date().toLocaleTimeString()}}.`, true);
      return true;
    }}

    function persistPortableState(state = currentState()) {{
      if (!portableFileHandle) return;
      const snapshot = {{ ...state }};
      portableWriteQueue = portableWriteQueue.then(() => writePortableState(snapshot)).catch((error) => {{
        setPersistStatus(`Progress is cached in this browser. Portable file write failed: ${{error.message}}`, false);
      }});
    }}

    function applyState(state) {{
      boxes.forEach((box) => {{ box.checked = Boolean(state[box.dataset.cardId]); }});
      localStorage.setItem(storageKey, JSON.stringify(currentState()));
      updateProgress();
    }}

    async function connectExistingProgressFile() {{
      if (!('showOpenFilePicker' in window) && !('showSaveFilePicker' in window)) {{
        setPersistStatus('This browser does not expose direct file writes from a local HTML page. Use Export as a manual fallback.', false);
        return;
      }}
      let handle = null;
      if ('showOpenFilePicker' in window) {{
        [handle] = await window.showOpenFilePicker({{ multiple: false, types: [{{ description: 'Checklist progress', accept: {{ 'application/json': ['.json'] }} }}] }});
      }} else {{
        handle = await window.showSaveFilePicker({{ suggestedName: '{html.escape(progress_name)}', types: [{{ description: 'Checklist progress', accept: {{ 'application/json': ['.json'] }} }}] }});
      }}
      if (!(await ensureReadWritePermission(handle))) {{
        setPersistStatus('Progress is cached in this browser. File permission was not granted.', false);
        return;
      }}
      portableFileHandle = handle;
      await setStoredFileHandle(handle);
      const mergedState = {{ ...await readPortableState(handle), ...currentState() }};
      applyState(mergedState);
      await writePortableState(mergedState);
    }}

    async function restoreConnectedProgressFile() {{
      try {{
        const handle = await getStoredFileHandle();
        if (!handle) return;
        portableFileHandle = handle;
        if (!(await ensureReadWritePermission(handle))) {{
          portableFileHandle = null;
          setPersistStatus('Progress is cached in this browser. Reconnect the project JSON file to resume automatic writes.', false);
          return;
        }}
        const mergedState = {{ ...await readPortableState(handle), ...normalizeProgressPayload(loadState()) }};
        applyState(mergedState);
        await writePortableState(mergedState);
      }} catch {{
        portableFileHandle = null;
      }}
    }}

    function updateProgress() {{
      let checked = 0;
      boxes.forEach((box) => {{
        const row = box.closest('[data-card-row]');
        row.classList.toggle('is-checked', box.checked);
        if (box.checked) checked += 1;
      }});
      progressText.textContent = checked + ' / ' + boxes.length;
      progressBar.value = checked;
    }}

    function cardInfoFromRow(row) {{
      const input = row.querySelector('input[type="checkbox"]');
      const idParts = input.dataset.cardId.split(':');
      const imageName = idParts.slice(2).join(':');
      const meta = Array.from(row.querySelectorAll('.card-meta span')).map((span) => span.textContent.trim());
      return {{
        name: row.querySelector('.card-name').textContent.trim(),
        number: row.dataset.number || '',
        type: row.dataset.type || meta[0] || '',
        rarity: row.dataset.rarity || '',
        price: row.dataset.price || '',
        priceTier: row.dataset.priceTier || '',
        imageName,
        hasPlaceholderImage: imageName === placeholderImage || !imageName
      }};
    }}

    function previewRow(row) {{
      if (!row) {{
        previewPanel.classList.add('is-empty');
        previewTitle.textContent = 'Hover a card';
        previewMeta.innerHTML = '<span>Images load from the local Excelsior card folder</span>';
        previewImage.removeAttribute('src');
        previewImage.alt = '';
        previewEmpty.textContent = 'Hover a checklist row to see the full card image.';
        previewNote.textContent = '{scan_count} cards have local scans. Placeholder rows use the local source placeholder art.';
        return;
      }}
      if (previewedRow) previewedRow.classList.remove('is-previewed');
      previewedRow = row;
      previewedRow.classList.add('is-previewed');
      const card = cardInfoFromRow(row);
      previewPanel.classList.remove('is-empty');
      previewTitle.textContent = card.name;
      previewMeta.innerHTML = '';
      [
        {{ value: card.number ? '#' + card.number : '' }},
        {{ value: card.type }},
        {{ value: card.rarity }},
        {{ value: card.price, className: ['card-price', card.priceTier].filter(Boolean).join(' ') }}
      ].filter((item) => item.value).forEach((item) => {{
        const chip = document.createElement('span');
        chip.textContent = item.value;
        if (item.className) chip.className = item.className;
        previewMeta.appendChild(chip);
      }});
      if (card.imageName) {{
        previewImage.src = imageBaseUrl + encodeURIComponent(card.imageName);
        previewImage.alt = card.name;
      }} else {{
        previewImage.removeAttribute('src');
      }}
      previewNote.textContent = card.hasPlaceholderImage
        ? 'The local source has placeholder art for this row.'
        : 'Hover or focus another row to keep comparing cards while you search your collection.';
    }}

    previewImage.addEventListener('error', () => {{
      previewPanel.classList.add('is-empty');
      previewEmpty.textContent = 'No local scan found for this row.';
    }});

    function applyFilters() {{
      const needle = search.value.trim().toLowerCase();
      const type = typeFilter.value;
      rows.forEach((row) => {{
        const matchesName = !needle || row.dataset.name.includes(needle);
        const matchesType = type === 'all' || row.dataset.type === type;
        row.classList.toggle('hidden', !(matchesName && matchesType));
      }});
      if (!previewedRow || previewedRow.classList.contains('hidden')) {{
        previewRow(rows.find((row) => !row.classList.contains('hidden')) || null);
      }}
    }}

    function applySort() {{
      const mode = sortOrder.value;
      const sortedRows = rows.slice().sort((a, b) => {{
        if (mode === 'type') {{
          const typeDelta = (typeRank[a.dataset.type] || 99) - (typeRank[b.dataset.type] || 99);
          if (typeDelta) return typeDelta;
        }}
        if (mode === 'number') {{
          const aNumber = Number(a.dataset.number || 999999);
          const bNumber = Number(b.dataset.number || 999999);
          if (aNumber !== bNumber) return aNumber - bNumber;
        }}
        if (mode === 'rarity') {{
          const rarityDelta = (rarityRank[a.dataset.rarity] || 99) - (rarityRank[b.dataset.rarity] || 99);
          if (rarityDelta) return rarityDelta;
        }}
        const nameDelta = a.dataset.name.localeCompare(b.dataset.name, 'en', {{ sensitivity: 'base' }});
        if (nameDelta) return nameDelta;
        return Number(a.dataset.sourceOrder) - Number(b.dataset.sourceOrder);
      }});
      sortedRows.forEach((row) => cardList.appendChild(row));
    }}

    const state = {{ ...seedState, ...normalizeProgressPayload(loadState()) }};
    boxes.forEach((box) => {{
      box.checked = Boolean(state[box.dataset.cardId]);
      box.addEventListener('change', saveState);
    }});
    rows.forEach((row) => {{
      row.addEventListener('pointerenter', () => previewRow(row));
      row.addEventListener('focusin', () => previewRow(row));
      row.addEventListener('click', () => previewRow(row));
    }});
    updateProgress();
    applySort();
    applyFilters();

    search.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    sortOrder.addEventListener('change', () => {{ applySort(); applyFilters(); }});
    connectProgressFile.addEventListener('click', () => {{
      connectExistingProgressFile().catch((error) => {{
        if (error && error.name === 'AbortError') return;
        setPersistStatus(`Progress is cached in this browser. File connection failed: ${{error.message}}`, false);
      }});
    }});
    document.getElementById('clearVisible').addEventListener('click', () => {{
      rows.filter((row) => !row.classList.contains('hidden')).forEach((row) => {{
        row.querySelector('input[type="checkbox"]').checked = false;
      }});
      saveState();
    }});
    document.getElementById('exportProgress').addEventListener('click', () => {{
      const blob = new Blob([JSON.stringify(buildProgressPayload(), null, 2) + '\\n'], {{ type: 'application/json' }});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '{html.escape(progress_name)}';
      link.click();
      URL.revokeObjectURL(url);
    }});
    document.getElementById('importProgress').addEventListener('change', async (event) => {{
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const imported = normalizeProgressPayload(JSON.parse(await file.text()));
      applyState(imported);
      persistPortableState(imported);
      event.target.value = '';
    }});
    restoreConnectedProgressFile();
  </script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate standalone priced card checklist HTML.")
    parser.add_argument("--preset", choices=sorted(PRESETS), default="original-overpower-1995")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--progress-output", type=Path)
    parser.add_argument("--seed-progress", type=Path)
    parser.add_argument("--price-cache", type=Path)
    price_group = parser.add_mutually_exclusive_group()
    price_group.add_argument("--with-prices", action="store_true", help="Fetch or reuse The Orange King prices")
    price_group.add_argument("--no-prices", action="store_true", help="Skip pricing")
    parser.add_argument("--image-base-url", help="Override card preview image base URL")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    preset = PRESETS[args.preset]
    output = (args.output or preset.output).resolve()
    progress_output = (args.progress_output or preset.progress_output).resolve()
    seed_progress = (args.seed_progress or progress_output).resolve()
    price_cache = (args.price_cache or preset.price_cache).resolve()
    image_base_url = args.image_base_url or f"file://{preset.image_dir}/"

    cards = load_cards(preset)
    seed_state = load_seed_progress(seed_progress)
    priced_count = 0
    missing_price_count = len(cards)

    if args.with_prices or not args.no_prices:
        priced_count, missing_price_count = attach_prices(cards, price_cache, preset.price_collection)

    write_initial_progress(progress_output, cards, seed_state)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        render_html(
            preset=preset,
            cards=cards,
            output=output,
            progress_output=progress_output,
            seed_state=seed_state,
            image_base_url=image_base_url,
            priced_count=priced_count,
            missing_price_count=missing_price_count,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {output}")
    print(f"Cards: {len(cards)}; priced: {priced_count}; missing prices: {missing_price_count}")
    print(f"Progress JSON: {progress_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
