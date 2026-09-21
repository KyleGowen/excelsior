# Excelsior Codex Skills

Repo-local Codex skills live here. They are the project source of truth for recurring Excelsior workflows; do not maintain a separate Cursor/global mirror.

| Skill | Trigger phrases | Status | Source |
|-------|-----------------|--------|--------|
| `start-excelsior` | `/start`, "Start Excelsior", "start dev servers" | Active | Merged from `.cursor/skills/start` plus existing Codex helper |
| `ship` | "ship", "ship it" | Active | Migrated from `.cursor/skills/ship` |
| `add-card` | "add card", `/add-card`, image path under `src/resources/cards/images/` | Active | Migrated from `.cursor/skills/add-card` |
| `api-layer-migration` | route migration, `/api/v1`, thinning `src/routes` | Active | Migrated from `.cursor/skills/api-layer-migration` |
| `start-aws-db-tunnel` | SSM DB tunnel, production RDS, TablePlus/psql to prod | Active guarded runbook | Migrated from `.cursor/skills/start-aws-db-tunnel` |
| `pdf-to-png` | `/pdf-to-png`, convert PDF artwork to PNG | Active | Migrated from `.cursor/skills/pdf-to-png` |
| `fix-trivy` | Trivy CI failure, dependency scanner failure | Active | Existing Codex skill |
| `orange-king-price` | The Orange King, theOrangeKing, Orange King, OverPower retail price | Active | Repo-local Shopify price scraper |
| `generate-card-checklist` | set checklist, collection checklist, priced personal checklist | Active | Repo-local standalone checklist generator |
| `ingest-aws-cost-reports` | AWS cost email, missing Biz Ops month, stale AWS cost data | Active guarded workflow | Weekly reports, finalized invoices, Cost Explorer, and business-operations ledger reconciliation |
| `aws-cost-audit` | AWS cost savings, infrastructure cleanup, ECR/RDS/VPC cost review | Active read-only workflow | Excelsior-only live AWS audit with savings estimates and production-risk assessment |

Skipped by choice:

| Cursor skill | Reason |
|--------------|--------|
| `add-community-deck` | Not needed in Codex project workflow |
| `add-tournament-deck` | Not needed in Codex project workflow |
| Cursor product skills except possible future workflows | Cursor-specific or not currently needed |

Migration conventions:

- Keep skill names lowercase and hyphenated.
- Each skill must have `SKILL.md`; add `agents/openai.yaml` for user-facing display metadata.
- Prefer bundled scripts for deterministic or fragile workflows.
- Adapt Cursor-only concepts to Codex-native behavior: use parallel tool calls instead of Cursor Task subagents, and use local browser/API verification instead of Cursor IDE browser MCP.
- Keep links relative to the skill folder, usually `../../../` back to the repo root.
