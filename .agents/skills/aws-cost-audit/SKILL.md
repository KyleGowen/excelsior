---
name: aws-cost-audit
description: Audit Excelsior production AWS infrastructure and usage for waste, overpayment, and safe cleanup opportunities. Use for the scheduled weekly cost review, when AWS or ECR costs rise, or when Kyle asks for AWS cost savings, infrastructure cleanup, rightsizing, retention, or a production-risk assessment of an AWS cost change.
---

# Audit Excelsior AWS Costs

Produce a conservative, evidence-backed cost audit of Excelsior's production AWS footprint. This skill is report-only. It never changes AWS, purchases a commitment, edits the repository, deploys, commits, pushes, sends a message, or modifies the cost ledger.

Read [references/excelsior-production.md](references/excelsior-production.md) before collecting data. Treat repository sources as intended architecture and live AWS as current runtime state. Neither source alone proves that a resource is safe to change.

Read [AWS operations](../../../docs/current/AWS_OPERATIONS.md). Use AWS Core for live AWS collection, verify its caller identity first, and preserve every ownership and report-only rule below.

## Fixed operating policy

- Scope only resources verified as Excelsior-owned by the ownership rules below. Do not report or investigate unrelated account resources.
- Ignore individual opportunities whose defensible steady-state savings are less than **$0.25 USD per month**. Do not combine unrelated sub-threshold changes to evade this floor.
- Use read-only AWS and repository inspection. Any implementation requires a separate user request and fresh production verification.
- Prefer no recommendation over a weak, speculative, or dangerous recommendation.
- Never trade away availability, recoverability, security, or a known rollback path merely to reduce cost.
- Never recommend deleting the image currently serving production, the current database, the active EC2/EBS path, an in-use address, an active Route 53 zone, an active CloudFront distribution, or required backups.
- Never recommend Spot for the single production web host, disabling RDS backups, weakening deletion protection, removing health checks, or reducing redundancy that currently provides the only recovery path.
- Never recommend a Reserved Instance or Savings Plan from a short observation window. Require at least 60 complete days of stable, attributable usage and an official AWS recommendation; label the commitment and break-even assumptions.
- Never use estimated savings as proof that a change is safe.

## Ownership rules

A resource is in scope only if at least one strong ownership signal applies and no contradictory signal exists:

1. Its stable identifier is listed in the production reference.
2. Its tags or name clearly identify `op-deckbuilder`, `overpower-deckbuilder`, `OverPower Deckbuilder`, or `Excelsior`.
3. It is directly attached to or used by a verified Excelsior resource.
4. It is referenced by active Excelsior Terraform, deployment, DNS, or operational code and live AWS confirms the same resource.

An untagged or unassociated account resource is not Excelsior-owned merely because it is in the same AWS account. Omit it from the report unless repository/DNS/dependency evidence establishes ownership. When ownership is ambiguous, include it only in **Coverage gaps**, without a savings estimate or cleanup recommendation.

## Collection workflow

1. Use AWS Core `run_script` to collect the evidence in **Required checks** and the production reference's **Audit coverage expectations**. Verify account `474120878015` before dependent calls, use `us-west-2` for regional resources and `us-east-1` for billing, and inspect each API-call status. Return complete in-scope data and explicit coverage failures; a connector audit need not reproduce the CLI collector's JSON shape.

   If the connector is unavailable or cannot supply required evidence, follow the shared fallback policy, verify the local caller identity, and run the deterministic CLI collector from the repository root:

   ```bash
   python3 .agents/skills/aws-cost-audit/scripts/collect_excelsior_aws_cost_audit.py > "$TMPDIR/excelsior-aws-cost-audit.json"
   ```

   Use a private temporary directory when `$TMPDIR` is unavailable. Do not write the JSON into the repository. The collector verifies AWS account `474120878015`, uses `us-west-2` for regional resources and `us-east-1` only for global billing APIs, and stops on an identity mismatch.

2. Read the complete connector results and API-call statuses, or the complete fallback JSON. A successful AWS call with an empty result is evidence of absence; a denied or failed call is a coverage gap, not evidence of absence.
3. Read the newest applicable rows in `../../../business-operations/metrics/aws-costs.csv`. Use them to corroborate service totals and trends, not to infer resource-level ownership.
4. Inspect current repository references for every deletion, release, retention, network, or deployment recommendation. At minimum check `../../../infra/`, `../../../.github/workflows/deploy.yml`, `../../../Dockerfile`, `../../../scripts/`, and the relevant file under `../../../docs/current/`.
5. Check production health with a cache-bypassed request to `https://excelsior.cards/health`. This is context only; a healthy app does not make a risky recommendation safe. Do not perform authenticated probes or send production traffic beyond one ordinary health request.
6. Compare at least the current partial month and previous complete month when available. Call out incomplete periods and ingestion staleness.

Do not rerun broad collectors merely to fill a non-material gap. Make one bounded retry only for a transient AWS error. Record persistent denial, throttling, missing metrics, or stale data under **Coverage gaps**.

## Required checks

Evaluate each applicable area, but report only findings above the savings floor:

