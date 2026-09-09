# Production Deployment — Excelsior Deckbuilder

**This is the single combined reference for CI/CD pipeline strategy AND the operational runbook.** `DEPLOYMENT_STRATEGY.md` has been merged here; it is now a pointer to this file.

**Table of contents:**
- [CI/CD Pipeline Overview](#cicd-pipeline-overview) — GitHub Actions, Docker, blue-green deploy, SSM timing
- [Quick Deployment](#quick-deployment) — script or manual deploy commands
- [Infrastructure Overview](#infrastructure-overview) — EC2, RDS, ECR, domain
- [Production Database Access (SSM Tunnel)](#production-database-access-ssm-port-forwarding) — laptop access runbook
- [Environment Variables & Secrets](#environment-variables) — JWT, Firebase, SSM params
- [Troubleshooting](#troubleshooting)

---

## CI/CD Pipeline Overview

```
GitHub (main branch push)
    → GitHub Actions: build → unit tests → integration tests → docker build → migrations → deploy → verify
    → Docker image (linux/amd64, no-cache) pushed to ECR with :$GITHUB_SHA + :latest
    → Blue-green deploy via SSM AWS-RunShellScript on EC2
    → nginx upstream switch after health gate passes
    → External /health poll confirms .git.commit matches $GITHUB_SHA
```

**Key CI invariants:**
- Deployment uses `:$GITHUB_SHA` tag only (never `:latest`) — correctness tied to SHA
- `CMD_ID` must be non-empty after `send-command`; empty = deploy never sent → fail immediately
- `DEPLOY_DONE` loop exits only on `"Success"`; loop exhaustion → fail (never fall-through as success)

**SSM timing budget** (Blue-Green Deploy step, `--timeout-seconds 1200`):
- ECR pull: up to 8 min (`timeout 480`); container startup + health gate: ~5 min; nginx switch: ~15 s
- GitHub Actions polls 240 × 5 s = 1200 s max

**Production migrations** (`run-migrations` job): EC2 loads all runtime values from SSM, pulls the exact-SHA Docker image once, and runs one authoritative Flyway `migrate`. Flyway validates before applying changes; a lightweight `psql` query then proves the exact expected schema version. The job runs in parallel with the S3 asset sync, and deploy waits for both.

**Docker image build:**
- Multi-stage: `node:20-alpine` build stage → slim runtime stage with Flyway + `dumb-init`
- Card images excluded via `.dockerignore`; UI images (`src/resources/images/`) are included as local dev fallback
- `sync-images` CI job runs `npm run generate:thumbnails` then `aws s3 sync` to push card art + UI images to S3

**Blue-green deployment:**
```bash
docker pull $ECR_URI:$GITHUB_SHA
docker run -d --name overpower-app-new --restart unless-stopped \
  -p $NEW_PORT:3000 --env-file /opt/app/.env -e SKIP_MIGRATIONS=true $ECR_URI:$GITHUB_SHA
# health gate (liveness up to 40×3s, then readiness 3 consecutive OK up to 40×5s on localhost:$NEW_PORT)
sed -i "s/localhost:$CURRENT_PORT/localhost:$NEW_PORT/g" /etc/nginx/conf.d/excelsior.cards.conf
nginx -t && nginx -s reload
```

**Verify deployment failure (`Deployment verification failed — old commit SHA`):**
Check whether SSM actually ran a new command — look for empty `CMD_ID` or exhausted poll loop in deploy workflow output. Diagnose:
```bash
aws ssm list-command-invocations --instance-id i-04493611b99785f28 --region us-west-2 \
  --max-results 5 --query 'CommandInvocations[*].{CommandId:CommandId,Status:Status,RequestedDateTime:RequestedDateTime}' --output table
```

---

## Prerequisites

1. **Docker** - For building the application image
2. **AWS CLI** - Configured with appropriate credentials
3. **Terraform** - For infrastructure management (if needed)
4. **Access to AWS Account** - With permissions for ECR, EC2, RDS, and SSM

## Quick Deployment

### Option 1: Automated Deployment Script (Recommended)

```bash
# From the project root directory
./scripts/deploy-to-production.sh
```

This script will:

- Build the Docker image for AMD64 architecture
- Push the image to ECR
- Deploy the container to EC2 with correct environment variables
- Verify the deployment

### Option 2: Manual Deployment

```bash
# 1. Build and push the image
docker build --platform linux/amd64 --no-cache -t overpower-deckbuilder .
docker tag overpower-deckbuilder:latest 474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder:latest
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 474120878015.dkr.ecr.us-west-2.amazonaws.com
docker push 474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder:latest

# 2. Deploy to EC2
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name "AWS-RunShellScript" --parameters 'commands=[...]'
```

## Infrastructure Overview

### AWS Resources

- **EC2 Instance**: `i-0dee560af076c0f9d` (t2.micro)
- **RDS PostgreSQL**: `op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432`
- **ECR Repository**: `474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder`
- **Domain**: `excelsior.cards` (via Route53)

### Database Configuration

- **Host**: `op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `overpower`
- **Username**: `postgres`
- **Password**: SecureString `/op-deckbuilder/dev/database/password` (value never committed)
- **SSL**: Required (`sslmode=require`)

### Connecting from your laptop (TablePlus, DBeaver, local `psql`)

**You cannot rely on the RDS hostname in TablePlus or `psql` from your Mac** unless your IP is on the RDS admin allowlist (unusual). Production RDS is locked down: only the **app EC2 security group** reaches port **5432** on the database ([OPS_RDS_SECURITY_GROUP.md](OPS_RDS_SECURITY_GROUP.md)).

**Every time** you use a GUI or CLI on your machine:

1. **Start the SSM tunnel first** and leave that terminal open (see [Production database access (SSM port forwarding)](#production-database-access-ssm-port-forwarding) below). Use [scripts/ssm-prod-db-tunnel.sh](../../scripts/ssm-prod-db-tunnel.sh) or the raw `aws ssm start-session` command there.
2. Point the client at `**127.0.0.1`** and the **local** port (default `**15432`**), **not** `op-deckbuilder-postgres....amazonaws.com`.

**Symptom you forgot the tunnel:** timeout or “could not connect” to the RDS hostname from your laptop; or TablePlus to `127.0.0.1` fails while the tunnel terminal is not running.

The **host/port bullets above** are for the **application on EC2** (and for docs like `DATABASE_URL`). They are **not** the connection target for TablePlus on your desk unless you have completed the tunnel steps.

## Production database access (SSM port forwarding)

Connect from your laptop **without** opening RDS to the public internet: traffic goes **laptop → AWS Systems Manager Session Manager → EC2 (app security group) → RDS**. RDS security group rules are described in [OPS_RDS_SECURITY_GROUP.md](OPS_RDS_SECURITY_GROUP.md).

**Checklist (keep the tunnel terminal visible while you work):**


| Step | Action                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | `aws` CLI works; Session Manager plugin installed.                                                                         |
| 2    | IAM allows `ssm:StartSession` for your app EC2 instance + `AWS-StartPortForwardingSessionToRemoteHost` (see **G2** below). |
| 3    | **Start tunnel** — `./scripts/ssm-prod-db-tunnel.sh i-...` (or equivalent). Leave it running.                              |
| 4    | **Only then** open TablePlus / `psql` to `127.0.0.1` and the tunnel port (`15432` by default).                             |


**Confirm before you change AWS access:** attaching the IAM policy below changes **your** permissions (not Terraform). **Do not** run `terraform apply` for this flow unless you deliberately change infrastructure (e.g. security groups).

### G1 — Committed samples (no AWS change)

- **IAM policy (placeholders only):** [docs/examples/ssm-prod-db-tunnel-policy.json.sample](../../docs/examples/ssm-prod-db-tunnel-policy.json.sample) — copy it, replace `REPLACE_AWS_ACCOUNT_ID` and `REPLACE_EC2_INSTANCE_ID`, then attach as **G2**. For `aws iam put-user-policy`, point `--policy-document` at your filled copy. A filled file at repo root named `ssm-prod-db-tunnel-policy.json` is **gitignored** so you can keep it next to the repo for convenience.
- **Tunnel script:** [scripts/ssm-prod-db-tunnel.sh](../../scripts/ssm-prod-db-tunnel.sh) — executable helper; same as the `aws ssm start-session` block under **Start tunnel** below.

### Prerequisites on your machine

1. **AWS CLI v2** and **Session Manager plugin** — [Install Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html).
  On macOS, Homebrew can install both. If `aws --version` fails with `**pyexpat` / `libexpat` / `_XML_SetAllocTrackerActivationThreshold`**, use the **official AWS CLI v2 macOS installer** from AWS instead of Homebrew’s `awscli` (bundled runtime avoids Python library conflicts on Apple Silicon / Python 3.14).
2. **Credentials:** `aws configure` or `aws configure sso`, then verify:
  ```bash
   aws sts get-caller-identity
  ```
   Add `--profile YOUR_PROFILE` to every `aws` command below if you use a non-default profile.

### G2 — IAM permission (you must confirm, then attach in AWS)

If `aws ssm start-session` returns `AccessDeniedException`, attach an inline policy to your IAM user or role. Copy [docs/examples/ssm-prod-db-tunnel-policy.json.sample](../../docs/examples/ssm-prod-db-tunnel-policy.json.sample), substitute real values, and save a **filled** copy outside git (e.g. `~/ssm-prod-db-tunnel-policy.json` or repo root `ssm-prod-db-tunnel-policy.json`, which is **gitignored**). Attach via IAM Console **or** (from the directory that contains the file):

```bash
aws iam put-user-policy \
  --user-name YOUR_IAM_USER \
  --policy-name SSMProdDbPortForward \
  --policy-document file://ssm-prod-db-tunnel-policy.json
```

(For an IAM role, use `put-role-policy` with `--role-name` instead.)

### Resolve EC2 instance ID (source of truth)

The instance id in this doc may be stale. List the running app instance by tag (`Name` is `op-deckbuilder-app` per Terraform):

```bash
aws ec2 describe-instances --region us-west-2 \
  --filters "Name=tag:Name,Values=op-deckbuilder-app" "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

Confirm SSM sees it as **Online**:

```bash
aws ssm describe-instance-information --region us-west-2 \
  --filters "Key=InstanceIds,Values=i-YOUR_INSTANCE_ID"
```

### SSM parameter names

Terraform stores parameters under `/var.project_name/var.environment/...` ([infra/ssm.tf](../../infra/ssm.tf)). Defaults are `op-deckbuilder` and `**dev**` — the same prefix appears elsewhere in this doc (e.g. JWT). If your deployed environment name differs, substitute it in every path below (e.g. `/op-deckbuilder/dev/database/host`).

**Host and port:**

```bash
aws ssm get-parameter --region us-west-2 \
  --name /op-deckbuilder/dev/database/host \
  --query Parameter.Value --output text

aws ssm get-parameter --region us-west-2 \
  --name /op-deckbuilder/dev/database/port \
  --query Parameter.Value --output text
```

**Password (do not commit or paste into tickets):**

```bash
aws ssm get-parameter --region us-west-2 \
  --name /op-deckbuilder/dev/database/password \
  --with-decryption \
  --query Parameter.Value --output text
```

### Start tunnel (terminal A)

Use the committed helper (must be executable: `chmod +x scripts/ssm-prod-db-tunnel.sh` once):

```bash
./scripts/ssm-prod-db-tunnel.sh i-YOUR_INSTANCE_ID
```

Or with environment overrides:

```bash
LOCAL_PORT=15432 ./scripts/ssm-prod-db-tunnel.sh i-YOUR_INSTANCE_ID
```

**Raw AWS CLI** (always works if `aws` and the plugin are installed):

```bash
aws ssm start-session --region us-west-2 \
  --target "i-YOUR_INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}'
```

Replace `host` with the value from SSM if it differs. Leave this session running.

### Connect (terminal B)

```bash
psql -h 127.0.0.1 -p 15432 -U postgres -d overpower 'sslmode=require'
```

**Stop the tunnel:** Ctrl+C in terminal A.

### TablePlus, DBeaver, and other GUI clients

Use these settings **only while the SSM tunnel is running** (terminal A). If the tunnel stops, the DB connection will drop or fail to connect.


| Setting  | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Host     | `127.0.0.1` (not the RDS hostname)                            |
| Port     | `15432` (or whatever `LOCAL_PORT` you passed to the script)   |
| Database | `overpower`                                                   |
| User     | `postgres`                                                    |
| Password | From SSM: `/op-deckbuilder/dev/database/password` (see above) |
| SSL      | Try **Require**; if errors, try **Prefer** once               |


**URL form (TablePlus “import URL”):** `postgresql://postgres:YOUR_PASSWORD@127.0.0.1:15432/overpower?sslmode=require` — URL-encode special characters in the password if needed.

Save the connection as something like **“Overpower prod (via SSM tunnel)”** so it is obvious it is not a direct RDS host connection.

### Troubleshooting

```bash
aws ssm describe-instance-information --region us-west-2 \
  --filters "Key=InstanceIds,Values=i-YOUR_INSTANCE_ID"
```

If PostgreSQL TLS errors through the tunnel, try once with `sslmode=prefer` to diagnose.

**TablePlus / client cannot connect to `127.0.0.1`:** Is `./scripts/ssm-prod-db-tunnel.sh` (or `start-session`) still running in another terminal? Restart the tunnel, then reconnect.

**Timeout to `op-deckbuilder-postgres...amazonaws.com` from laptop:** Expected without a tunnel or admin SG allowlist — use `**127.0.0.1` + tunnel** instead.

## Environment Variables

The application requires the following environment variables:

```bash
DATABASE_URL=<constructed from SSM database fields with sslmode=require>
DB_HOST=op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=overpower
DB_USER=postgres
DB_PASSWORD=<loaded from /op-deckbuilder/dev/database/password>
DB_USERNAME=postgres
NODE_ENV=production
PORT=3000
NODE_TLS_REJECT_UNAUTHORIZED=0
FLYWAY_URL=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require
FLYWAY_USER=postgres
FLYWAY_PASSWORD=<loaded from /op-deckbuilder/dev/database/password>
```

### Firebase Configuration (Google Sign-In)

The deploy script and EC2 user_data automatically fetch Firebase config from SSM when building the environment file. To enable Google Sign-In:

1. **Terraform variables**: Set `firebase_api_key`, `firebase_auth_domain`, `firebase_project_id`, and `firebase_app_id` in `terraform.tfvars` (copy from `infra/terraform.tfvars.example`). Get values from Firebase Console → Project settings → Your apps → Config.
2. **Service account**: Place the Firebase Admin SDK service account JSON at `infra/firebase-service-account.json` (gitignored). Run `terraform apply` with: `-var "firebase_service_account_json=$(cat infra/firebase-service-account.json)"`
3. **SSM parameters**: After `terraform apply`, Firebase params are stored at `/op-deckbuilder/dev/firebase/*`. The deploy script fetches them when building `/opt/app/.env`. If params are missing, deploy still succeeds (Google Sign-In is simply disabled).
4. **Firebase Console**: Add `excelsior.cards` to Authorized domains (Authentication → Settings → Authorized domains).

**Firebase environment variables** (appended by deploy script when SSM params exist):

- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` — client config for the frontend
- `FIREBASE_SERVICE_ACCOUNT_JSON` — server-only, full JSON string for token verification

### API v1 / JWT (`JWT_SECRET`)

The app registers `**/api/v1`** at startup and resolves JWT config immediately. When `**NODE_ENV=production`**, a missing `**JWT_SECRET`** causes the Node process to exit before it listens (Docker health checks fail).

**Source of truth in AWS:** create and maintain a **SecureString** parameter (not managed by Terraform today):


| Item       | Value                                |
| ---------- | ------------------------------------ |
| **Name**   | `/op-deckbuilder/dev/app/jwt_secret` |
| **Region** | `us-west-2`                          |
| **Type**   | `SecureString`                       |


**How it reaches the container:** the **Run Production Migrations** job in
[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) sends
[`.github/scripts/prepare-production.sh`](../../.github/scripts/prepare-production.sh)
to EC2 through SSM. The helper reads JWT, database, CDN, and optional Firebase
parameters on the instance, atomically replaces `/opt/app/.env` with mode 0600,
then pulls the exact image and runs Flyway once. Secret values are never printed.
The blue-green deploy starts the new container with `--env-file /opt/app/.env`.

**Create or rotate** (from a machine with IAM permission to write the parameter; use a long random value):

```bash
aws ssm put-parameter \
  --name /op-deckbuilder/dev/app/jwt_secret \
  --value "$(openssl rand -base64 64)" \
  --type SecureString \
  --overwrite \
  --region us-west-2
```

Rotating the value **invalidates all existing v1 Bearer tokens** until clients log in again.

**Sanity checks:**

```bash
# Non-empty secret (does not print the value)
aws ssm get-parameter \
  --name /op-deckbuilder/dev/app/jwt_secret \
  --with-decryption \
  --region us-west-2 \
  --query 'length(Parameter.Value)' \
  --output text
```

After deploy: `**curl -sS https://<host>/health**` should report `**status: OK**` if the app passed JWT initialization.

### Infrastructure revival — SSM and deploy prerequisites

If you rebuild or revive AWS resources (new account, wiped Parameter Store, greenfield region), ensure the following exist **before** expecting production deploy or the manual script to succeed. Defaults use `**op-deckbuilder`** and `**dev`** as in Terraform (`var.project_name`, `var.environment`).

**Managed by Terraform** (recreated by `terraform apply` under `infra/`):

- `/op-deckbuilder/dev/database/*` — host, port, name, username, password, url  
- `/op-deckbuilder/dev/app/environment`, `/op-deckbuilder/dev/app/port`  
- `/op-deckbuilder/dev/app/cdn_base_url` — set from CloudFront output  
- `/op-deckbuilder/dev/firebase/*` — when Firebase variables are supplied at apply

**Must be created manually** (not defined in `infra/ssm.tf` today):

- `**/op-deckbuilder/dev/app/jwt_secret`** — **SecureString**, required for `**NODE_ENV=production`** and `**/api/v1`** (see previous subsection).

**GitHub Actions** does not contain database credentials. The production helper
builds `/opt/app/.env` entirely from these SSM parameters and refuses to continue
when a required value is missing.

After SSM and Terraform are aligned, push to `**main`** (or run `**./scripts/deploy-to-production.sh`**) and confirm `**/health`**.

### Terraform plan files (security)

Never commit Terraform plan files; they can contain sensitive variable values (e.g. Firebase service account JSON). The repo ignores `infra/tfplan`, `*.tfplan`, and `plan.tfplan`. The domain deploy script (`infra/deploy-domain.sh`) uses `terraform plan -out=plan.tfplan` so the output filename is ignored by `.gitignore`. If you run `terraform plan` manually, use `-out=plan.tfplan` or another `*.tfplan` name and do not commit the file.

## Deployment Process

### 1. Build Phase

- Builds Docker image for AMD64 architecture (EC2 compatibility)
- Installs dependencies and builds TypeScript
- Copies application files and resources

### 2. Test Phase

- Runs unit tests to verify code quality
- Executes 9 parallel integration test categories:
  - Security, Authentication, Search & Filtering
  - Deck Core, Deck Security, Game Logic
  - UI/UX, User Management, Remaining tests
- Each test category runs independently with its own database

### 3. Migration Phase

- Runs production database migrations via SSM
- Uses simplified command execution for reliability
- Handles "no new migrations" scenarios gracefully
- Verifies database schema and connectivity

### 4. Push Phase

- Tags image for ECR repository
- Authenticates with ECR
- Pushes image to AWS ECR

### 5. Deploy Phase

- Creates environment file on EC2 instance
- Pulls latest image from ECR
- Stops and removes existing container
- Starts new container with environment variables

### 6. Verification Phase

- Checks container status
- Displays application logs
- Verifies server is running
- Performs health check validation

## Application Features

### Database Migrations

- Automatically runs Flyway migrations on startup
- Creates database schema and populates initial data
- Loads 43 characters and 8 locations from resources
- **Performance optimizations**: Includes V141 migration with database indexes for faster deck loading
- **Deployment process**: Uses simplified SSM command execution for reliability
- **Error handling**: Gracefully handles "no new migrations" scenarios

### Server Features

- Express.js server on port 3000
- PostgreSQL database integration
- User authentication and session management
- Deck building and management
- Card database with search functionality

### Performance Features

- **Optimized deck loading**: Pre-computed metadata and database indexes for fast deck display
- **Efficient queries**: Single JOIN query instead of multiple database calls
- **Frontend optimization**: Priority loading with decks appearing immediately
- **Database caching**: Repository-level caching reduces database load
- **Expected performance**: 80-90% faster deck loading compared to previous implementation

## Monitoring and Maintenance

### Check Application Status

```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker ps","docker logs overpower-app --tail 20"]'
```

### View Application Logs

```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker logs overpower-app -f"]'
```

### Restart Application

```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker restart overpower-app"]'
```

## Application URLs

- **Production**: [http://excelsior.cards](http://excelsior.cards)
- **Direct IP**: [http://44.254.222.47:3000](http://44.254.222.47:3000)
- **API Documentation**: [http://excelsior.cards](http://excelsior.cards) (same as main app)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
  - **From your laptop / TablePlus:** Confirm the **SSM tunnel is running** and the client uses `**127.0.0.1`** and the **tunnel port** — not the RDS hostname ([section above](#connecting-from-your-laptop-tableplus-dbeaver-local-psql)).
  - **From the app on EC2:** Check if RDS instance is running; security groups allow the app EC2 to connect to RDS; credentials in SSM / `.env` match RDS.
2. **SSL Certificate Issues**
  - Ensure `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
  - Use `sslmode=require` for database connections
3. **Container Restart Loop**
  - Check application logs for errors
  - Verify all environment variables are set correctly
  - Ensure database is accessible
4. **Image Pull Failed**
  - Verify ECR authentication
  - Check if image exists in repository
  - Ensure correct image tag is used

### Debug Commands

```bash
# Check container status
docker ps -a

# View detailed logs
docker logs overpower-app --tail 50

# Check required environment keys without exposing values
for key in DATABASE_URL CDN_BASE_URL JWT_SECRET; do grep -q "^${key}=" /opt/app/.env || echo "missing ${key}"; done

# Test database connection
psql -h op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com -U postgres -d overpower
```

## Security Considerations

- Database password is stored in AWS SSM Parameter Store
- SSL is required for database connections
- Application runs in Docker container for isolation
- Environment variables are not logged in plain text

## Cost Optimization

- Uses t2.micro EC2 instance (free tier eligible)
- Uses db.t3.micro RDS instance (free tier eligible)
- ECR storage is minimal for single application
- No load balancer (direct EC2 access)

## Backup and Recovery

- Database backups are handled by RDS (7-day retention)
- Application code is version controlled in Git
- Docker images are stored in ECR
- Infrastructure is managed by Terraform

## Updates and Maintenance

### Code Updates

1. Make changes to code
2. Run `./scripts/deploy-to-production.sh`
3. Verify deployment success

### Database Updates

1. Create new migration files
2. Deploy application (migrations run automatically)
3. Verify migration success in logs

### Infrastructure Updates

1. Modify Terraform files in `infra/` directory
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review application logs
3. Verify AWS resource status
4. Check Terraform state for infrastructure issues

## Notes

- The application automatically creates an initial user "kyle" on first startup
- Database migrations run automatically on each deployment
- The application loads card data from the `src/resources` directory
- All API endpoints are available at the root URL
