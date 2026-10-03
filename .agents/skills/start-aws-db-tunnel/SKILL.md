---
name: start-aws-db-tunnel
description: >-
  Starts the production PostgreSQL path from a laptop via AWS Systems Manager
  Session Manager port forwarding (localhost to RDS through the app EC2
  instance). Use when the user asks to start the AWS tunnel, SSM DB tunnel,
  production RDS access, connect TablePlus or psql to prod, or run
  scripts/ssm-prod-db-tunnel.sh in the background.
---

# Start AWS (SSM) DB tunnel

## When to use

The user wants a **long-lived local tunnel** so GUI or CLI clients can reach **production RDS** as `127.0.0.1:<local-port>`. Traffic path: **laptop → SSM → app EC2 → RDS** (RDS is not exposed to the public internet).

## Source of truth

- **Runbook (IAM, parameters, raw `aws ssm start-session`):** [docs/current/DEPLOYMENT.md](../../../docs/current/DEPLOYMENT.md) — section *Production database access (SSM port forwarding)*.
- **Helper script:** [scripts/ssm-prod-db-tunnel.sh](../../../scripts/ssm-prod-db-tunnel.sh) (repo root-relative paths below assume **cwd = repository root**).

Do **not** duplicate IAM policy JSON here; use the runbook and [docs/examples/ssm-prod-db-tunnel-policy.json.sample](../../../docs/examples/ssm-prod-db-tunnel-policy.json.sample).

## Prerequisites

Read [AWS operations](../../../docs/current/AWS_OPERATIONS.md). Use AWS Core for non-secret preflight: verify STS identity, resolve the running app EC2 instance, and confirm SSM is online. The persistent laptop tunnel still requires local AWS CLI v2 and the **Session Manager plugin**; AWS Core authentication does not supply local credentials or establish a laptop listener.

Per DEPLOYMENT: verify the local credentials separately with `aws sts get-caller-identity`, require Excelsior account `474120878015`, and confirm IAM allows `ssm:StartSession` for the target instance and port-forward document. Use `--profile NAME` on every `aws` command when the user relies on a non-default profile. Keep secret retrieval inside the guarded local process rather than connector output.

## Windows (PowerShell) specifics

Kyle's primary machine is **Windows + PowerShell**. The bash helper script needs Git Bash; in plain PowerShell, drive `aws` directly. All of the following were hit in practice (2026-06-10):

1. **Windows historical note:** in the old Cursor/Windows shell, every `aws.exe` invocation — even `aws --version` — hung with no output and wedged follow-up `aws` / `Get-Process aws` / `Stop-Process aws` calls. If working on that Windows setup, do not attempt to start the tunnel from the agent shell; hand the user copy-paste PowerShell commands and continue from pasted output. In Codex on macOS, use the normal approval/escalation flow before long-lived or production-affecting AWS commands.

2. **`aws` not on PATH / pager hangs.** Binary lives at `C:\Program Files\Amazon\AWSCLIV2\aws.exe`. If `aws` isn't found, prepend it and silence the pager for the session:
   ```powershell
   $env:Path = "C:\Program Files\Amazon\AWSCLIV2;" + $env:Path
   $env:AWS_PAGER = ""
   ```

