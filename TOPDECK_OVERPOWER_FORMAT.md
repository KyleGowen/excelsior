# TopDeck OverPower deck submission context

Research date: **2026-10-08 (UTC)**.
Signed-in form verification: **2026-10-08 (UTC)**, using an existing registration
for a completed Modern OverPower event.
Published Modern sample review: **2026-10-08 (UTC)**, all four standings pages
of OverPower Season One Regional #1: Columbus, OH.
Expanded event audit: **2026-10-10 (UTC)**, all 225 published entries across
12 recent events with 21–63 standings entries. The complete per-deck comparison
table is in [TOPDECK_OVERPOWER_EVENT_AUDIT.md](TOPDECK_OVERPOWER_EVENT_AUDIT.md).
Hosting and local Modern export checks: **2026-10-09 (UTC)**. Tournament
creation on the signed-in account redirected to the subscription page;
hosting access is still needed. No trial was activated, and no test event or
registration was created.

Purpose: preserve the evidence needed to design an Excelsior export for an
OverPower event on TopDeck. Excelsior now has a locally implemented JSON /
TopDeck export toggle. Local export checks and platform research do **not**
establish a successful TopDeck submission or automatic OverPower validation.

**Current export decision — 2026-10-10:** use the recurring complete-list
template from [the Modern-only past-year review](TOPDECK_OVERPOWER_MODERN_FORMAT.md).
That review checked all 39 Modern-labeled index records without an attendance
cutoff, retained 25 registered event candidates after documented exclusions,
and inspected all 100 published entries in the eight events that publish them.
Twenty entries share the selected template; the 57 handwritten/mixed entries
are heterogeneous and do not define one common grammar. This is the most common
recognizable export template, not a majority of all submissions.

The local exporter now uses totals, mission-set summaries, compact Universe and
Power labels, abbreviated Any Character subtypes/observed effect codes, and
Location/Battleground attachment grouping. Aspects stay under Other Cards.
The older mixed-format comparisons and proposal below describe the previous
implementation and are retained as dated research history. Current behavior is
documented in [Deck Export](docs/current/DECK_EXPORT.md).

## Findings that matter

- **The expanded audit confirms a family of formats, with specific differences
  from our exporter.** All 32 standings pages and all 225 published entries in
  12 past-year events with at least 20 registrations were reviewed. Ten events
  publish entries; two publish none. Twenty-six entries share the category /
  quantity / role style but differ from our output, 190 use another
  representation, and nine are status-only or external references. None uses
  `~Deck`. The [audit table](TOPDECK_OVERPOWER_EVENT_AUDIT.md) records every
  entry and its differences. The exporter was not changed during that audit;
  the later Modern-only implementation is described above.