- **ECR:** active and legacy repository ownership, lifecycle-policy coverage, tagged/untagged counts, image age, approximate non-deduplicated image bytes, current production tag protection, rollback depth, and Docker-layer cache invalidation. ECR `imageSizeInBytes` can double-count shared layers; never present its sum as billed storage.
- **EC2/EBS:** instance state/type, detailed monitoring, CPU/status/network trends, burstable-family constraints, attached and unattached owned volumes, snapshot ownership, public IPv4 use, and Compute Optimizer coverage. Do not rightsize from CPU alone; memory is unavailable unless the CloudWatch agent publishes it.
- **RDS:** instance/storage configuration, CPU, minimum freeable memory, connections, free storage, backups/snapshots, public accessibility, public IPv4 cost, and reservation recommendations. Do not recommend downsizing when freeable-memory headroom or connection capacity is uncertain.
- **VPC/network:** owned Elastic IPs and public IPv4s, NAT gateways, load balancers, and data-transfer charges. Before releasing an address, check Route 53, CloudFront origins, security groups, Terraform, deployment scripts, and documentation. Public IPv4 removal and private-RDS work are architectural changes, not simple cleanup.
- **S3/CloudFront:** storage, request classes, upload/sync behavior, lifecycle rules, CDN price class, origins, cache behavior, and invalidation/data-transfer patterns. Confirm an asset is not serving production before cleanup.
- **Route 53/ACM/SES/Lambda/CloudWatch/SSM:** duplicate or unused owned resources, log retention, stored bytes, request costs, and lifecycle settings. Preserve the email-forwarding path and certificate/DNS dependencies.
- **Drift:** mismatches between live resource names/IDs and Terraform, workflows, scripts, or docs that could make a later cleanup or recovery unsafe. Drift is a risk finding; assign savings only when a distinct billable resource can actually be removed.
- **Commitments:** official EC2/RDS recommendations, attributable utilization stability, term, payment option, break-even horizon, and lock-in risk. Default to no commitment recommendation.

## Savings methodology

For every reported dollar amount:

1. Prefer realized Cost Explorer usage charges for the exact usage type and complete period.
2. For a partial month, show the observed charge and a clearly labeled run-rate estimate. Use `observed / elapsed_billable_days * days_in_month`; never disguise the run rate as an invoice.
3. For resource deletion, savings cannot exceed the attributable observed charge for that resource or usage type.
4. For size/retention changes, state whether AWS reports logical bytes, compressed image bytes, or billed GB-month. Apply deduplication uncertainty to ECR estimates.
5. For a price-based estimate, use a current official AWS price source or Price List API and record the region, unit price, quantity, and arithmetic.
6. Use a range when utilization, shared layers, taxes, credits, Free Tier, or resource attribution prevents a precise number.
7. Exclude taxes, credits, refunds, and one-time engineering effort from recurring savings; mention material implementation effort separately.
8. Do not count the same usage twice across recommendations.

Confidence levels:

- **High:** exact owned resource plus current billed usage or directly applicable current AWS unit price.
- **Medium:** strong ownership and measured usage, but shared billing or utilization introduces a bounded assumption.
- **Low:** weak attribution, stale data, missing metrics, or multiple unverified assumptions. Do not recommend a change from low-confidence evidence.

## Production risk assessment

Every recommendation must include:

- **Risk:** `Very low`, `Low`, `Medium`, `High`, or `Do not proceed`.
- **Failure mode:** the concrete way users, deployments, rollback, data, email, or operations could be affected.
- **Prerequisites:** evidence or code changes required before implementation.
- **Validation:** pre-change baseline and post-change checks, including `/health` and exact deployed SHA when a release is involved.
- **Rollback:** a realistic recovery path. If rollback depends on an address or deleted artifact that AWS cannot restore, say so explicitly.

Risk definitions:

- **Very low:** no runtime dependency found after live and repository checks; reversible without downtime.
- **Low:** bounded operational effect and an immediate tested rollback path.
- **Medium:** could affect production access, deployments, rollback depth, or operator access; requires a maintenance window or staged implementation.
- **High:** meaningful outage/data-loss exposure, hard-to-reverse change, or insufficient recovery evidence. Do not recommend for routine savings.
- **Do not proceed:** expected savings do not justify the availability, data, security, or recovery risk.

## Report format

Lead with period, AWS identity verification, production health, total observed Excelsior-relevant service cost, and whether the period is partial. Then use exactly this table structure, ordered by safest high-confidence monthly savings first:

| Priority | Recommendation | Evidence and reason | Est. monthly savings | Confidence | Production risk | Validation and rollback |
|---|---|---|---:|---|---|---|

Rules for the table:

- One independently actionable change per row.
- State assumptions in the same row as the estimate.
- Use `$0.00` only for a risk/drift note outside the savings table; do not put sub-$0.25 changes in the table.
- Never describe a finding as “unused” when evidence only shows “unattached,” “old,” or “zero recent metrics.”
- Mark already-completed cleanups as realized/monitoring items, not new savings.

After the table, include only these compact sections:

1. **Recommended sequence** — dependency-aware ordering for changes worth considering.
2. **No-change safeguards** — expensive-looking resources that should stay because the production risk outweighs the savings.
3. **Coverage gaps** — failed/denied checks, missing metrics, stale ledger data, ambiguous ownership, and how each gap limits confidence.
4. **Audit cost** — approximate AWS API cost (normally negligible) and model setting used. Mention that the scheduled task uses `gpt-5.6-luna` with medium reasoning.

If there are no qualifying safe opportunities, say so plainly and still provide safeguards and coverage gaps. Do not create filler rows.

## Scheduled-task behavior

The scheduled run is task-only and read-only. It must not edit or commit the cost ledger; the separate `ingest-aws-cost-reports` automation owns ingestion. If the newest ledger row is stale or ingestion failed, continue with live AWS data, mark the gap, and avoid trend claims that depend on the missing report.