3. **Session Manager plugin is separate from the CLI.** If `start-session` errors `SessionManagerPlugin is not found`, install it, then **open a new terminal**:
   ```powershell
   Invoke-WebRequest -Uri "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe" -OutFile "$env:TEMP\SessionManagerPluginSetup.exe"
   Start-Process "$env:TEMP\SessionManagerPluginSetup.exe" -ArgumentList "/quiet" -Wait
   ```
   It installs to `C:\Program Files\Amazon\SessionManagerPlugin\bin\`; reopen the terminal (or prepend that bin to PATH) so `aws` can find it.

4. **PowerShell mangles inline `--parameters` JSON** (strips the double quotes → `Invalid JSON: Expecting property name enclosed in double quotes`). Use a params **file** instead:
   ```powershell
   @'
   {"host":["op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["15432"]}
   '@ | Set-Content -Encoding ascii "$env:TEMP\ssm-params.json"

   aws ssm start-session --region us-west-2 --target i-INSTANCE_ID --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters file://$env:TEMP/ssm-params.json
   ```
   Or escape inline: `--parameters '{\"host\":[\"...\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"15432\"]}'`.

5. **Check / stop the local port (PowerShell, replaces `lsof`):**
   ```powershell
   Get-NetTCPConnection -LocalPort 15432 -State Listen -ErrorAction SilentlyContinue
   ```
   Stop the tunnel with Ctrl+C in its window (or kill the owning PID from the command above).

6. **Known app EC2 instance:** `i-04493611b99785f28` (resolved 2026-06-10). Always verify it's still the running `op-deckbuilder-app` instance before trusting it (see *Resolve EC2 instance ID*).

### TablePlus import URL (Windows)

```
postgresql://postgres:YOUR_PASSWORD@127.0.0.1:15432/overpower?sslmode=require
```

`YOUR_PASSWORD` is from SSM `/op-deckbuilder/dev/database/password` (`--with-decryption`). URL-encode special characters (`@`→`%40`, `#`→`%23`, `%`→`%25`, `/`→`%2F`). Works only while the tunnel window is running.

## Resolve EC2 instance ID

Verify a user-supplied `i-...` against the running app selector. Otherwise resolve it through AWS Core `DescribeInstances` (tag `Name=op-deckbuilder-app`, state `running`, region `us-west-2`), then confirm SSM `DescribeInstanceInformation` reports that instance online. Do not choose arbitrarily if multiple instances match. For the documented CLI fallback, use:

```bash
aws ec2 describe-instances --region us-west-2 \
  --filters "Name=tag:Name,Values=op-deckbuilder-app" "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

Optionally confirm SSM **Online** (see DEPLOYMENT for `aws ssm describe-instance-information`).

## Avoid duplicate tunnels

Default local port is **15432** (`LOCAL_PORT`). Before starting, check nothing is already listening (macOS; for Windows see the *Windows (PowerShell) specifics* section):

```bash
lsof -nP -iTCP:15432 -sTCP:LISTEN
```

If the port is in use, either reuse the existing tunnel or pick another port, e.g. `LOCAL_PORT=15433 ./scripts/ssm-prod-db-tunnel.sh i-INSTANCE_ID`.

## Start the tunnel in the background

The `start-session` process must **keep running**. Do not block the whole agent turn on a foreground session unless the user explicitly wants that.

> **Windows:** the agent shell cannot run `aws.exe` at all (it hangs). On Windows, do **not** use the patterns below — give the user the PowerShell commands from *Windows (PowerShell) specifics* to run in their own terminal.

**Preferred patterns:**

1. **Codex shell (fire-and-forget):** run from repo root with a background/non-blocking process so the tunnel continues after the command returns.
2. **`nohup` + log + PID:** e.g. log under the user home or project temp, then report PID:

```bash
nohup ./scripts/ssm-prod-db-tunnel.sh i-INSTANCE_ID >>"${HOME}/.ssm-op-deckbuilder-db-tunnel.log" 2>&1 &
echo $!
```

3. **macOS detached `screen` + keepalive:** if `nohup` exits, the session times out quickly, or prior runs showed `broken pipe`, use a named detached `screen` session and a tiny local keepalive. This keeps the SSM process attached to a real session and periodically touches the local listener:

```bash
/usr/bin/screen -dmS op-db-tunnel /bin/bash -lc 'cd /Users/kyle/cursored; ./scripts/ssm-prod-db-tunnel.sh i-INSTANCE_ID >/private/tmp/op-deckbuilder-ssm-db-tunnel.log 2>&1 & tunnel_pid=$!; trap "kill ${tunnel_pid} >/dev/null 2>&1 || true" INT TERM EXIT; while kill -0 ${tunnel_pid} >/dev/null 2>&1; do sleep 120; /usr/bin/nc -z -w 5 127.0.0.1 15432 >/dev/null 2>&1 || true; done; wait ${tunnel_pid}'
```

For the `screen` pattern, report the `screen -ls` entry and log path (`/private/tmp/op-deckbuilder-ssm-db-tunnel.log`). Stop it later with:

```bash
screen -S op-db-tunnel -X quit
```

If `./scripts/ssm-prod-db-tunnel.sh` is not executable, `chmod +x scripts/ssm-prod-db-tunnel.sh` once (per DEPLOYMENT).

**Environment overrides (see script):** `AWS_REGION` (default `us-west-2`), `LOCAL_PORT`, `RDS_PORT`, `RDS_HOST`.

## Verify

After a short wait, confirm the local port is listening, e.g.:

```bash
lsof -nP -iTCP:15432 -sTCP:LISTEN
```

(Use the actual `LOCAL_PORT` if overridden.)

If using the detached `screen` pattern, also confirm `screen -ls` shows `op-db-tunnel` and the log says `Port 15432 opened`. The log may show `Starting session` a few seconds before the local listener appears; do not call the tunnel healthy until `lsof` shows `session-manager-plugin`/`session-m` on `127.0.0.1:15432`.

For a stronger proof, run an authenticated `psql` query through the tunnel without printing the password:

```bash
PGPASSWORD="$(aws ssm get-parameter --region us-west-2 --name /op-deckbuilder/dev/database/password --with-decryption --query Parameter.Value --output text)" \
  psql "host=127.0.0.1 port=15432 dbname=overpower user=postgres sslmode=require connect_timeout=10" \
  -c 'select current_database(), current_user;'
```

`pg_isready` can return `no response` even when the tunnel is bound; prefer the authenticated `psql` check before changing AWS or TablePlus settings.

## Connect

Point the client at **`127.0.0.1`** and **`LOCAL_PORT`** (default **15432**) — **not** the RDS hostname from the laptop.

Database name, user, password, and SSM parameter paths are in DEPLOYMENT (**SSM parameter names**). Use **`sslmode=require`** for `psql` as documented there.

### TablePlus quick check

If TablePlus fails, inspect the connection fields before restarting AWS. The most common mistake is entering the RDS endpoint and RDS port directly, which bypasses the SSM tunnel:

| Field      | Correct value while tunnel is running                                      |
| ---------- | -------------------------------------------------------------------------- |
| Host       | `127.0.0.1`                                                                |
| Port       | `15432` (or the chosen `LOCAL_PORT`)                                       |
| Database   | `overpower`                                                               |
| User       | `postgres`                                                                |
| SSL mode   | `Require` / `Required`                                                     |
| Over SSH   | Off — SSM is already the forwarding layer                                  |
| Password   | Raw SSM password; URL-encode only when using an import URL                 |

Do **not** use `op-deckbuilder-postgres...amazonaws.com:5432` in TablePlus from the laptop; that is the remote target the SSM session reaches from EC2. `127.0.0.1:15432` is the laptop-side endpoint of the production tunnel, not a local Postgres database.

## Stop

If `nohup` was used, **kill the PID** that was printed. Otherwise find the listener with `lsof` and terminate that process. If the tunnel dies, the local port stops listening.
