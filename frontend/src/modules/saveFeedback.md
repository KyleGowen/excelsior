# Host save feedback

`ModuleHost.saveFeedback.render` receives only `status`, the current user-facing `message`, and `newerEditsPending`. It is a trusted pure presentation callback. It receives no player, record identifier, transport, credential, retry or persistence callback. Omission/undefined retains existing Excelsior feedback; null suppresses the presentation. Saved/error/pending host text follows the existing desktop/mobile save locations. Read-only modules cannot acquire Save by configuring this slot.

The existing metadata/card save sequence remains authoritative and is not made atomic by this port. A failure can follow a successful metadata request. Newer edits remain dirty, and a saved message refers to its captured snapshot. Existing result expiration remains 2.5 seconds; an earlier timer is cancelled before another save and on unmount. The renderer does not start saves or change permissions.

Guest metadata mutation responses omit full-read ownership fields. The cache merges supplied metadata into the full-read record; an explicit server field still wins. It does not invent ownership from a Guest deck identifier. Backend enforcement remains unchanged.

The development harness offers real local saves, delayed metadata replies and a deliberately rejected local fixture operation. Rejected fixture mode throws before its mutation call; it is not a demonstrated backend outage. Guest copies are disposable and their session-derived identifiers are masked in the harness. Do not store raw Guest IDs or full snapshots in committed evidence. Normal Excelsior does not enable these fixture modes.
