# ERB LRG Art Import

`lrg-erb-manifest.json` records the reviewed mapping from LRG's supplied Google Drive folder to
the public `erb/` image tree and Flyway V359. It deliberately excludes Drive object IDs while
retaining source filenames and byte sizes so a future refresh can be reconciled without treating
the working folder as the only source of truth.

Import rules:

- Use the front image for collectors `350`–`356`, `362`–`368`, `374`–`380`, and `386`–`392`;
  the corresponding mission backs are not individual catalog cards.
- Prefer the non-copy source when Drive contains both an original and a `copy` duplicate.
- Collector `205` is absent from the supplied folder, so its existing image remains in service.
- Foil database rows reuse the matching base LRG image; the frontend provides the foil sheen.
- A legacy local database may contain Dracula `494F`, which is absent from canonical migration
  history; update it when present without requiring it on a fresh database.
- Collectors `504`/`504F` and `526`/`526F` correct legacy alternate-art numbering during the
  image migration.
- Collectors `461` and `463` update their canonical rows only because the folder supplies no
  separate image for their existing legacy alternate-art rows.

The source images live at `src/resources/cards/images/erb/<type>/`. Run
`npm run generate:thumbnails` after changing the source tree, and commit every generated file
under `src/resources/cards/images/erb/thumb/` with its source.
