#!/usr/bin/env python3
"""Build the audited Skybound manifest and Flyway data migration.

The supplied workbook is an OOXML workbook with a historical .xls suffix. This
script deliberately uses only the Python standard library so the normalization
rules remain reproducible without adding an application dependency.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import zipfile
from pathlib import Path
from typing import Any, Iterable
from xml.etree import ElementTree as ET


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
SET_CODE = "SKY"
SET_NAME = "Skybound"
WALKING_DEAD_MISSION_SET = "The Walking Dead: All Out War"

# The supplier filenames for these two Teamwork cards contain stale use values.
# The printed card faces are authoritative: #317 is 7 Energy and #318 is 8 Energy.
TEAMWORK_USE_VALUE_OVERRIDES = {
    317: 7,
    318: 8,
}

TABLE_TO_CARD_TYPE = {
    "characters": "character",
    "special_cards": "special",
    "power_cards": "power",
    "locations": "location",
    "missions": "mission",
    "events": "event",
    "aspects": "aspect",
    "advanced_universe_cards": "advanced-universe",
    "teamwork_cards": "teamwork",
    "ally_universe_cards": "ally-universe",
    "training_cards": "training",
    "basic_universe_cards": "basic-universe",
}

TABLE_TO_DIR = {
    "characters": "characters",
    "special_cards": "specials",
    "power_cards": "power",
    "locations": "locations",
    "missions": "missions",
    "events": "events",
    "aspects": "aspects",
    "advanced_universe_cards": "advanced-universe",
    "teamwork_cards": "teamwork",
    "ally_universe_cards": "ally",
    "training_cards": "training",
    "basic_universe_cards": "basic-universe",
}

EXPECTED_BASE_COUNTS = {
    "special_cards": 241,
    "characters": 91,
    "power_cards": 39,
    "teamwork_cards": 38,
    "missions": 14,
    "basic_universe_cards": 12,
    "events": 10,
    "ally_universe_cards": 8,
    "locations": 8,
    "training_cards": 7,
    "aspects": 3,
    "advanced_universe_cards": 1,
}

MISSION_NAMES = {
    395: "Powers Discovered",
    396: "Guardians No More",
    397: "A World in Mourning",
    398: "Damian Darkblood",
    399: "A Desperate Gamble",
    400: "I Won't Let You",
    401: "I'd Have You, Dad",
    407: "We Are Negan",
    408: "The Devil Himself",
    409: "A Traitor Among Us",
    410: "Dogs of War",
    411: "Casualties on Both Sides",
    412: "A Desperate Gamble",
    413: "A Better Way",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--migration", type=Path, required=True)
    return parser.parse_args()


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref).group(0)
    result = 0
    for char in letters:
        result = result * 26 + ord(char) - ord("A") + 1
    return result - 1


def read_workbook(path: Path) -> list[dict[str, Any]]:
    with zipfile.ZipFile(path) as workbook:
        shared_root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
        shared_strings = [
            "".join(node.text or "" for node in item.findall(".//a:t", NS))
            for item in shared_root.findall("a:si", NS)
        ]
        sheet_root = ET.fromstring(workbook.read("xl/worksheets/sheet1.xml"))

    rows: list[list[Any]] = []
    for row in sheet_root.findall(".//a:sheetData/a:row", NS):
        values: list[Any] = []
        for cell in row.findall("a:c", NS):
            idx = column_index(cell.attrib["r"])
            while len(values) <= idx:
                values.append(None)
            value_node = cell.find("a:v", NS)
            if value_node is None:
                value: Any = None
            elif cell.attrib.get("t") == "s":
                value = shared_strings[int(value_node.text)]
            else:
                raw = value_node.text or ""
                try:
                    value = float(raw)
                except ValueError:
                    value = raw
            values[idx] = value
        rows.append(values)

    headers = [str(value) for value in rows[0]]
    return [
        {header: (values[index] if index < len(values) else None) for index, header in enumerate(headers)}
        for values in rows[1:]
    ]


def clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).replace("\\n", "\n").strip()


def integer(value: Any) -> int | None:
    text = clean(value)
    if not text:
        return None
    return int(float(text))


def smart_title(value: Any) -> str:
    text = re.sub(r"\s+", " ", clean(value))
    if not text:
        return ""
    if text.upper() == text:
        text = text.title()
    replacements = {
        "G.d.a.": "G.D.A.",
        "D.a.": "D.A.",
        "D.c.": "D.C.",
        "Omni-Man": "Omni-Man",
        "Dupli-Kate": "Dupli-Kate",
        "Any-Power": "Any-Power",
        "Multi-Power": "Multi-Power",
    }
    for before, after in replacements.items():
        text = text.replace(before, after)
    return text


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return slug or "card"


def classify(row: dict[str, Any]) -> str:
    filename = clean(row["file"]).upper()
    number = int(filename[:3])
    if number == 133:
        return "advanced_universe_cards"
    if "_SPECIAL_" in filename or "_ANY CHARACTER_" in filename:
        return "special_cards"
    if any(marker in filename for marker in ("_CHARACTER_", "_CHARCTER_", "_CHARACER_", "_CHARACTERS_")):
        return "characters"
    if any(marker in filename for marker in ("_HOMEBASE_", "_LOCATION_", "_BATTLEGROUND_")):
        return "locations"
    if "_ASPECT_" in filename:
        return "aspects"
    if "_MISSION_" in filename:
        return "missions"
    if "_EVENT_" in filename:
        return "events"
    if "_POWER_" in filename:
        return "power_cards"
    if "_UNIVERSE_" in filename:
        if "ALLY" in filename:
            return "ally_universe_cards"
        if "BASIC" in filename:
            return "basic_universe_cards"
        if "TRAINING" in filename:
            return "training_cards"
        return "teamwork_cards"
    raise ValueError(f"Unclassified Skybound file: {row['file']}")


def source_number(row: dict[str, Any]) -> int:
    return int(clean(row["file"])[:3])


def is_foil_source(row: dict[str, Any]) -> bool:
    return bool(
        re.fullmatch(r"\d{3}F", clean(row.get("collector_number")), re.IGNORECASE)
        or re.match(r"^\d{3}F_", clean(row.get("file")), re.IGNORECASE)
    )


def is_printing_foil_file(row: dict[str, Any]) -> bool:
    return bool(re.match(r"^\d{3}F_", clean(row.get("file")), re.IGNORECASE))


def rarity(row: dict[str, Any]) -> str | None:
    full = smart_title(row.get("rarity_full"))
    if full in {"Common", "Uncommon", "Rare", "Ultra Rare"}:
        return full
    code = clean(row.get("rarity_code")).upper()
    return {"C": "Common", "U": "Uncommon", "R": "Rare", "UR": "Ultra Rare"}.get(code)


def one_per_deck(row: dict[str, Any]) -> bool:
    # The workbook keyword identifies the card itself as One Per Deck. Rules
    # text can instead mention another One Per Deck card, which must not mark
    # the current card (for example, Tactical Rescue and Ezekiel's Wisdom).
    keywords = clean(row.get("keywords")).lower()
    return "one per deck" in keywords or "1 per deck" in keywords


def filename_label(filename: str, marker: str) -> str:
    upper = filename.upper()
    start = upper.index(marker) + len(marker)
    tail = filename[start:]
    tail = re.sub(r"_EN(?:\s+COPY)?_?TRIMMED\.PNG$", "", tail, flags=re.IGNORECASE)
    tail = re.sub(r"_EN_?\d+\s+COPY_TRIMMED\.PNG$", "", tail, flags=re.IGNORECASE)
    return smart_title(tail.replace("_", " "))


def choose_special_title(row: dict[str, Any], owner: str) -> str:
    subtitle = smart_title(row.get("subtitle"))
    name = smart_title(row.get("name"))
    owner_key = re.sub(r"[^a-z0-9]", "", owner.lower())
    for candidate in (subtitle, name):
        candidate_key = re.sub(r"[^a-z0-9]", "", candidate.lower())
        if candidate and candidate_key != owner_key and "anycharacter" not in candidate_key:
            return candidate
    filename = clean(row["file"])
    marker = "_SPECIAL_" if "_SPECIAL_" in filename.upper() else "_ANY CHARACTER_"
    return filename_label(filename, marker)


def function_icon_fields(row: dict[str, Any]) -> dict[str, bool]:
    icon_text = clean(row.get("other_icons"))
    effect = clean(row.get("card_text"))
    lowered = icon_text.lower()
    has_hourglass = "hourglass" in lowered
    return {
        "icon_offensive_swords": bool(re.search(r"\bX\b|attack|crossed[ -]?swords", icon_text, re.IGNORECASE)),
        "icon_defensive_shield": "shield" in lowered or "defense" in lowered,
        "icon_remainder_of_battle": has_hourglass and "remainder of game" not in effect.lower(),
        "icon_remainder_of_game": has_hourglass and "remainder of game" in effect.lower(),
        "icon_attached_paperclip": "paperclip" in lowered,
        "icon_astral_plane": bool(re.search(r"\bA\b|astral", icon_text, re.IGNORECASE)),
        "icon_first_action_only": bool(re.search(r"\b1ST\b|\bFIRST\b", icon_text, re.IGNORECASE)),
    }


def numeric_icons(row: dict[str, Any]) -> tuple[list[str], int | None]:
    icons: list[str] = []
    for column, label in (
        ("energy", "Energy"),
        ("fighting", "Combat"),
        ("strength", "Brute Force"),
        ("intelligence", "Intelligence"),
    ):
        if integer(row.get(column)) is not None:
            icons.append(label)
    effect = clean(row.get("card_text"))
    for label in ("Any-Power", "Multi-Power"):
        if label.lower() in effect.lower() and label not in icons:
            icons.append(label)
    match = re.search(r"level\s+(\d+)", effect, re.IGNORECASE)
    value = int(match.group(1)) if match else integer(row.get("gear_value"))
    return icons, value


def special_numeric_icons(row: dict[str, Any]) -> tuple[list[str], int | None]:
    """Read numerical Special badges from their acts-as clauses, not power grids.

    The workbook often puts Combat/Brute Force badges in gear_value and records
    only the front icon of a combined badge. Mentions of another card's Power
    Type or a permitted Power-card range do not create a badge on this Special.
    Include the second printed badge on attacks that become a different hit;
    deck totals separately use the resulting hit's type.
    """
    primary_types = ("Energy", "Combat", "Brute Force", "Intelligence")
    icons: set[str] = set()
    value = None
    for match in re.finditer(
        r"\bacts\s+as\s+(?:a\s+)?(?:level\s+)?(\d+)\s+"
        r"(.+?)\s+(?:attack|defense|Power\s+card)\b",
        clean(row.get("card_text")),
        re.IGNORECASE,
    ):
        if value is None:
            value = int(match.group(1))
        badge_types = match.group(2)
        if re.search(r"\bMulti[ -]?Power\b", badge_types, re.IGNORECASE):
            icons.update(primary_types)
        elif re.search(r"\bAny[ -]?Power\b", badge_types, re.IGNORECASE):
            icons.add("Any-Power")
        else:
            icons.update(
                label for label in primary_types
                if re.search(r"\b" + re.escape(label) + r"\b", badge_types, re.IGNORECASE)
            )
    return [label for label in (*primary_types, "Any-Power") if label in icons], value


def public_image_path(table: str, set_number: str, display_name: str) -> str:
    return f"sky/{TABLE_TO_DIR[table]}/{set_number.lower()}_{slugify(display_name)}.png"


def build_cards(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    for row in rows:
        row["_number"] = source_number(row)
        row["_table"] = classify(row)
        row["_foil"] = is_foil_source(row)

    grouped: dict[int, list[dict[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(row["_number"], []).append(row)

    if set(grouped) != set(range(1, 473)):
        missing = sorted(set(range(1, 473)) - set(grouped))
        raise ValueError(f"Collector coverage is not 001-472; missing={missing}")

    base_rows: list[dict[str, Any]] = []
    reverse_rows: dict[int, dict[str, Any]] = {}
    for number in range(1, 473):
        variants = grouped[number]
        table = variants[0]["_table"]
        if any(row["_table"] != table for row in variants):
            raise ValueError(f"Collector {number:03d} spans multiple tables")
        non_foil = [row for row in variants if not row["_foil"]]
        base_art_rows = [row for row in non_foil if not is_printing_foil_file(row)]
        if not base_art_rows:
            raise ValueError(f"Collector {number:03d} has no non-foil source image")
        if table == "missions":
            selected = next(row for row in base_art_rows if "_FRONT_" in clean(row["file"]).upper())
        elif number in {226, 450}:
            selected = next(row for row in base_art_rows if "_FRONT_" in clean(row["file"]).upper())
            reverse_rows[number] = next(row for row in base_art_rows if row is not selected)
        else:
            selected = base_art_rows[0]
        base_rows.append(selected)

    latest_character = ""
    canonical_characters: dict[str, dict[str, Any]] = {}
    cards: list[dict[str, Any]] = []
    assets: list[dict[str, str]] = []

    for row in base_rows:
        number = row["_number"]
        table = row["_table"]
        set_number = f"{number:03d}"
        card: dict[str, Any] = {
            "collector_number": set_number,
            "table": table,
            "card_type": TABLE_TO_CARD_TYPE[table],
            "set": SET_CODE,
            "rarity": rarity(row),
            "is_foil": False,
            "source_file": clean(row["file"]),
        }

        if table == "characters":
            name = smart_title(row.get("name"))
            latest_character = name
            card.update(
                name=name,
                energy=integer(row.get("energy")) or 0,
                combat=integer(row.get("fighting")) or 0,
                brute_force=integer(row.get("strength")) or 0,
                intelligence=integer(row.get("intelligence")) or 0,
                threat_level=integer(row.get("gear_value")),
                special_abilities=clean(row.get("card_text")),
                description=f"{name} character from Skybound",
            )
            normalized_name = re.sub(r"[^a-z0-9]", "", name.lower())
            if 419 <= number <= 472:
                canonical = canonical_characters.get(normalized_name)
                if canonical is None:
                    raise ValueError(
                        f"Alternate-art character {set_number} has no public base card: {name}"
                    )
                for field in (
                    "name",
                    "energy",
                    "combat",
                    "brute_force",
                    "intelligence",
                    "threat_level",
                    "special_abilities",
                    "description",
                ):
                    card[field] = canonical[field]
            else:
                canonical_characters.setdefault(normalized_name, card)
            if number in reverse_rows:
                reverse_row = reverse_rows[number]
                reverse_name = smart_title(reverse_row.get("name"))
                reverse_path = public_image_path(table, set_number, reverse_name)
                card["reverse_image_path"] = reverse_path
                card["reverse_source_file"] = clean(reverse_row["file"])
                assets.append({"source_file": clean(reverse_row["file"]), "target_path": reverse_path})
        elif table == "special_cards":
            if 228 <= number <= 233:
                owner = "Walkers: Herd"
            else:
                owner = "Any Character" if 349 <= number <= 374 else latest_character
            title = choose_special_title(row, owner)
            icons, value = special_numeric_icons(row)
            effect = clean(row.get("card_text"))
            card.update(
                name=title,
                character_name=owner,
                card_effect=effect,
                one_per_deck=one_per_deck(row),
                cataclysm="cataclysm" in effect.lower(),
                ambush="ambush" in effect.lower(),
                assist="assist" in effect.lower(),
                banned=False,
                icons=icons,
                value=value,
                **function_icon_fields(row),
            )
        elif table == "power_cards":
            match = re.search(
                r"_POWER_(\d+)[ _]+(ENERGY|COMBAT|BRUTE[ _]+FORCE|INTELLIGENCE|ANYPOWER|MULTIPOWER)_",
                clean(row["file"]),
                re.IGNORECASE,
            )
            if not match:
                raise ValueError(f"Cannot parse power card {row['file']}")
            value = int(match.group(1))
            raw_power_type = match.group(2).replace("_", " ").upper()
            power_type = {
                "ANYPOWER": "Any-Power",
                "MULTIPOWER": "Multi-Power",
            }.get(raw_power_type, smart_title(raw_power_type))
            card.update(
                name=f"{value} - {power_type}",
                power_type=power_type,
                value=value,
                one_per_deck=one_per_deck(row),
            )
        elif table == "locations":
            name = smart_title(row.get("name")) or filename_label(clean(row["file"]), "_HOMEBASE_")
            card.update(
                name=name,
                threat_level=None if number == 348 else integer(row.get("gear_value")),
                special_ability=clean(row.get("card_text")),
            )
        elif table == "missions":
            name = MISSION_NAMES[number]
            mission_set = (
                "Who Killed the Guardians of the Globe?"
                if number <= 401
                else WALKING_DEAD_MISSION_SET
            )
            card.update(name=name, mission_set=mission_set, mission_description=f"{name} mission card")
        elif table == "events":
            name = smart_title(row.get("name"))
            subtitle = smart_title(row.get("subtitle"))
            if not name or name.lower() in {"rick's journal", "daily security briefing"}:
                name = subtitle
            if not name or "guardians of the globe" in name.lower():
                name = filename_label(clean(row["file"]), "_EVENT_")
            name = name.replace("Revieled", "Revealed")
            mission_set = (
                "Who Killed the Guardians of the Globe?"
                if number <= 406
                else WALKING_DEAD_MISSION_SET
            )
            effect = clean(row.get("card_text"))
            card.update(
                name=name,
                mission_set=mission_set,
                event_description=f"{name} event card",
                game_effect=effect,
                flavor_text="",
                one_per_deck=one_per_deck(row),
            )
        elif table == "aspects":
            aspect_names = {
                376: "Fragile Insignificant Beings",
                378: "Hershel Greene",
                379: "Hidden Danger",
            }
            locations = {376: "Streets of Chicago", 378: "The Greene Farm", 379: "The Greene Farm"}
            icons, value = numeric_icons(row)
            effect = clean(row.get("card_text"))
            card.update(
                name=aspect_names[number],
                aspect_description=effect,
                location=locations[number],
                one_per_deck=one_per_deck(row),
                fortifications="fortification" in effect.lower(),
                icons=icons,
                value=value,
            )
        elif table == "advanced_universe_cards":
            card.update(
                name="Teamwork",
                character="Rick Grimes",
                card_description=clean(row.get("card_text")),
                one_per_deck=True,
                icon_offensive_swords=True,
                icon_defensive_shield=False,
                icon_remainder_of_battle=False,
                icon_remainder_of_game=False,
                icon_astral_plane=False,
            )
        elif table == "teamwork_cards":
            filename_use_value = int(
                re.search(r"_UNIVERSE_(\d+)", clean(row["file"]), re.IGNORECASE).group(1)
            )
            first_number = TEAMWORK_USE_VALUE_OVERRIDES.get(number, filename_use_value)
            if number in {392, 393}:
                to_use = f"{first_number} Any-Power"
                acts_as = "6 Attack"
                followups = "Any-Power"
                first_bonus = "0"
                second_bonus = "0" if number == 392 else "1"
            else:
                if 312 <= number <= 320:
                    primary = "Energy"
                elif 321 <= number <= 329:
                    primary = "Combat"
                elif 330 <= number <= 338:
                    primary = "Brute Force"
                else:
                    primary = "Intelligence"
                effect = clean(row.get("card_text"))
                follow_match = re.search(
                    r"First Teammate must make 1 (Energy|Combat|Brute Force|Intelligence) or (Energy|Combat|Brute Force|Intelligence)",
                    effect,
                    re.IGNORECASE,
                )
                if not follow_match:
                    raise ValueError(f"Cannot parse teamwork followups for {row['file']}")
                followups = f"{smart_title(follow_match.group(1))} + {smart_title(follow_match.group(2))}"
                to_use = f"{first_number} {primary}"
                acts_as = "4 Attack"
                first_bonus = "0" if first_number == 6 else "1"
                second_bonus = "2" if first_number == 8 else "1"
            card.update(
                name=to_use,
                card_description=f"Teamwork card: {to_use} acts as {acts_as} with {followups} followup",
                to_use=to_use,
                acts_as=acts_as,
                followup_attack_types=followups,
                first_attack_bonus=first_bonus,
                second_attack_bonus=second_bonus,
                one_per_deck=one_per_deck(row),
            )
        elif table == "ally_universe_cards":
            ally_types = {
                286: "Energy", 287: "Energy", 288: "Combat", 289: "Combat",
                290: "Brute Force", 291: "Brute Force", 292: "Intelligence", 293: "Intelligence",
            }
            stat_type = ally_types[number]
            low = number % 2 == 0
            name = "Titan" if number == 290 else smart_title(row.get("name"))
            card.update(
                name=name,
                card_description=f"{name} ally card",
                stat_to_use="5 or less" if low else "7 or higher",
                stat_type_to_use=stat_type,
                attack_value=3 if low else 2,
                attack_type=stat_type,
                card_text="Teammate must play 1 Special card.",
                one_per_deck=one_per_deck(row),
            )
        elif table == "training_cards":
            if number == 394:
                type_1 = type_2 = "Any-Power"
                value_to_use = "5 or less"
                bonus = "+5"
                name = "Training (Any-Power)"
            else:
                type_pairs = {
                    306: ("Energy", "Combat"),
                    307: ("Energy", "Brute Force"),
                    308: ("Energy", "Intelligence"),
                    309: ("Combat", "Brute Force"),
                    310: ("Combat", "Intelligence"),
                    311: ("Brute Force", "Intelligence"),
                }
                type_1, type_2 = type_pairs[number]
                value_to_use = "5 or less"
                bonus = "+4"
                name = f"Training ({type_1} / {type_2})"
            card.update(
                name=name,
                card_description=f"Training card: {type_1} + {type_2}, {value_to_use}, {bonus} bonus",
                type_1=type_1,
                type_2=type_2,
                value_to_use=value_to_use,
                bonus=bonus,
                one_per_deck=one_per_deck(row),
            )
        elif table == "basic_universe_cards":
            match = re.search(
                r"_UNIVERSE_(\d+)\s+(\d+)\s+(E|C|BF|INT)\s+BASIC_",
                clean(row["file"]),
                re.IGNORECASE,
            )
            if not match:
                raise ValueError(f"Cannot parse basic universe card {row['file']}")
            requirement, bonus = int(match.group(1)), int(match.group(2))
            stat_type = {"E": "Energy", "C": "Combat", "BF": "Brute Force", "INT": "Intelligence"}[match.group(3).upper()]
            name = smart_title(row.get("name"))
            card.update(
                name=name,
                card_description=f"{name} basic universe card",
                type=stat_type,
                value_to_use=f"{requirement} or greater",
                bonus=f"+{bonus}",
                one_per_deck=one_per_deck(row),
            )

        card["image_path"] = public_image_path(table, set_number, card["name"])
        cards.append(card)
        assets.append({"source_file": card["source_file"], "target_path": card["image_path"]})

    foil_rows = sorted(
        (row for row in rows if row["_foil"]),
        key=lambda row: row["_number"],
    )
    if len(foil_rows) != 53:
        raise ValueError(f"Expected 53 foil rows from the workbook, got {len(foil_rows)}")

    for foil_row in foil_rows:
        base_number = f"{foil_row['_number']:03d}"
        base_card = next(card for card in cards if card["collector_number"] == base_number)
        if base_card["table"] != "characters":
            raise ValueError(f"Foil {base_number}F is not a character")
        foil_card = dict(base_card)
        foil_card.update(
            collector_number=f"{base_number}F",
            is_foil=True,
            source_file=clean(foil_row["file"]),
            rarity=rarity(foil_row) or base_card["rarity"],
            base_collector_number=base_number,
            # Printing-only foil files are deliberately not published. The app
            # renders its foil sheen over the matching non-foil image instead.
            image_path=base_card["image_path"],
        )
        foil_card.pop("reverse_image_path", None)
        foil_card.pop("reverse_source_file", None)
        cards.append(foil_card)
        base_card["set_number_foil"] = foil_card["collector_number"]

    counts: dict[str, int] = {}
    for card in cards:
        if not card["is_foil"]:
            counts[card["table"]] = counts.get(card["table"], 0) + 1
    if counts != EXPECTED_BASE_COUNTS:
        raise ValueError(f"Unexpected normalized counts: {counts}")
    if len(cards) != 525:
        raise ValueError(f"Expected 525 public DB records, got {len(cards)}")
    if len(assets) != 474:
        raise ValueError(f"Expected 474 public source assets, got {len(assets)}")
    if len({asset["target_path"] for asset in assets}) != len(assets):
        raise ValueError("Two Skybound source assets resolve to the same target path")
    return cards, assets


def sql_value(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, list):
        if not value:
            return "ARRAY[]::text[]"
        return "ARRAY[" + ", ".join(sql_value(item) for item in value) + "]::text[]"
    return "'" + str(value).replace("'", "''") + "'"


def emit_insert(table: str, columns: list[str], cards: Iterable[dict[str, Any]]) -> str:
    rows = list(cards)
    values = ",\n".join(
        "  (" + ", ".join(sql_value(card.get(column)) for column in columns) + ")"
        for card in rows
    )
    column_list = ", ".join(columns)
    sql_casts = {
        "energy": "integer",
        "combat": "integer",
        "brute_force": "integer",
        "intelligence": "integer",
        "threat_level": "integer",
        "value": "integer",
        "set_number_int": "integer",
        "attack_value": "integer",
    }
    select_list = ", ".join(
        f"i.{column}::{sql_casts[column]}" if column in sql_casts else f"i.{column}"
        for column in columns
    )
    return f"""WITH incoming ({column_list}) AS (
VALUES
{values}
)
INSERT INTO {table} (id, {column_list}, created_at, updated_at)
SELECT gen_random_uuid(), {select_list}, NOW(), NOW()
FROM incoming i
WHERE NOT EXISTS (
  SELECT 1 FROM {table} existing
  WHERE existing.set = i.set
    AND existing.set_number = i.set_number
    AND existing.is_foil = i.is_foil
);
"""


def render_migration(cards: list[dict[str, Any]]) -> str:
    by_table = {table: [card for card in cards if card["table"] == table] for table in TABLE_TO_CARD_TYPE}
    columns = {
        "characters": ["name", "set", "description", "energy", "combat", "brute_force", "intelligence", "image_path", "reverse_image_path", "threat_level", "special_abilities", "set_number", "set_number_foil", "is_foil", "rarity"],
        "special_cards": ["name", "character_name", "set", "card_effect", "image_path", "one_per_deck", "cataclysm", "ambush", "assist", "icons", "value", "set_number", "set_number_foil", "banned", "is_foil", "icon_offensive_swords", "icon_defensive_shield", "icon_remainder_of_battle", "icon_remainder_of_game", "icon_attached_paperclip", "icon_astral_plane", "icon_first_action_only", "rarity"],
        "power_cards": ["name", "power_type", "value", "image_path", "one_per_deck", "set", "set_number", "set_number_foil", "is_foil", "rarity"],
        "locations": ["name", "set", "image_path", "threat_level", "special_ability", "set_number", "set_number_foil", "is_foil", "rarity"],
        "missions": ["name", "set", "mission_description", "image_path", "mission_set", "set_number", "set_number_foil", "set_number_int", "is_foil", "rarity"],
        "events": ["name", "set", "event_description", "image_path", "one_per_deck", "mission_set", "game_effect", "flavor_text", "set_number", "set_number_foil", "is_foil", "rarity"],
        "aspects": ["name", "set", "aspect_description", "image_path", "one_per_deck", "fortifications", "location", "icons", "value", "set_number", "set_number_foil", "is_foil", "rarity"],
        "advanced_universe_cards": ["name", "set", "card_description", "image_path", "one_per_deck", "character", "set_number", "set_number_foil", "is_foil", "rarity", "icon_offensive_swords", "icon_defensive_shield", "icon_remainder_of_battle", "icon_remainder_of_game", "icon_astral_plane"],
        "teamwork_cards": ["name", "set", "card_description", "image_path", "one_per_deck", "to_use", "acts_as", "followup_attack_types", "first_attack_bonus", "second_attack_bonus", "set_number", "set_number_foil", "is_foil", "rarity"],
        "ally_universe_cards": ["name", "set", "card_description", "image_path", "one_per_deck", "stat_to_use", "stat_type_to_use", "attack_value", "attack_type", "card_text", "set_number", "set_number_foil", "is_foil", "rarity"],
        "training_cards": ["name", "set", "card_description", "image_path", "one_per_deck", "type_1", "type_2", "value_to_use", "bonus", "set_number", "set_number_foil", "is_foil", "rarity"],
        "basic_universe_cards": ["name", "set", "card_description", "image_path", "one_per_deck", "type", "value_to_use", "bonus", "set_number", "set_number_foil", "is_foil", "rarity"],
    }

    for card in cards:
        card["set_number"] = card["collector_number"]
        card.setdefault("set_number_foil", None)
        if card["table"] == "missions":
            card["set_number_int"] = int(card["collector_number"])
        if card["table"] == "characters":
            card.setdefault("reverse_image_path", None)

    statements = [
        "-- Generated by scripts/skybound/build_skybound_import.py.",
        "-- Source: Skybound - Full Set - Data.xls; card types are normalized from printed filename markers.",
        "ALTER TABLE characters ADD COLUMN IF NOT EXISTS reverse_image_path VARCHAR(255);",
        "INSERT INTO sets (code, name) VALUES ('SKY', 'Skybound') ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();",
    ]
    for table in TABLE_TO_CARD_TYPE:
        statements.append(emit_insert(table, columns[table], by_table[table]))

    statements.append("""INSERT INTO foil_card_map (foil_card_id, base_card_id, card_type)
