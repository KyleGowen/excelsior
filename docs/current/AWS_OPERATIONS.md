# Excelsior AWS operations

Kyle selected **AWS Core** as the default connector for agent-driven Excelsior AWS work. This document controls tool routing for the AWS portions of repo-local skills and operational runbooks. Skill-specific scope, verification, and authorization requirements still apply.

## Connection and scope

Discover the AWS Core tools available in the current chat and use them without requiring Kyle to mention the connector again. Tool availability does not prove authentication or permission. At the start of each AWS task, call STS `GetCallerIdentity` through AWS Core and inspect the tool's API-call status. Require account `474120878015` before making dependent resource calls. A failed call or mismatched account is a stop for that path, not evidence that a resource is absent.

Use `us-west-2` for Excelsior regional resources and `us-east-1` for billing APIs. Specify another region only when the task or a verified resource requires it. Resolve current resource IDs from project names, tags, and dependencies, using the [production ownership reference](../../.agents/skills/aws-cost-audit/references/excelsior-production.md); account membership alone does not establish Excelsior ownership.

Keep the connector preference in repository instructions, but do not store tokens, authentication URLs, credentials, or a permanent claim that a session is connected. If the connector requests authentication, complete its connection flow and retry the read-only identity check. Local `aws login` is a separate workflow and does not repair connector authentication.

## Tool routing

| Work | Default path |
| --- | --- |
| AWS documentation and service/API questions | AWS Core documentation tools and relevant AWS Core skills. |
| Resource inventory, metrics, cost audit, Cost Explorer, and invoice discovery | AWS Core `run_script` with read-only `call_boto3` operations. |
| Deployment diagnosis and SSM command status | AWS Core for AWS evidence; GitHub tools for Actions and commit evidence; `/health` for app/database/deployed-SHA verification. |
| An explicitly authorized AWS change | AWS Core when it supports the exact operation and the applicable runbook permits it. Follow the runbook's validation and rollback requirements. |
| A laptop SSM database tunnel | AWS Core for non-secret identity/resource/SSM preflight, then local AWS CLI + Session Manager plugin for the persistent local port. |
| Existing CI, deployment, Terraform, or local helper execution | Retain the documented runner/local tool path. A connector preference does not replace CI credentials or authorize running a deployment or `terraform apply`. |

For API evidence, use the currently exposed `run_script` contract: AWS operation names in PascalCase, explicit regions, a final `result` expression, and inspection of `api_calls` before reporting success. Batch independent reads with `asyncio.gather(..., return_exceptions=True)` and inspect every result; keep identity checks and dependent calls sequential. Let the tool handle pagination, keep the complete in-scope result, and record denied/failed checks as coverage gaps. Never use a successful script wrapper as proof that every API call succeeded.

## Local execution and fallback

Connector credentials and local AWS profiles are independent. Before an AWS CLI helper or local SSM session, verify that path's own STS identity against the same expected account and use an explicit profile when needed. Never export connector credentials into local configuration or silently overwrite a profile. A connector success does not prove local credentials are usable, and a local CLI error does not prove the connector is disconnected.

Use a CLI/SDK fallback when AWS Core is unavailable in the task or cannot support a required operation or output. State the specific limitation, verify the fallback identity, and retain the same account, ownership, and approval requirements. Existing deterministic collectors may be used through that fallback; they are not the default while the connector can supply the required evidence. Do not switch accounts, broaden permissions, or retry through another path to evade an access denial or approval rejection.

Secret retrieval for an authorized database operation remains inside the guarded local process documented by the [tunnel](../../.agents/skills/start-aws-db-tunnel/SKILL.md) and [password reset](../../.agents/skills/reset-production-user-password/SKILL.md) skills. Do not return decrypted SSM SecureStrings, database passwords, or password hashes through connector/chat output. Keep invoice signed URLs and temporary billing documents private under the ingestion skill's existing rules.

Connection setup authorizes no infrastructure, permission, billing, deployment, or user-data changes. Use the existing repo-local workflow for the requested operation and obtain authorization only where that workflow and the current request require it.
