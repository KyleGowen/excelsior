"""Regression coverage against the independent, card-face-audited inventory."""
import importlib.util
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "skybound_import", ROOT / "scripts/skybound/build_skybound_import.py"
)
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


class SkyboundSpecialIconsTests(unittest.TestCase):
    def test_every_current_special_matches_the_printed_badges(self):
        audit = json.loads((ROOT / "scripts/skybound/special-icon-audit.json").read_text())
        manifest = json.loads((ROOT / "scripts/skybound/skybound-manifest.json").read_text())
        cards = {c["collector_number"]: c for c in manifest["cards"]}
        for expected in audit["cards"]:
            with self.subTest(number=expected["collector_number"]):
                # Incomplete workbook grids must not lose a printed badge, and
                # incidental numbers in gear_value must not invent one.
                row = {"card_text": cards[expected["collector_number"]]["card_effect"],
                       "gear_value": 99, "energy": None, "fighting": None,
                       "strength": None, "intelligence": None}
                self.assertEqual(IMPORTER.special_numeric_icons(row),
                                 (expected["icons"], expected["value"]))

    def test_mentions_of_other_cards_do_not_supply_badges(self):
        for text in (
            "May use Brute Force Power cards level 1-8 to avoid attacks.",
            "Avoid 1 Combat or Brute Force attack.",
            "Fetch a level 6 Intelligence Power card.",
            "The next attack, excluding MultiPower and Any-Power cards, may not be blocked.",
        ):
            with self.subTest(text=text):
                self.assertEqual(IMPORTER.special_numeric_icons({"card_text": text}), ([], None))

    def test_badge_spellings_and_missing_level_word(self):
        self.assertEqual(IMPORTER.special_numeric_icons({"card_text": "Acts as a 5 Intelligence attack."}),
                         (["Intelligence"], 5))
        for spelling in ("MultiPower", "Multi-Power", "Multi Power"):
            self.assertEqual(IMPORTER.special_numeric_icons({"card_text": f"Acts as a level 3 {spelling} attack."}),
                             (["Energy", "Combat", "Brute Force", "Intelligence"], 3))


if __name__ == "__main__":
    unittest.main()
