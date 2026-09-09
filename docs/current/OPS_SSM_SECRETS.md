# OPS: SSM Parameter Store for app secrets (Phase 1)

## Status

Runtime secrets live in SSM Parameter Store. The deployment workflow sends
[`prepare-production.sh`](../../.github/scripts/prepare-production.sh) to EC2;
the script reads the parameters through the instance role and writes a
mode-`0600` `/opt/app/.env` without returning secret values to GitHub or SSM
command output.

The remaining future phase is to remove `/opt/app/.env` entirely and have the
container fetch secrets directly from SSM at boot.

## Parameter naming

Every parameter lives under `/${project_name}/${environment}/...` where
`project_name = op-deckbuilder` and `environment = dev` today.

| Parameter                                                   | Type          | Consumed by                                                                 |
|-------------------------------------------------------------|---------------|-----------------------------------------------------------------------------|
| `/op-deckbuilder/dev/database/url`                          | `SecureString`| TLS-required aggregate URL for bootstrap and compatibility paths            |
| `/op-deckbuilder/dev/database/username`                     | `SecureString`| App/Flyway database user                                                    |
| `/op-deckbuilder/dev/database/password`                     | `SecureString`| App/Flyway database password                                                |
| `/op-deckbuilder/dev/app/environment`                       | `String`      | App `NODE_ENV`                                                              |
| `/op-deckbuilder/dev/app/cdn_base_url`                      | `String`      | App `CDN_BASE_URL` → [`/js/app-config.js`](../../src/routes/auth.routes.ts) |
| `/op-deckbuilder/dev/app/jwt_secret`                        | `SecureString`| v1 JWT signing (`V1JwtTokenService`)                                         |
| `/op-deckbuilder/dev/firebase/api_key` (+ auth_domain, …)   | `String`      | Firebase client config                                                      |
| `/op-deckbuilder/dev/firebase/service_account_json`         | `SecureString`| Firebase Admin SDK bootstrap                                                |
| `/op-deckbuilder/dev/app/allowed_origins` *(new)*           | `String`      | CORS allowlist ([`API_V1_CORS.md`](API_V1_CORS.md))                         |

## How the app reads them

[`infra/ec2.tf`](../../infra/ec2.tf) grants the EC2 instance profile
`ssm:GetParameter` / `GetParameters` on `/op-deckbuilder/dev/*`.

During deploy, [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
runs the production preparation script on EC2. EC2 reads every value from SSM
and atomically replaces `/opt/app/.env`. The app reads `.env` via `dotenv/config` in
[`src/index.ts`](../../src/index.ts).

After the follow-up migration, the app will call `SSM:GetParameters` itself
at boot and skip the `.env` file entirely.

## Adding a new secret

1. Put the value in SSM:

   ```bash
   aws ssm put-parameter \
     --region us-west-2 \
     --name /op-deckbuilder/dev/app/<name> \
     --type SecureString \
     --value '<value>' \
     --overwrite
   ```

2. If the deploy workflow needs to place it in `.env`, add it to
   [`.github/scripts/prepare-production.sh`](../../.github/scripts/prepare-production.sh)
   and keep the value out of command output.
3. If the app reads it directly via `SSM:GetParameter`, no workflow change
   is needed — but verify the IAM policy in `infra/ec2.tf` covers the new
   key (it does because the policy grants `*` under the project prefix).

## Rollback

- **Bad parameter value:** `aws ssm put-parameter --overwrite` with the
  previous value, then redeploy so Docker recreates the container with the
  restored environment.
- **Deploy step broken:** the feature flag for each secret is the env var
  that consumes it. E.g. if the new `ALLOWED_ORIGINS` param is malformed,
  temporarily `DISABLE_CORS=1` until the param is fixed.
- **Environment preparation breaks deploy:** fix or revert the preparation
  script. Never restore a plaintext credential from Git history; restore the
  previous SSM SecureString version instead.

## Validation

- Manual smoke (admin-scoped):

  ```bash
  aws ssm describe-parameters --parameter-filters "Key=Path,Values=/op-deckbuilder/dev/" --recursive
  ```

  Expect every row from the table above.

- The preparation script fails closed when any required database, CDN, or JWT
  parameter is absent and verifies the exact Flyway schema version before deploy.

## Data safety

Environment replacement is atomic: the script writes a mode-`0600` temporary
file and renames it only after all required SSM reads succeed.

## See also

- [`infra/.cursorrules`](../../infra/.cursorrules) — file map; the SSM
  Terraform lives in `ssm.tf`.
- [`OPS_RDS_SECURITY_GROUP.md`](OPS_RDS_SECURITY_GROUP.md) — once DB
  credentials are in SSM, the only path to RDS is via the app SG.
