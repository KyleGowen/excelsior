# Skybound Special primary-icon and value audit

Audited on 2026-10-13 against the checked-in printed card images. All **237 current Skybound Specials** were checked; #112, #126, #131, and #242 have Advanced Universe frames and were already moved by V314. They are excluded from Special corrections and totals. No Skybound Special foil/alternate-art rows exist in the current catalog.

## Findings and correction

The workbook frequently stored Combat, Brute Force, and some Intelligence badges as `gear_value` instead of typed stats. Combined badges often supplied only the first icon. The importer trusted these incomplete fields. The deck total calculator correctly counts the four canonical primary icon names when supplied. Current main owns this calculation in `src/services/deck-evaluation/iconTotals.ts`; release tests use that implementation.

V371 corrects **66 catalog rows** from the current release baseline against the complete [audited badge inventory](../../scripts/skybound/special-icon-audit.json). It preserves card IDs and all fields except `icons`, `value`, and `updated_at`. The manifest and importer are corrected too. The initial local database had five pending Any Character repairs already applied (local V366/V367); those migrations are absent from current `origin/main`. V371 includes all five icon restorations in the same audited sweep. #360 is printed as G.D.A. Agents and is matched through its current catalog name, Assist!; this migration preserves existing names.

- Restore 23 missing Combat icons, 41 missing Brute Force metadata icons, and 12 missing Intelligence icons from the current release baseline. No Energy badges were missing.
- Three of those Brute Force metadata additions (#019, #246, #372) already contribute Brute Force through the existing successful-hit rule. Their printed launch icons and secondary Brute Force badges are now both recorded; totals still count only the resulting Brute Force hit. Thus the totals gain **38 Brute Force contributions**, rather than 41.
- Expand both MultiPower cards (#006 Sucker Punch and #231 Bitten) to all four primary types, and restore every printed combined badge.
- Correct #155 Sadistic Charm from null to level **5**. Clear the spurious level **1** from #066 Immense Durability, which has no numerical badge. Remove the spurious Any-Power icon from #150 New World Order, which merely mentions other cards.
- Any-Power badges remain Any-Power and contribute zero to the four spectrum totals. References to Power cards, attack types, or level ranges do not manufacture icons for non-numerical Specials.

The twelve Specials in Kyle's screenshot now contribute **Energy 0, Combat 3, Brute Force 2, Intelligence 2**. The restored cards are #221 Sergeant Abraham Ford (Combat 7), #204 A Father's Legacy (Combat 7), #201 The Survivors (Combat 4), #222 Rosita Espinosa (Brute Force 4), and #200 Meet Andrea, My Sniper (Brute Force 6). The existing Intelligence cards are #225 Get to Washington D.C. (7) and #203 Douglas Monroe (4).

With one copy of every current Skybound Special, totals change from **Energy 20 / Combat 2 / Brute Force 3 / Intelligence 15** to **20 / 25 / 41 / 27**. These counts include defensive badges and use the existing successful-hit conversion rule; icon totals count icons per copy, not the sum of attack levels.

## All missing Combat badges

| Number | Character | Special | Printed value | Correct icons |
| --- | --- | --- | --- | --- |
| 005 | Invincible | Combat Training | 5 | Combat |
| 006 | Invincible | Sucker Punch | 3 | Energy, Combat, Brute Force, Intelligence |
| 069 | Monster Girl | Curse of the Monster | 8 | Combat, Brute Force, Intelligence |
| 077 | Immortal | I Choose Us | 8 | Energy, Combat, Brute Force |
| 078 | Immortal | The Guardians of the Globe | 4 | Combat |
| 106 | Machine Head and His Gang | Promised Elite Warriors | 8 | Combat |
| 118 | Lizard League | Salamander's Toxikinesis | 2 | Energy, Combat, Brute Force |
| 127 | Black Samson | Powerful Punches | 4 | Energy, Combat |
| 145 | Michonne | Katana | 6 | Combat |
| 159 | Ezekiel | Shikomizue | 3 | Combat |
| 171 | Glenn | Through Hell Together | 5 | Combat, Intelligence |
| 179 | The Governor & Woodbury | Penny | 4 | Combat, Brute Force |
| 189 | Alpha and the Whisperers | The Dead Whisper | 6 | Combat |
| 193 | The Hilltop | Paul 'Jesus' Monroe | 7 | Combat, Brute Force, Intelligence |
| 201 | Alexandria | The Survivors | 4 | Combat |
| 204 | Alexandria | A Father's Legacy | 7 | Combat |
| 216 | The Kingdom | Flank Them! | 7 | Combat |
| 221 | Abraham, Rosita And Eugene | Sergeant Abraham Ford | 7 | Combat |
| 231 | Walkers: Herd | Bitten | 2 | Energy, Combat, Brute Force, Intelligence |
| 235 | Mikey Rhodes | Flaming Sword | 6 | Combat |
| 237 | Mikey Rhodes | Life of Constant War | 7 | Combat |

## All missing Brute Force badges

| Number | Character | Special | Printed value | Correct icons |
| --- | --- | --- | --- | --- |
| 002 | Invincible | Extreme Measures | 10 | Brute Force |
| 006 | Invincible | Sucker Punch | 3 | Energy, Combat, Brute Force, Intelligence |
| 011 | Omni-Man | Not Who You Thought | 9 | Brute Force |
| 014 | Omni-Man | Earth's Greatest Hero | 8 | Brute Force |
| 019 | Rex Splode | Charged Metal Rod | 2 | Energy, Brute Force |
| 021 | Rex Splode | I Can Charge Anything | 4 | Energy, Brute Force |
| 038 | Dupli-Kate | One Woman Army | 4 | Brute Force |
| 055 | The Flaxans | Monstrous Leadership | 8 | Brute Force |
| 069 | Monster Girl | Curse of the Monster | 8 | Combat, Brute Force, Intelligence |
| 075 | Immortal | Primordial Rage | 4 | Brute Force |
| 077 | Immortal | I Choose Us | 8 | Energy, Combat, Brute Force |
| 081 | Battle Beast | Mighty Mace | 10 | Brute Force |
| 082 | Battle Beast | Bite | 6 | Brute Force |
| 084 | Battle Beast | Not a Worthy Foe | 5 | Brute Force, Intelligence |
| 094 | Doc Seismic | Open the Earth | 9 | Brute Force |
| 099 | Doc Seismic | Magmanites | 4 | Brute Force |
| 118 | Lizard League | Salamander's Toxikinesis | 2 | Energy, Combat, Brute Force |
| 119 | Lizard League | Iguana Slash | 5 | Brute Force |
| 120 | Lizard League | Komodo Dragon's Sacrifice | 8 | Brute Force |
| 132 | Rick Grimes | Learn From Our Enemies | 3 | Brute Force |
| 140 | Andrea | I Can Make Any Shot | 6 | Brute Force |
| 144 | Michonne | Brutal Revenge | 3 | Brute Force |
| 154 | Negan | Lucille | 8 | Brute Force |
| 164 | Maggie | Pent Up Rage | 7 | Brute Force |
| 179 | The Governor & Woodbury | Penny | 4 | Combat, Brute Force |
| 180 | The Governor & Woodbury | We Will Take It | 7 | Energy, Brute Force |
| 186 | Alpha and the Whisperers | Alpha | 8 | Brute Force |
| 187 | Alpha and the Whisperers | Beta | 7 | Brute Force |
| 193 | The Hilltop | Paul 'Jesus' Monroe | 7 | Combat, Brute Force, Intelligence |
| 200 | Alexandria | Meet Andrea, My Sniper | 6 | Brute Force |
| 208 | The Saviors | This Is All Negan's | 4 | Brute Force |
| 209 | The Saviors | Tainted Weapons | 5 | Brute Force |
| 222 | Abraham, Rosita And Eugene | Rosita Espinosa | 4 | Brute Force |
| 228 | Walkers: Herd | Caught Off Guard | 5 | Brute Force |
| 229 | Walkers: Herd | Overrun | 6 | Brute Force |
| 230 | Walkers: Herd | Feeding Frenzy | 8 | Brute Force |
| 231 | Walkers: Herd | Bitten | 2 | Energy, Combat, Brute Force, Intelligence |
| 246 | God King Lore | Chosen by Magic | 2 | Brute Force, Intelligence |
| 372 | Any Character | Force Fist & Knuckle Buster | 2 | Combat, Brute Force |

#019 Charged Metal Rod, #246 Chosen by Magic, and #372 Force Fist & Knuckle Buster already counted as Brute Force hits; their changes repair badge metadata. Every other row in this table restores a missing Brute Force contribution.

## Additional Any Character corrections included in this release

These five were already repaired in the initial local database, but their pending migrations were not on current main. They are included in V371 and in the release counts above.

| Number | Printed Special | Printed value | Restored icon |
| --- | --- | --- | --- |
| 354 | Black Samson | 6 | Brute Force |
| 356 | Darkwing | 5 | Combat |
| 359 | Nightboy | 4 | Combat |
| 360 | G.D.A. Agents (catalog label: Assist!) | 4 | Brute Force |
| 361 | Agent Donald | 4 | Intelligence |

## All missing Intelligence badges

| Number | Character | Special | Printed value | Correct icons |
| --- | --- | --- | --- | --- |
| 006 | Invincible | Sucker Punch | 3 | Energy, Combat, Brute Force, Intelligence |
| 012 | Omni-Man | Viltrumite Physiology | 4 | Intelligence |
| 064 | Mauler Twins | Sibling Sacrifice | 11 | Intelligence |
| 069 | Monster Girl | Curse of the Monster | 8 | Combat, Brute Force, Intelligence |
| 084 | Battle Beast | Not a Worthy Foe | 5 | Brute Force, Intelligence |
| 148 | Michonne | Bold Attack Plan | 6 | Intelligence |
| 171 | Glenn | Through Hell Together | 5 | Combat, Intelligence |
| 190 | Alpha and the Whisperers | New World Tactics | 4 | Energy, Intelligence |
| 193 | The Hilltop | Paul 'Jesus' Monroe | 7 | Combat, Brute Force, Intelligence |
| 231 | Walkers: Herd | Bitten | 2 | Energy, Combat, Brute Force, Intelligence |
| 233 | Walkers: Herd | Unsafe Getaway | 2 | Intelligence |

## Verification

- Independent card-face inventory covers all 237 Specials, including 139 without numerical primary badges and six Any-Power Specials.
- Automated checks compare the complete manifest and importer output to that inventory, exercise the screenshot's twelve Specials, combined badges, quantities, and successful-hit conversions, and verify the migration's exact row mappings.
- Passed 105 distinct Jest tests, three Python tests, four browser-runner guard tests, repository lint, the frontend production/typecheck build, and the Storybook build. The real supplied workbook also regenerates the audited icons and values for all 237 Specials.
- Docker Flyway applied V371 to the verified local `overpower-postgres` database and validated migration history. Direct database, API, and Vite-proxy responses all match all 237 audited rows; exactly 61 rows changed.
- Live Guest/dark browser checks used the read-only **Worlds Collide** public precon. Its header and JSON export agreed before correction (**15 / 6 / 7 / 0**) and after correction (**15 / 8 / 10 / 1**), in Energy / Combat / Brute Force / Intelligence order. The actual viewport was 1280x720. No deck/account records were created or changed.
- The pre-existing `localhost:5173` browser HTTP catalog cache continued serving the old response on ordinary reload. The final successful browser check used the same verified Vite/API/database through a fresh `127.0.0.1:5173` origin. This hostname difference is an explicit cache-isolation exception to the before/after comparison; source, deck, viewport, theme, and backend were the same. Existing tabs require a cache-bypassing refresh to immediately pick up the correction.
- Private local evidence: `/tmp/skybound-special-audit/browser-before-fixed/report.json` and `/tmp/skybound-special-audit/browser-after-fresh-origin/report.json`. The failed attempts are retained beside them. Two test-owned tabs were closed; the restarted local dev servers remain available for Kyle's spot check. Human acceptance is pending. This records the initial local audit; production deployment must be established separately by exact-commit release evidence.
