# Excelsior Codex Skills

Ship uses deterministic receipts and tool-level waits. Bounded Luna Low execution does not transfer scope, coverage, security, recovery, visual acceptance, or production-write authority. See [verification contracts](ship/references/verification.md).

Repo-local Codex skills live here. They are the project source of truth for recurring Excelsior workflows; do not maintain a separate Cursor/global mirror.

AWS phases use **AWS Core** by default under [AWS operations](../../docs/current/AWS_OPERATIONS.md). The connector handles live AWS evidence; persistent local SSM tunnels and existing runner/local scripts retain their documented credential paths. Check current authentication and Excelsior ownership each task.

| Skill | Trigger phrases | Status | Source |
|-------|-----------------|--------|--------|
| `start-excelsior` | `/start`, "Start Excelsior", "start dev servers" | Active | Merged from `.cursor/skills/start` plus existing Codex helper |
| [`test-local-browser`](test-local-browser/SKILL.md) | local browser checks, before/after UI verification, spot-check handoff | Active | M1 CUA workflow; shared scenarios and evidence under `tests/` and `docs/` |
| [`verify-production-browser`](verify-production-browser/SKILL.md) | post-release browser smoke, verify deployed UI | Active read-only workflow | Exact-SHA health contract and selected M1 production-safe cases |
| `ship` | "ship", "ship it" | Active | Migrated from `.cursor/skills/ship` |
| `add-card` | "add card", `/add-card`, image path under `src/resources/cards/images/` | Active | Migrated from `.cursor/skills/add-card` |
| `api-layer-migration` | route migration, `/api/v1`, thinning `src/routes` | Active | Migrated from `.cursor/skills/api-layer-migration` |
| `start-aws-db-tunnel` | SSM DB tunnel, production RDS, TablePlus/psql to prod | Active guarded runbook | Migrated from `.cursor/skills/start-aws-db-tunnel` |
| `reset-production-user-password` | reset a named production user password | Active guarded workflow | Validates password-auth account, reuses/starts SSM tunnel, and verifies a single guarded reset |
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
