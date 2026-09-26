---
name: ship
description: >-
  Ships approved Excelsior changes with deterministic scope checks, cached and
  parallel release gates, a low-cost Git execution agent, exact-SHA GitHub
  Actions watching, and production health verification. Use when the user says
  "ship", "ship it", or asks for the Excelsior release gate.
---

# Ship (fast validate, push, deploy, verify)

## Outcome and authority

Project rules in [`AGENTS.md`](../../../AGENTS.md) and [`.cursorrules`](../../../.cursorrules) remain authoritative.

**Ship** means: validate the intended changes, commit and push only that scope, follow the matching deployment, and verify production health for the pushed commit. The word **ship** authorizes `git add`, `git commit`, `git push`, normal deployment monitoring, and one bounded Actions recovery attempt. It does not authorize unrelated changes, repeated trigger commits, workflow rewrites, or other production mutations.

## Model and responsibility boundary

The originating/main agent owns every decision-bearing phase:

- determine intended versus unrelated changes;
- select and run gates, interpret failures, and make fixes;
- choose the exact staged path list and commit message;
- find and interpret the exact Actions run, decide whether recovery is safe,
  and verify production.

Do **not** move any of those phases to a lower-cost model.
Do not spawn additional lower-cost agents for triage, validation, fixes, Actions
recovery, health checks, or passive waiting. Mechanical Git execution is the
only exception.

After all gates pass, delegate only the mechanical Git commands to one dedicated agent created with:

- model: `gpt-5.6-luna`
- reasoning effort: `low`
- context: `fork_turns: "none"`
- task name: `ship_git`

Luna low is sufficient because the main agent supplies a complete, exact handoff and verifies the resulting commit against the frozen manifest. If that model is unavailable, use the least-cost available model adequate for this bounded Git task; do not move any other ship work to it.

## Fast path

### 1. Freeze scope once

At ship start, infer the intended paths from the approved task and run the deterministic preflight with one `--include` argument per intended path:

```bash
node .agents/skills/ship/scripts/preflight.mjs \
  --include path/one \
  --include path/two
```

Use its JSON to record:

- current branch;
- exact intended paths to include;
- every pre-existing or unrelated path to exclude;
- exact working-tree fingerprint and conditional gate triggers;
- whitespace errors, missing intended paths, and newly added debug logging.

Stop and resolve any missing intended path or whitespace error. Inspect each reported debug line and remove only genuine temporary logging. The script collects evidence; the main agent still decides scope, whether integration coverage is required, and whether reported logging is intentional.

Once required current-session instructions are loaded, do not repeatedly reread project documentation, rescan the entire repository, or ask Kyle to reconfirm Git authorization when the current request and scope are clear. Reuse validation already completed in the current task when it was run against the exact same working-tree fingerprint.

The preflight fingerprint uses `scripts/ship-tree-fingerprint.mjs`, the same implementation used by the conditional test cache. Do not recreate fingerprint logic in prompts or ad hoc commands.

### 2. Classify conditional gates

- **Unit tests:** always invoke `bash scripts/ship-conditional-test.sh unit`. Its exact-tree cache may safely skip a previously successful run.
- **Integration tests:** invoke `bash scripts/ship-conditional-test.sh integration` only when the user, `AGENTS.md`, path-specific instructions, or the risk of the change requires integration coverage. A successful exact-tree cache hit counts as pass.
- **SOC 2:** run `bash scripts/soc2-compliance-checks.sh` only when the ship scope includes `src/index.ts`, `src/routes/**`, or `src/api/http/**`.
- **Dependency audit:** run `npm audit` before the first push of the calendar day in Kyle's Pacific time and whenever `package.json` or `package-lock.json` changed. Reuse same-day evidence only when its timestamp is known and no dependency manifest changed afterward; when uncertain, run it.
- **Changed-area checks:** include any focused typecheck, build, or verification required by `AGENTS.md` or nested instructions for the files being shipped. Do not invent unrelated broad checks.

### 3. Run one parallel gate batch

Start every applicable independent read-only gate together in one direct parallel tool batch, not through additional subagents or separate tool round trips:

```text
npx eslint src --ext .ts --max-warnings 0
bash scripts/ship-conditional-test.sh unit
bash scripts/ship-conditional-test.sh integration   # only when triggered
bash scripts/soc2-compliance-checks.sh              # only when triggered
npm audit                                            # only when triggered
changed-area checks                                  # only when required
```

Collect all results once. All applicable gates must pass before Git delegation.

The unit and integration cache entries are separate atomic files under `.ship-test-cache.d/`, so parallel successful writes cannot overwrite each other. `UserPersistenceService` uses temporary persistence storage when `NODE_ENV=test`, so integration tests must not rewrite repository `data/users.json` or `data/sessions.json`. Treat either file changing as a test-isolation regression; do not normalize it as an expected cleanup step.

When the integration cache misses, the conditional runner uses the guarded two-shard command. It verifies exact, non-overlapping Jest coverage and gives each shard its own disposable PostgreSQL container, ports, Jest cache, and persistence directory. Docker is therefore required for a fresh Ship integration gate. Do not replace this with concurrent Jest processes against one database.

If a gate fails, fix the cause and rerun only checks whose inputs or coverage changed. Let the conditional test script decide whether unit or integration tests need to execute again. Do not force a full rerun merely because a command was already used earlier in the conversation.

Known fast recoveries:

- If a socket-based test fails only with sandbox `listen EPERM`, rerun that same command once with the required local-network permission before treating it as a code regression.
- If a test rewrites `data/users.json` or `data/sessions.json`, stop and diagnose the isolation regression. Restore a file only when the preflight proved it had no user change, then rerun the affected conditional test command. Never overwrite a pre-existing edit.
- If multiple gates fail independently, correct them and rerun the affected gates together.

### GitHub two-failure circuit breaker

Apply this to any command whose success depends on GitHub, Git transport, the GitHub API, or Actions—for example `git push`, `git ls-remote`, `gh run`, `gh workflow`, or `gh api`.

- Do not blindly retry. After the first transient-looking failure, inspect the error and allow at most one retry.
- If the same **logical operation** fails twice consecutively, stop before a third attempt or any alternate mutation. Switching subcommands, endpoints, agents, or from cancel to force-cancel does not reset the count.
- The originating/main agent must then read [Actions recovery](references/actions-recovery.md), query GitHub's live status and unresolved incidents, and run the appropriate read-only availability probe. This diagnosis must not be delegated to Luna.
- Reset the counter only after the logical operation succeeds. Errors accumulated by the Git agent and main agent count together.
- Deterministic errors such as invalid arguments, authentication denial, authorization denial, or branch protection are not transient: do not spend a second attempt before diagnosing or reporting them.

### 4. Delegate the serial Git handoff

The main agent prepares a self-contained prompt for `ship_git` containing:

- repository root, expected branch, and exact remote/ref to push;
- exact paths to stage, listed individually;
- exact paths that must remain untouched;
- descriptive commit message;
- confirmation that required gates passed for the current tree.

The Git agent must:

1. Run `git status --short --branch` and confirm the expected branch and path scope.
2. Stage only the supplied paths with explicit pathspecs. Never use `git add -A`, `git add .`, or a broad directory when unrelated changes exist.
3. Run `git diff --cached --check` and `git diff --cached --name-only`; stop if the staged set differs from the supplied manifest.
4. Commit with the supplied message, push only the supplied validation branch (normally `HEAD:refs/heads/codex/ship/<short-sha>`), and return the full commit SHA plus push result. Do not push `main` in this first handoff.
5. Retry a transient GitHub-facing failure at most once. After two consecutive failures of the same logical operation, stop and return both exact errors so the main agent can execute the GitHub circuit breaker.

The Git agent must not edit files, choose scope, run gates, pull, fetch, merge, rebase, reset, switch branches, create empty commits, recover Actions, or monitor deployment. Git commands remain serial. The main agent waits for this agent to finish before continuing.

Before any remote or Actions interpretation, the main agent must verify that `HEAD` and the commit's exact path set match the returned SHA and frozen manifest:

```bash
node .agents/skills/ship/scripts/verify-commit.mjs \
  --sha <full-sha> \
  --include path/one \
  --include path/two
```

Any mismatch is a hard stop. This postcondition is required when using the lower-cost Git model.

### 5. Validate before main, without a pull request

`main` requires the GitHub Actions **Security Gate** check. Kyle uses Ship rather
than PRs: push the frozen commit to a `codex/ship/<short-sha>` validation branch,
wait for the exact-SHA workflow to finish successfully, then push **that same
commit** to main. Every push runs validation; only a main push deploys.

- The originating agent performs all interpretation. Use the existing watcher
  for the candidate run; verify its SHA, branch, event, and terminal success.
- Re-read remote main immediately before promotion and prove it is an ancestor
  of the candidate (`git merge-base --is-ancestor origin/main <sha>` after fetch).
  If main advanced incompatibly, integrate safely, rerun affected gates, and
  validate the new SHA before promotion. Never force-push or bypass protection.
- After candidate success, give `ship_git` a second mechanical-only handoff:
  verify HEAD is the approved SHA, push `<sha>:refs/heads/main`, and report the
  result. No new commit, merge, or PR is needed for this promotion.
- Check `main` protection read-only when shipping; if enforcement is unavailable,
  retain this validation-first sequence and report that GitHub enforcement could
  not be confirmed. Do not silently change repository settings as part of Ship.
- When a fresh integration run is required, build `frontend/dist` before it:
  app-route tests use the actual React shell. A missing build is a setup failure.

### 6. Monitor the exact deployment

Back on the originating model:

1. Confirm the returned SHA is local `HEAD` and the remote branch points to it.
2. Look up the **main-branch** workflow once by exact SHA (the candidate run shares the SHA):
   `gh run list --branch main --commit <sha> --json databaseId,status,conclusion,url,headSha,createdAt`.
3. If the exact run already exists and is progressing, attach to it. Never create a second run merely because an older run is queued or GitHub Status still shows recovery in progress.
4. Once the exact run ID is known, start the deterministic watcher with the GitHub network permission already required for `gh`:

   ```bash
   node .agents/skills/ship/scripts/watch-actions.mjs \
     --run-id <run-id> \
     --sha <full-sha>
   ```

   Let the command yield a long-running session instead of blocking a tool call for more than 60 seconds. It polls no more often than every 60 seconds, emits only changed states, verifies `headSha` on every response, and exits on terminal success, terminal failure, or the first GitHub error. It never retries or mutates GitHub. The main agent handles any returned error under the circuit breaker and retains all status interpretation, recovery decisions, and production verification. Do not create a model-bearing subagent for this fixed wait loop.
5. After the watcher returns a terminal result, the main agent interprets the conclusion. On success, it makes a cache-bypassed request to production `/health` and confirms the exact shipped commit, database status `OK`, and expected latest migration. Do not poll production before deployment succeeds.

If the exact run is absent, has `jobs: []`, returns `startup_failure`, GitHub APIs disagree, or a GitHub-dependent operation fails twice, read [Actions recovery](references/actions-recovery.md). Do not load or execute that recovery path during a normal progressing deployment.

## Hard stops

- Never commit unless all applicable gates passed for the final tree.
- Never stage files outside the frozen manifest.
- Any edit after validation invalidates only the gates that cover that edit; rerun those before delegating Git.
- Never treat `git push` as completion. Exact-SHA Actions success and cache-bypassed production health are required.
- Do not ask for information that can be derived safely from the repository or current run.
- Do not create a trigger-only or empty commit unless Kyle explicitly requests that exact fallback after seeing the evidence.
- Never make a third attempt at a twice-failed GitHub operation until the main agent has checked live GitHub status and availability; stop entirely if either check is unhealthy.

## Reporting cadence

Use concise updates at four points: scope/gates started, actionable validation failure, pushed SHA/run URL, and final production result. During long checks, provide only the brief progress updates needed to avoid leaving Kyle without status; do not narrate every command or unchanged poll.