SELECT foil.id::text, base.id::text, 'character'
FROM characters foil
JOIN characters base
  ON base.set = 'SKY'
  AND base.set_number = regexp_replace(foil.set_number, 'F$', '')
  AND base.is_foil = FALSE
WHERE foil.set = 'SKY' AND foil.set_number ~ '^[0-9]+F$' AND foil.is_foil = TRUE
ON CONFLICT (foil_card_id) DO UPDATE
SET base_card_id = EXCLUDED.base_card_id,
    card_type = EXCLUDED.card_type;
""")
    statements.append("""DO $$
DECLARE
  total_rows INTEGER;
  base_numbers INTEGER;
  alternate_art_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM (
    SELECT set_number FROM characters WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM special_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM power_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM locations WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM missions WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM events WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM aspects WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM advanced_universe_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM teamwork_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM ally_universe_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM training_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM basic_universe_cards WHERE set = 'SKY'
  ) sky;
  IF total_rows <> 525 THEN
    RAISE EXCEPTION 'Skybound migration expected 525 rows, found %', total_rows;
  END IF;

  SELECT COUNT(DISTINCT set_number::INTEGER) INTO base_numbers FROM (
    SELECT set_number FROM characters WHERE set = 'SKY' AND set_number !~ 'F$'
    UNION ALL SELECT set_number FROM special_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM power_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM locations WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM missions WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM events WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM aspects WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM advanced_universe_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM teamwork_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM ally_universe_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM training_cards WHERE set = 'SKY'
    UNION ALL SELECT set_number FROM basic_universe_cards WHERE set = 'SKY'
  ) sky_base;
  IF base_numbers <> 472 THEN
    RAISE EXCEPTION 'Skybound migration expected 472 base collector numbers, found %', base_numbers;
  END IF;

  SELECT COUNT(*) INTO alternate_art_rows
  FROM characters
  WHERE set = 'SKY'
    AND CASE WHEN set_number ~ '^[0-9]+$' THEN set_number::INTEGER END BETWEEN 419 AND 472
    AND image_path LIKE 'sky/characters/%'
    AND is_foil = FALSE;
  IF alternate_art_rows <> 54 THEN
    RAISE EXCEPTION 'Skybound migration expected 54 released alternate-art rows, found %', alternate_art_rows;
  END IF;
END $$;
""")
    return "\n\n".join(statements).rstrip() + "\n"


def main() -> None:
    args = parse_args()
    rows = read_workbook(args.workbook)
    cards, assets = build_cards(rows)
    manifest = {
        "set": {"code": SET_CODE, "name": SET_NAME},
        "source_workbook": args.workbook.name,
        "alternate_art_collectors": {"start": 419, "end": 472, "released": True},
        "counts": {
            "base_cards": 472,
            "public_foil_cards": 53,
            "database_rows": 525,
            "public_source_assets": 474,
            "by_table_base": EXPECTED_BASE_COUNTS,
        },
        "cards": cards,
        "assets": sorted(assets, key=lambda asset: asset["target_path"]),
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.migration.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    args.migration.write_text(render_migration(cards), encoding="utf-8")
    print(f"Wrote {len(cards)} rows and {len(assets)} public assets")


if __name__ == "__main__":
    main()