- **Skybound Battleground relationships need separate consideration.** Five
  structured Modern entries place a Battleground and its attached specials
  under Location, with a `[Battleground]` role and nested arrows. Our exporter
  previously used a separate Battlegrounds section without explicitly declaring
  special-to-Battleground relationships. It now nests catalog-confirmed G.D.A.
  specials under their Battleground in Location. Other prior differences include mission-set
  summaries versus individual mission cards, Universe label detail, Any
  Character effect/subtype labels, totals headers, and Aspect section names.
  Legacy examples additionally declare Battlesites and Activators. These are
  observed differences, not vendor requirements or proven rejection causes;
  see the [specific comparison](TOPDECK_OVERPOWER_EVENT_AUDIT.md#specific-differences-worth-reviewing).
- **Plain text is the submission representation supported by the evidence.**
  The signed-in OverPower submission form shows a Decklist text area with the
  placeholder `~Deck\nYour deck content here...`. Existing published OverPower
  submissions also contain ordinary text without that section marker.
  The placeholder is a suggested starting point, not proof of required syntax.
  [S2, S5, S14, S18]
- **A repeated full-deck formatting convention is now documented.** Eight
  Columbus Modern submissions use `-- Characters --` and other category
  headings, `1x` quantity prefixes, bracketed card codes, and explicit
  `[Frontline]`/`[Reserve]` tags. This is the strongest reproducible style
  located for a full-deck export. It is observed practice, not a vendor
  requirement or the majority style of all submissions. [S18]
- **The samples do not use the generic `~Deck` marker.** All 38 published
  Columbus entries were inspected; none contains it. Other entries use
  handwritten lists, abbreviated inventories, or team declarations. One is
  just an email-submission note. Match the repeated full-list style when
  exporting a complete Modern deck, and follow event instructions for a
  shorter declaration. [S18]
- **OverPower is outside Scrollrack's current supported games.** Both the live
  Scrollrack game registry and TopDeck's visual-deck support registry omit it.
  Do not infer OverPower card lookup, parsing, or legality checks from the
  general Scrollrack documentation. [S3, S4]
- **Some Legacy Mixed events require a team declaration rather than a complete
  draw-deck inventory.** Their instructions name characters, homebase, mission
  set, and Battlesite or Any Heroes; one upcoming event also names Battleground.
  Those requirements belong to the particular event. [S6, S7]
- **The documented tournament API has no deck submission endpoint.** The
  published OpenAPI specification has reads, tournament creation, and player
  registration, but no operation for uploading or replacing a player's deck.
  Player registration does not accept a decklist. [S8]
- **The signed-in form supplies no detailed OverPower-specific template.**
  Its only formatting help is “Enter your deck in the standard format.” No
  linked format guide, OP section example, quantity instructions, or file
  upload control appeared on the inspected form. The detailed convention in
  section 3.1 comes from published lists rather than a guide supplied by that
  form. [S14, S18]
- **Saving a new submission remains untested.** The inspected event had ended,
  so its text area was read-only. On October 9, creating an isolated test event
  was blocked by this account's hosting subscription gate. No registration
  was created or changed, and no deck was submitted. See section 9.1 for the
  prepared Modern samples and outstanding live test.
- **Test hosting can introduce a subscription.** The signed-in organizer
  dashboard redirected to `/subscribe`. The displayed monthly plan is $12,
  with a 14-day trial that automatically starts the selected paid plan unless
  cancelled. The trial has not been activated. [S19]
- **A Legal badge alone is insufficient to select complete submission samples.**
  Six of eight inspected non-Limited local lists had no stored reserve choice.
  Their exports consequently marked four characters `[Frontline]`. They were
  excluded from the complete Modern submission test set; the two retained
  lists have an explicit reserve. This is an observed local-data / export
  limitation, not a TopDeck rejection or a finding that their card inventories
  are illegal.

## 1. What TopDeck means by “format”

There are three separate concerns:

1. **Event format:** the tournament's game/rules selection.
2. **Submission syntax:** the text or other input the deck submission screen
   accepts.
3. **Required contents:** what that event's organizer requires the player to
   declare.

A `Modern` or `Legacy Mixed` event label does not itself specify a decklist
grammar. A stored submission does not establish that a judge accepted its
contents or that the deck is legal.

TopDeck's live `MasterGameLibrary.Overpower.formats` contains these exact keys:

| Game key | Event format keys |
| --- | --- |
| `Overpower` | `Modern`, `Draft`, `Sealed`, `Legacy Mixed`, `Modern Skirmish`, `Legacy Skirmish` |

These are TopDeck identifiers. In particular, preserve `Overpower` spelling
when using its case-sensitive API. Do not automatically map Excelsior's
Standard, Limited, or Skirmish settings to these identifiers without examining
the destination event. [S2, S9]

## 2. The publicly advertised submission configuration

The public bracket page loads `/ct.js`. Its OverPower entry includes this
configuration, extracted from the live source on the research date:

```json
{
  "supportsImport": false,
  "importSources": [],
  "sections": {
    "default": ["~Deck"]
  },
  "placeholders": {
    "default": "~Deck\nYour deck content here..."
  },
  "helpText": {
    "default": "Enter your deck in the standard format"
  }
}
```

Source: `MasterGameLibrary.Overpower.__deckConfig` in [the live public
configuration](https://battle.overpower.game/ct.js). [S2]

What this establishes:

- TopDeck advertises a single generic section, spelled **`~Deck`**, with one
  leading tilde and no trailing tilde.
- Its OverPower configuration advertises no automatic deck-builder import
  source.
- It supplies no OverPower-specific character, mission, location, power-card,
  or special-card syntax in this configuration.
- “Standard format” here is generic help text shared by other game entries;
  it does not define an OverPower tournament ruleset.

What it does **not** establish:

- That `~Deck` is mandatory. Published submissions below omit it.
- That a URL can never be stored as text; disabling automatic imports is a
  narrower claim than rejecting every URL.
- That quantities must precede names, or that card names are matched against
  an OverPower database.
- That every event or future version of the submission form has identical
  instructions. The current signed-in form inspected in section 6 matched
  this placeholder and help text, but no editable submission was tested.

## 3. Real published submissions

### 3.1 Columbus Modern regional: full-deck formatting evidence

The user-identified sample page is [OverPower Season One Regional #1:
Columbus, OH](https://topdeck.gg/bracket/overpower-regional-1-columbus-oh),
labeled **Overpower Modern**. All four standings pages were reviewed. [S18]

| Standings page | Entries | Published decklist links |
| --- | --- | --- |
| 1 | 16 | 12 |
| 2 | 16 | 13 |
| 3 | 16 | 9 |
| 4 | 6 | 4 |
| Total | 54 | 38 |

“Published decklist links” counts stored content, not certified complete decks.
For example, position 4 contains only an email-submission note; positions 23
and 49 contain short team/location/mission declarations. Six representative
drawers were opened, and the deck text attached to all 38 rendered links was
read. Decoding of line breaks and escaped punctuation was checked against the
displayed drawer text at positions 1, 2, 4, 5, 6, and 50. Player names and
account identifiers are unnecessary to this formatting evidence.

#### Repeated structured full-list style

Positions **1, 9, 19, 24, 41, 43, 44, and 50** share this style. Each contains
an inventory with character roles and grouped draw-deck cards. The opening of
position 1, copied with its displayed line breaks, is:

```text
Cards: 56/56 | Threat: 76/76

-- Characters --
1x Angry Mob: Middle Ages [ERB] [Frontline]
1x Morgan le Fay [ERB] [Frontline]
1x Wicked Witch [ERB] [Frontline]
1x Cthulhu [ERB] [Reserve]
-- Location --
1x The Round Table [ERB] [Homebase]
-- Mission --
The Call of Cthulhu - Mission Set
-- Special Cards --
1x Angry Mob: Middle Ages: Regent of the Crown [ERB]
```

This is an **excerpt**, not the complete 56-card inventory. The full entry
continues with specials, Any Character cards, universe cards, power cards,
an event, and a homebase card.

The recurring conventions are:

| Element | Observed presentation |
| --- | --- |
| Summary | `Cards: 56/56 \| Threat: 76/76`; other entries have different totals, including unequal card counts such as `53/51`. |
| Section boundary | A line containing two hyphens, a space, the category name, a space, and two hyphens: `-- Characters --`. These are neither `~Deck` nor Scrollrack's double-tilde sections. |
| Card quantity | Number followed immediately by lowercase `x`, then a space and the name: `1x`, `2x`, `3x`. |
| Character identity | Full character name/variant, a bracketed code, and `[Frontline]` or `[Reserve]`. |
| Character order | Not fixed: the reserve is fourth at position 1, second at position 24, and first at position 50. The role tag carries the distinction. |
| Location | `1x <location name> [ERB] [Homebase]` in the four entries with a Location section. |
| Mission | Usually `<mission name> - Mission Set` beneath `-- Mission --`; position 9 instead puts a mission declaration before Characters. |
| Character special | `<quantity>x <owner>: <special name> [ERB]`; owner capitalization varies. |
| Any Character special | `<quantity>x ANY CHARACTER: <code or subtype>: <name> [ERB]`; examples include `AG`, `DB`, and `cata`. |
| Universe | Allies and teamworks share `-- Universe Cards --`; teamwork descriptions can include level, use condition, and follow-up attack types. |
| Power card | Quantity plus value/type, for example `2x 8 Energy [ERB]` or `1x 5 Multipower [ERB]`. |
| Other/homebase cards | `Isis` and `Amaru: Dragon Legend` appear under `-- Other Cards --`; position 1 instead uses `-- Homebase Cards --` for Isis. |

`[ERB]` appears in all eight structured samples. That records their exported
code; it does not establish a complete set-code dictionary or justify adding
that code to every card in a future export. The meaning and legality of the
summary denominators are also not defined by this sample set.

Observed headings and their frequency within these **eight** entries:

| Exact heading | Entries using it |
| --- | --- |
| `-- Characters --` | 8 |
| `-- Location --` | 4 |
| `-- Mission --` | 6 |
| `-- Special Cards --` | 8 |
| `-- Any Character Cards --` | 8 |
| `-- Universe Cards --` | 8 |
| `-- Power Cards --` | 8 |
| `-- Events --` | 3 |
| `-- Homebase Cards --` | 1 |
| `-- Other Cards --` | 7 |

Section order generally follows the table, with Events and Other/Homebase
cards at the end. Missing categories are omitted rather than represented by a
universal empty-section syntax. Position 50 also declares cards attached to
its homebase with indented arrow lines:

```text
-- Location --
1x Spartan Training Ground [ERB] [Homebase]
  → Training Energy Brute Force [ERB] (on location)
  → Training Energy Intelligence [ERB] (on location)
  → Training Brute Force Intelligence [ERB] (on location)
```

Those attachment lines have no `1x` prefix. Preserve their location association
when designing an export; the samples do not define how an importer or a
legality calculator would interpret them.

#### Other styles that are actually stored

The repeated structured style is **8 of 38 entries**, not a mandatory or
majority grammar. Other inspected entries show substantial flexibility:

| Positions | Observed alternative |
| --- | --- |
| 2, 12 | Quantity before the name without `x`, such as `1 cloud surfing`; character names/group labels introduce specials. |
| 5, 6, 10, 11 | Quantity after the name, such as `Inspirational Leadership x2`; headings can end with `;` or `:`. |
| 7, 11, 29, 45 | Explicit front-line and reserve declarations, followed by separately labeled inventories. |
| 14, 51 | Character names followed by dash-prefixed specials and abbreviated card types. |
| 15 | Quantity followed by a spaced hyphen, then the card, such as `2 - Tenacious Persuit` (spelling as stored). |
| 17, 20, 21, 26, 37 | Several cards on one line, with commas and quantities embedded in the text. |
| 23, 49 | Short team, location, and mission declarations rather than full inventories. |
| 52 | Quoted group/card names in a JSON-like handwritten list; this is not evidence of JSON-schema recognition. |
| 4 | Email-submission note rather than deck contents. |

No inspected Columbus entry contains `~Deck`. These published samples establish
real presentation conventions and storage/display behavior. They do not prove
current server validation, organizer approval, completeness, or legality.
The authoring tool behind the repeated style was not identified. [S18]

### 3.2 Peacebridge Legacy Mixed: short declarations

The completed **2026 Peacebridge Memorial**, a Legacy Mixed event, has public
decklist links in its standings. Clicking them opens a text drawer on the
bracket page. It does not route OverPower to the visual card-gallery viewer.
Three inspected entries illustrate the variation:

| Standings position inspected | Observed representation |
| --- | --- |
| 6 | Four character names and three other declarations, each on a separate line; no header or quantities. |
| 7 | Separate lines, with parenthetical notes identifying a character variant, negate count, and mission count. |
| 9 | One sentence with commas and a three-stat character note; no section marker. |

One displayed example, preserving spelling and line breaks:

```text
Beast: the Brute
Heroes for Hire
Van Helsing
Silver Sable
Barsoom
AoA
The Crossing
```

This is an observed stored submission, **not** a canonical template or a
certified legal deck. Names and punctuation were not normalized. No player
identity is needed to reuse this evidence. [S5]

Implication: there is direct evidence that TopDeck can retain and show both
full OverPower inventories and shorter declarations as free-form text.
The Columbus structured samples supply a concrete style to copy; the
Peacebridge declarations should not be used as the full-deck template for
every Modern event. Neither sample set proves the current form's validation
requirements or a universal preferred ordering.
The public client code rejects an empty or whitespace-only list; server-side
limits and acceptance rules were not tested. [S17]

## 4. Event-specific declaration requirements

### 2026 Peacebridge Memorial — Legacy Mixed

The event description requires submission through the TopDeck website or
mobile app. The requested contents are:

- Four character names, identifying three-stat versions when appropriate.
- Homebase.
- Mission set.
- Battlesite name or Any Heroes.

It does not ask for every special, power, universe, or other draw-deck card in
that published instruction. That describes this event's declaration scope,
not a universal exemption from full deck registration. [S6]

### Battle for Boston — Legacy Mixed

The upcoming event's description requires deck information before the event
starts and names characters, homebase, mission set, and Any Heroes/Battlesite/
Battleground. Its wording does not specify a delimiter, section grammar, or
full card inventory. [S7]

### Modern, Draft, Sealed, and Skirmish

The public game configuration uses the same generic submission configuration
across OverPower's listed event formats. This research did **not** establish
that their organizer requirements match the Legacy Mixed examples. Read the
target event's own instructions before deciding whether to export a team
declaration, a complete list, or both. [S2]

The signed-in form for a completed **Modern** event was also inspected. It
showed the same generic placeholder and help text, without a full-inventory
template. That verifies the form's presentation, not Modern registration
requirements or the acceptance of a particular deck. [S14]

The Columbus Modern regional provides published full-inventory examples,
including the repeated style in section 3.1. Its page also stores short
declarations. Use the full-list samples as formatting references; neither
presence of a full list nor presence of a short declaration determines what
every Modern organizer requires. [S18]

## 5. Scrollrack and visual-deck behavior

The live `GET https://scrollrack.topdeck.gg/api/games` response listed game
codes `cookie`, `gundam`, `mtg`, `onepiece`, `riftbound`, `snap`, `wok`, and
`yugioh`. It contained no OverPower entry. [S3]

Separately, TopDeck's public `/js/supportedGames` script defines the set used
by the bracket's visual-deck routing. `Overpower` is absent. The bracket's
`viewTextDecklist` function opens a visual deck page for supported games and
otherwise displays the stored text in a drawer; that fallback was observed
live for OverPower. [S4, S5]

The signed-in **Deck Visualizer** game selector was checked separately and
also offered no OverPower option. No visualization was generated. [S16]

Scrollrack's general documentation describes `~~Section Name~~` markers and
quantity/name lines for its supported games. That is **not an established
OverPower contract**. Do not replace TopDeck's OverPower `~Deck` placeholder
with `~~Mainboard~~`, `~~Characters~~`, or another invented section on the
strength of those docs. [S2, S10]

Likewise, submission, text display, automatic import, visual rendering, and
legality validation are distinct capabilities. A successful text save would
not establish the latter three.

## 6. Submission workflow and event controls

### Verified signed-in desktop form

The desktop submission route is:

```text
https://topdeck.gg/deck/{TID}/submit
```

TopDeck's public My Events script links to this route. Signing in alone is
insufficient: opening the Battle for Boston submission route displayed
“You're not registered for this event.” An existing registration for
**July 2026 Battle California - West Coast Online OverPower League** exposed
the form without creating a new registration. [S14, S15]

Observed on that form:

| Item | Verified presentation |
| --- | --- |
| Event game and format | `Overpower · Modern` |
| Event state | `The event has ended` |
| Decklist field | Text area labeled `Decklist`, with the placeholder `~Deck` followed by a newline and `Your deck content here...` |
| Formatting help | `Enter your deck in the standard format` |
| Other controls | `Past events` button and `Archetype` selector, both disabled in this ended-event view |
| Editing state | Decklist text area has `readonly`; no editable save flow was exercised |
| Detailed format guide | No visible linked guide, OP-specific section example, or quantity/name instructions |
| File or external-builder import | No such control visible on this form; consistent with the OP configuration's empty import sources |

The completed-event restriction is material: this is direct verification of
the current form and its instructions, not a successful save, proof of
server-side validation, or a test of active-event controls. [S14]

### User handoff and organizer controls

TopDeck's mobile documentation describes registered events under **My Events**
with Submit Decklist, View Decklist, and Decklist Submitted states. Submission
sources depend on game and format. The app uses the same account and
registrations as the website. [S11]

For an eventual user handoff:

1. Open the destination event and read its registration instructions.
2. Use the TopDeck account attached to that event registration.
3. Open that event's decklist submission control, or its `/deck/{TID}/submit`
   page after confirming the event identifier.
4. Check its current OverPower formatting instructions before pasting.
5. Submit through TopDeck, then reopen the saved list to confirm it survived
   correctly.

The signed-in form was verified as described above. Pasting, saving, and
reopening a newly submitted deck remain untested.

Organizer configuration controls whether submission is enabled, whether
lists are public, and the decklist deadline. Staff can inspect a player's
decklist or add/replace one when event rules allow it. A deck deadline locks
player edits; the mobile app cannot bypass it. [S11, S12, S13]

No event was created, registration changed, deck submitted, or deadline altered
during either research pass. No temporary enrollment needed removal.

## 7. API boundary

The current published OpenAPI specification contains eleven paths:

```text
POST /v2/tournaments
GET  /v2/tournaments/{TID}
GET  /v2/tournaments/{TID}/info
GET  /v2/tournaments/{TID}/standings
GET  /v2/tournaments/{TID}/players/{ID}
GET  /v2/tournaments/{TID}/rounds
GET  /v2/tournaments/{TID}/rounds/latest
GET  /v2/tournaments/{TID}/attendees
POST /v2/tournaments/create
POST /v2/tournaments/{TID}/register
GET  /v2/me/tournaments
```

The registration request exposes `emails` and `overrideCap`, not a deck
payload. No deck-write operation appears. This confirms the absence of a
**documented public** upload endpoint; it does not claim TopDeck has no internal
web submission handler. Do not build a supported integration around a private
browser handler. [S8]

The current public submission-page module does contain an internal browser
save handler: `POST /deck/setDecklist`, with an event identifier, `decklist`
text, and an optional `archetype`. Its client-side save function trims the
text and checks that it is nonempty; that function does not enforce `~Deck`,
OP headings, or quantity/name lines. The automatic parse/preview effect is
gated on a Scrollrack game mapping. File import controls are gated on the
configured import sources. This is **static client-code evidence**, not a
supported public API or proof of what the server accepts. The code handles
server rejection of invalid decklists; neither this handler nor the parse
handler was invoked during the research. [S17]

The API can still help retrieve event metadata and published submissions.
Responses expose `decklist` as text or a URL and may include `deckObj` when
structured data exists. Public deck visibility depends on event completion or
the organizer's Show Decks setting. Staff visibility requires a staff role.
These generic fields do not prove an OverPower structured schema. [S8, S9]

API reads require a key in the `Authorization` header, and use of the API
requires attribution. No key was obtained or authenticated tournament query
performed here. [S9]

## 8. Implications for Excelsior

### Current repository behavior

The local export panel now has a **JSON / TopDeck** toggle. TopDeck is the
default; JSON uses the existing `buildDeckExportJson` contract. TopDeck uses
`buildDeckExportTopDeck` to produce the grouped full-list style described below;
the clipboard copies the selected representation. This is local implementation
evidence, not confirmation of a successful TopDeck submission.

The text builder now follows the [Modern-only modal template](TOPDECK_OVERPOWER_MODERN_FORMAT.md):
card/threat totals, actual catalog set codes, quantities, variants, reserve roles,
mission-set summaries without individual mission rows, compact Universe labels,
and the observed Any Character codes/subtype abbreviations. Battlegrounds and
catalog-confirmed G.D.A. specials appear together under Location. Aspects remain
in Other Cards. `[Pre-Placed]` still preserves saved placements without a unique
location. JSON retains the full mission inventory and its existing contract.

The earlier [mixed-format audit](TOPDECK_OVERPOWER_EVENT_AUDIT.md) records the
previous output's differences. None of these observations establishes an
automatic TopDeck parser or legality-validation contract.

Repository pointers:

- [`ExportDeckPanel.tsx`](frontend/src/features/deck-editor/ExportDeckPanel.tsx).
- [`buildDeckExportJson.ts`](frontend/src/lib/decks/buildDeckExportJson.ts).
- [`buildDeckExportTopDeck.ts`](frontend/src/lib/decks/buildDeckExportTopDeck.ts).

This is checkout evidence from the research date, not a claim about the current
deployed site. The checkout already contained unrelated changes.

### Recommended full-list style based on published Modern samples

A separate **copyable text export** is the practical handoff supported by the
current evidence. Keep the existing JSON export available for its existing
purpose. Treat API-driven submission as unavailable under the documented
contract.

For a complete Modern deck, mirror the repeated template confirmed by the
past-year Modern-only review. This recommendation is based on actual published lists rather
than invented category labels. It remains a human-readable text export, not a
machine-validated schema. A schematic layout is:

```text
Cards: <draw-deck count>/<51 or 56> | Threat: <team threat>/76

-- Characters --
1x <front-line character and variant> [<card code>] [Frontline]
1x <front-line character and variant> [<card code>] [Frontline]
1x <front-line character and variant> [<card code>] [Frontline]
1x <reserve character and variant> [<card code>] [Reserve]
-- Location --
1x <homebase> [<card code>] [Homebase]
1x <Battleground> [<card code>] [Battleground]
  → <associated special> [<card code>] (battleground special)
-- Mission --
<mission set name> - Mission Set
-- Special Cards --
<quantity>x <owner>: <special name> [<card code>]
-- Any Character Cards --
<quantity>x ANY CHARACTER: <known code or subtype>: <card name> [<card code>]
-- Universe Cards --
<quantity>x <universe card name and distinguishing details> [<card code>]
-- Power Cards --
<quantity>x <value> <power type> [<card code>]
-- Events --
<quantity>x <event name> [<card code>]
-- Other Cards --
<quantity>x <other card name> [<card code>]
```

Angle-bracket fields above are explanatory placeholders, not literal output.
Omit absent categories. Use verified card codes where available; do not
fabricate codes or abbreviations. Keep the explicit reserve/front-line tags
even if characters are sorted differently. Include location selections under
their owning location, using the observed arrow notation where applicable.

The `Cards: ... | Threat: ...` header is now included to match 19 of the 20
structured Modern inventories, using the existing saved-deck metrics and Modern
minimum (51 without events, 56 with events). The header is not a validation
receipt. The default full-list export should
not prepend `~Deck`: none of the 38 Columbus samples does so, and the form
shows it only as a placeholder. This is a recommendation from the evidence,
not a claim that the marker is forbidden.

Use real line breaks in copied text, not serialized `\\n` escape sequences.
Preserve full card names, variants, quantities, ownership of specials, mission-set
names, and named location/reserve selections. JSON preserves individual mission
identities. Some samples contain
abbreviations, misspellings, or wrapped names; an Excelsior export should use
its verified names and one card per line rather than reproduce those defects.

### Short declaration mode for events requesting team details

For an event requesting only team details, a readable draft could be:

```text
Characters:
<front-line character 1, including variant if relevant>
<front-line character 2, including variant if relevant>
<front-line character 3, including variant if relevant>
<reserve character, including variant if relevant>

Homebase: <name or explicit absence>
Mission Set: <name; distinguish mixed missions if necessary>
Battlesite / Any Heroes: <declaration>
Battleground: <declaration if the event requests it>
```

**This is a proposed human-readable export, not an official TopDeck template
or a tested submission.** The specific labels, ordering, reserve position,
and explicit-absence wording are proposed choices for clarity. Follow the
target organizer's example if one is supplied. The signed-in form did not
endorse a particular declaration layout.

Keep this short mode separate from the full-list style above. The public
samples now establish usable group headings and quantity conventions, but
they still do not establish machine-recognized OverPower parsing rules.

Recommendations derived from the evidence:

- Do not paste Excelsior's JSON as though TopDeck recognizes that schema.
- Do not advertise automatic import of an Excelsior share URL.
- Prefer the observed double-hyphen full-list headings over invented sections
  for a Modern full-deck export.
- Preserve recognizable names and relevant variants rather than database IDs.
- Keep legality checks in Excelsior and organizer review separate from the
  act of copying or saving a submission.
- Do not describe “Copied” as “Submitted”; the user must complete the event's
  submission flow on TopDeck.

## 9. Remaining verification

The signed-in **OverPower submission form** has now been inspected for an
existing Modern registration. It confirms a text field, the generic `~Deck`
placeholder, and generic help, with no visible linked format/example guide.
Public searches, help pages, configuration, and the inspected form did not
expose a standalone detailed OverPower grammar document. This does not rule
out an organizer document, historical guide, or community convention.

The Columbus samples now fill the practical formatting gap: section 3.1
documents a repeated full-list convention and section 8 recommends adapting
it for Excelsior. An official grammar document is still unlocated, but readable
export design no longer needs to begin with invented headings.

What is now established and what remains to verify:

| Question | Current evidence |
| --- | --- |
| Is there a preferred OP-specific template or a linked sample? | No vendor guide located; eight Columbus full lists share a detailed reproducible style, now recommended for full-list export. Other styles also occur. |
| Is `~Deck` required, optional, or only a placeholder? | Verified as a placeholder; no client heading check; none of 38 Columbus published entries uses it. Current server requirement untested. |
| Are there character, mission, or card-type headings to reuse? | Yes: the observed double-hyphen headings in section 3.1. Machine recognition is unestablished. |
| Does the current form require quantity/name lines? | No instruction or client save check observed. Samples use `1x Name`, `1 Name`, `Name x1`, and other presentations; server acceptance untested. |
| Is there an OP file upload option or accepted extension? | None advertised by the OP configuration or visible on the inspected form; no accepted OP extension established. |
| Are full inventories required at Modern events? | Must be established for the target event. |
| How should reserve, variants, mixed missions, and named special selections be represented? | `[Frontline]`/`[Reserve]`, names/variants, mission-set lines, and location attachment arrows are observed. Mixed-mission and other unobserved selections still need explicit exporter choices or organizer examples. |
| Does a freshly submitted list round-trip correctly? | Not tested; the inspected event was ended and the editor was read-only. No submission performed. |

Remaining checks concern the target organizer's required scope, unobserved
card/selection cases, and, if implementation requires proof of acceptance,
a submission/round-trip test in an explicitly authorized editable event or
fixture. Temporary registrations
made for a future test must be removed afterward, as instructed by Kyle.

### 9.1 Authorized live-test attempt and Modern sample preparation

**Status on 2026-10-09: local preparation passed; TopDeck saving is blocked
pending approval to activate hosting.** Kyle authorized creating an isolated
test event, submitting/reopening exports, and removing any registration made
for the test. He subsequently required a variety of **legal Modern decks**.
No subscription activation, payment, event creation, enrollment, or decklist
submission occurred in this attempt.

#### Hosting and API boundaries

The signed-in account's request for
[`/tournaments/dashboard`](https://topdeck.gg/tournaments/dashboard) redirected
to [`/subscribe`](https://topdeck.gg/subscribe). Its FAQ says the 14-day trial
automatically starts the selected plan afterward; monthly pricing displayed
$12/month and annual pricing $120/year. Cancellation during the trial avoids
the charge. Account-specific eligibility and the checkout details remain
unverified because activation was not attempted. [S19]

The current tournament API documents `POST /api/v2/tournaments/create` and
requires an active TopDeck subscription. `Overpower` and `Modern` are the exact
identifiers. Omitting `eventPage` creates an unlisted, bracket-only tournament.
This is a real event, not a documented sandbox. No test-event flag or OverPower
validation endpoint was established, and registration still provides no
deck-upload operation. Staff reads can expose saved decklists to authorized
event staff, but they are not a substitute for submission. [S9]

#### Prepared complete Modern samples

The running local Excelsior UI was used as Guest, in read-only deck views.
Both retained samples reported `legal: true`, `limited: false`, and threat 76.
Their actual TopDeck previews and clipboard output matched exactly.

| Local sample | Draw-deck cards | Mission set | Starting team / reserve | Coverage |
| --- | --- | --- | --- | --- |
| S1 Regionals (Columbus 2nd, Noor El-barrad | 51 | The Chronicles of TFAC | Sun Wukong, Zorro, Dejah Thoris; Jane Porter in Reserve | No events; homebase, Aspect, owned and Any Character Specials, Teamwork, Allies, and Power quantities. |
| S1 Regionals (Columbus 3rd, Charlie Hanford) | 58 | The Warlord of Mars | Korak, Ra, Zeus; Jane Porter in Reserve | One event; homebase, Aspect, owned and Any Character Specials, Advanced Universe, Teamwork, Allies, and Power quantities. |

For each export, checks confirmed four characters, three `[Frontline]` tags,
one `[Reserve]` tag matching the stored selection, seven named missions from
one set, and quantity totals matching the displayed draw-deck size. The 51-card
and 56-card-with-events minimums were satisfied. These are Excelsior checks and
export consistency checks, not an independent tournament judge's certification
of every card interaction or an event-specific ban-list review.

Captured UTF-8 export fingerprints, without a trailing newline:

| Sample | Characters in text | SHA-256 |
| --- | --- | --- |
| Noor | 2,331 | `2839a4a5e8d5291a0f2efc3d1542f024f5592adb241ed29391ae3616ecd89018` |
| Charlie | 2,157 | `23b8f884cb9643a24edf71b163ba5d2116647573192d313b681c1db7dc5eaf48` |

Six further Legal / non-Limited local candidates were inspected: Turtle Max,
Columbus winner Justin Sadaie, Seattle Phil Miller, and Nationals Joe Peters,
Jessica Simms, and Andrew Taylor. Each had `reserve_character: null`; their
exports labelled all four characters Frontline, so they were not included in
the complete-team test set. The earlier Ungodly Powers preview was also
excluded because it is Limited and has only 45 draw-deck cards.

**Coverage still needed:** more complete teams, including Skybound; Basic
Universe and Training pre-placement; Battlegrounds; and actual TopDeck save,
replacement, reload, and staff text inspection. Neither prepared sample has
pre-placed cards or a Battleground. Do not mark these cases passed based on
unrelated exporter unit tests or the existing published samples.

#### Execution and cleanup procedure once hosting is available

1. Create a future `Overpower` / `Modern` tournament named clearly as an
   Excelsior export test. Leave **Set up event page next** off so that it remains
   an unlisted bracket-only event; do not add paid registration. [S20, S9]
2. In Configuration, enable Decklist Submission, keep Show Decklists off, set
   a future deadline, and save. Keep the tournament unstarted. [S12]
3. Register only Kyle's existing TopDeck account. Record the event and test
   registration identifiers immediately, without copying email, credentials,
   or API keys into this repository. Use the player-facing submission form.
4. Submit each selected export in turn. Reopen after a reload and compare
   the stored text with the original, including names, punctuation, quantities,
   mission identities, team roles, and any placement arrows. Record any actual
   trimming or normalization rather than assuming byte-for-byte preservation.
5. Inspect the staff's raw-text deck view. A save receipt or a manually marked
   Deck Checked state is not proof of automatic OP legality validation. [S21]
6. Remove Kyle's test registration **before starting any round** and verify
   that it is gone. Archive the test event if available. If a trial was
   specifically authorized for this test, cancel it and verify the resulting
   billing state before finishing. Preserve all pre-existing registrations.

The roster guide permits registration removal before the event starts;
starting the event changes the available action to dropping a player. This is
why this procedure leaves the test unstarted. [S13]

Local API and Vite-proxy health were OK at source revision
`3075fba84450919773845ff10159d454119c4132`, migration 367. The working-tree
fingerprint was
`2977103d28a3d385c17820e38fc0db3c26097095552593e12da8a466116723b2`.
The startup helper could not establish Docker/container ownership, so no
local fixture records were written. Existing servers and source decks were
preserved. Private, temporary evidence for this attempt is under
`/private/tmp/topdeck-modern-test-20261009/`; it is not a durable repository
dependency and contains no account secrets.

## 10. Sources and refresh procedure

Initial observations below are dated 2026-10-08; S9 and S19–S21 were refreshed
on 2026-10-09. Public scripts and registries can
change without versioned documentation. Treat them as observed behavior, not a
vendor guarantee.

| ID | Primary source | Evidence used |
| --- | --- | --- |
| S1 | [OverPower event hub](https://battle.overpower.game/) | TopDeck-powered event entry point and My Events link. |
| S2 | [Live game configuration](https://battle.overpower.game/ct.js) | `MasterGameLibrary.Overpower`, event identifiers, and `__deckConfig`. |
| S3 | [Scrollrack live game registry](https://scrollrack.topdeck.gg/api/games) | Current supported games; no OverPower. |
| S4 | [TopDeck visual-deck game registry](https://battle.overpower.game/js/supportedGames) | `window.SUPPORTED_GAMES`; no OverPower. |
| S5 | [Peacebridge public bracket](https://topdeck.gg/bracket/2026-peacebridge-memorial) | Live text previews at standings positions 6, 7, and 9; `viewTextDecklist` fallback in its public HTML. |
| S6 | [Peacebridge event instructions](https://topdeck.gg/event/2026-peacebridge-memorial) | Required team declaration and character-variant note. |
| S7 | [Battle for Boston event instructions](https://battle.overpower.game/event/battle-for-boston) | Required pre-event declaration, including Battleground wording. |
| S8 | [TopDeck OpenAPI specification](https://topdeck.gg/openapi.json) | Complete advertised path inventory and registration request schema. |
| S9 | [Tournament API documentation](https://topdeck.gg/docs/tournaments-v2) | Identifiers, authentication, deck fields, visibility, and attribution. |
| S10 | [Scrollrack API reference](https://scrollrack.topdeck.gg/docs/api) | General supported-game formatting; not an OP schema. |
| S11 | [TopDeck mobile app guide](https://topdeck.gg/help/mobile-app) | Registered-event submission controls and account/deadline behavior. |
| S12 | [Event configuration guide](https://topdeck.gg/help/event-configuration) | Submission, public visibility, and deadline controls. |
| S13 | [Roster and decklist management guide](https://topdeck.gg/help/player-management) | Staff decklist actions and lock state. |
| S14 | [Signed-in Modern submission form](https://topdeck.gg/deck/july-2026-battle-california-west-coast-online-overpower/submit) | Live registered-account inspection: text area, exact placeholder/help, ended-event read-only state, disabled Past events/Archetype controls, and absence of a visible detailed guide/import control. Requires the relevant registration; this URL may show an access gate to other accounts. |
| S15 | [Public My Events script](https://battle.overpower.game/js/myevents.js?v1.0) | Desktop `/deck/{TID}/submit` route discovery. Unregistered access gate also observed live at [Boston's submission page](https://topdeck.gg/deck/battle-for-boston/submit). |
| S16 | [TopDeck Deck Visualizer](https://topdeck.gg/deck/deck-visualizer) | Signed-in inspection of the game selector; no OverPower option. |
| S17 | [Public submission-page module](https://battle.overpower.game/dist/chunks/mount-sc0WtkQW.js) | Static read of text-save handling, optional archetype, nonempty/trim check, Scrollrack preview gate, and import-source controls; loaded by the public `/dist/deck.js` entry point. No internal endpoint called. |
| S18 | [Columbus Modern regional public bracket](https://topdeck.gg/bracket/overpower-regional-1-columbus-oh) | All four pages: 54 standings entries, 38 published-content links, eight repeated structured full lists, and zero `~Deck` markers. Text read from rendered link data and cross-checked against six displayed drawers. Representative exact excerpts, heading counts, quantity styles, reserve roles, and location attachments are in section 3.1. |
| S19 | [TopDeck hosting plans and trial FAQ](https://topdeck.gg/subscribe) | Signed-in dashboard redirect; displayed pricing and automatic renewal after the trial. No trial or checkout activated. |
| S20 | [Creating tournaments](https://topdeck.gg/help/creating-tournaments) | Dashboard creation flow, game/format selections, and optional event-page setup. |
| S21 | [Judge tools and deck checks](https://topdeck.gg/help/judge-tools) | Staff raw-text / parsed views and manual deck-check controls; no OP validator established. |

Direct reads of some `topdeck.gg` pages returned HTTP 403, while the browser,
search reader, or the equivalent OverPower white-label resource was readable.
For reproducibility, the OpenAPI file inspected directly was served from
[`battle.overpower.game/openapi.json`](https://battle.overpower.game/openapi.json).
The public bracket's white-label HTML was also inspected. No authentication
restriction was bypassed.

Hashes of directly retrieved evidence:

| Resource | SHA-256 |
| --- | --- |
| S2 `/ct.js` | `75c9aa8c57c077098e025040b17ed0ab69c0470edc2c1d12e15c2c24d1b2c324` |
| S3 `/api/games` | `3871800fca0500eda00591493536690c2d3df867a99ad3d47ee562333aa95a6f` |
| S4 `/js/supportedGames` | `238196577e77ccca38b9eba7adc7bf43bea1fbcc794acee8d2c76bf844b40e41` |
| S8 white-label `/openapi.json` | `43601c01d12d4ee63d0b99bef4c6d04ed11ded9b1bc96e7e416607845ca685d2` |
| S15 `/js/myevents.js?v1.0` | `6765b00cadf350c46154fff3b383d2fe425d1f59c03acc122ff78fbbe7a1f1c3` |
| S17 submission module | `3a4de6e6be1af200f4da940c95a02b629985a1040cbcb947dbdff58ae4e00531` |

To refresh this context, re-read those resources, compare the OverPower entry
and API paths, inspect the target event's requirements, and inspect the current
signed-in form using an existing authorized registration where possible. The
Columbus bracket can be refreshed by paging through all standings and reading
each published list; keep sample counts distinct from completeness/legality.
The submission module's chunk filename may change; resolve it from the current
public `/dist/deck.js` entry point. Update confirmed findings separately from
proposed export choices. Do not substitute a generic Scrollrack format for
missing OverPower instructions.
