## Trivy Dependency Vulnerability Scanning

### What Is Trivy?

[Trivy](https://github.com/aquasecurity/trivy) is a free, open-source security scanner maintained by [Aqua Security](https://www.aquasec.com/). It performs **Software Composition Analysis (SCA)** -- scanning project dependencies for known vulnerabilities cataloged in public databases.

When you install an npm package, you inherit not just that package but its entire transitive dependency tree. Any vulnerability in any package in that tree is a vulnerability in your application. Trivy cross-references every dependency (and its version) against the following vulnerability databases:

| Database | Maintained By | Coverage |
|----------|---------------|----------|
| [National Vulnerability Database (NVD)](https://nvd.nist.gov/) | NIST (US Government) | CVEs across all ecosystems |
| [GitHub Advisory Database](https://github.com/advisories) | GitHub | npm, PyPI, RubyGems, Maven, etc. |
| [Node.js Security WG](https://github.com/nodejs/security-wg) | Node.js Foundation | Node.js-specific advisories |
| Aqua Vulnerability DB | Aqua Security | Aggregated + proprietary findings |

Each known vulnerability has a **CVE identifier** (e.g., CVE-2024-12345), a **severity rating** (Critical, High, Medium, Low), a description of the attack vector, and often a **fixed version** that patches the issue.

### Why We Have It

This project has 8 production dependencies and 17 dev dependencies. Those top-level packages pull in hundreds of transitive dependencies:

| Dependency Type | Direct Packages | Role |
|-----------------|-----------------|------|
| **Production** | `express`, `pg`, `bcrypt`, `cors`, `helmet`, `morgan`, `dotenv`, `@types/bcrypt` | Runtime server, database, security, logging |
| **Development** | `jest`, `typescript`, `supertest`, `ts-jest`, `ts-node-dev`, etc. | Testing, type checking, build tooling |

Any of those packages (or their sub-dependencies) could have a disclosed vulnerability at any time. Common real-world examples include:

- **Prototype pollution** in utility libraries (e.g., `lodash`, `qs`) allowing attackers to inject properties into JavaScript objects
- **Regular expression denial of service (ReDoS)** in validation libraries, enabling CPU exhaustion attacks
- **Path traversal** in static file serving middleware, allowing attackers to read files outside the intended directory
- **Authentication bypass** in session middleware due to parsing edge cases

Without automated scanning, these vulnerabilities go unnoticed until an attacker exploits them or a manual audit catches them. Trivy catches them on every commit.

### How It Fits in the CI Pipeline

Trivy runs as a parallel job in the GitHub Actions pipeline:

```
build
  ├── unit-tests
  ├── semgrep          ← SAST (finds vulnerabilities in OUR code)
  ├── trivy            ← SCA (finds vulnerabilities in DEPENDENCIES)
  ├── soc2-compliance  ← Control verification
  └── integration-tests-*
       │
       ▼
  build-docker (requires ALL above to pass, including trivy)
       │
       ▼
  deploy-to-ec2
```

**Trivy is a deployment gate with a zero-tolerance policy.** If it finds vulnerabilities of **any** severity level (CRITICAL, HIGH, MEDIUM, LOW, or UNKNOWN) with available fixes, the pipeline fails and the application is not deployed. We do not allow known, fixable vulnerabilities to ship regardless of how minor they appear -- low-severity issues can still be chained together or escalated in combination with other attack vectors.

### CI Job Configuration

The Trivy job is defined in `.github/workflows/deploy.yml`:

```yaml
trivy:
  name: Trivy (dependency vulnerabilities)
  runs-on: ubuntu-latest
  needs: [build]
  steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'

  - name: Install dependencies
    run: npm ci

  - name: Run Trivy vulnerability scanner
    uses: aquasecurity/trivy-action@0.28.0
    with:
      scan-type: 'fs'
      scan-ref: '.'
      severity: 'CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN'
      exit-code: '1'
      ignore-unfixed: true
      scanners: 'vuln'

  - name: Run Trivy (JSON artifact)
    if: always()
    uses: aquasecurity/trivy-action@0.28.0
    with:
      scan-type: 'fs'
      scan-ref: '.'
      severity: 'CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN'
      format: 'json'
      output: 'trivy-report.json'
      ignore-unfixed: true
      scanners: 'vuln'

  - name: Upload Trivy report
    if: always()
    uses: actions/upload-artifact@v4
    with:
      name: trivy-report
      path: trivy-report.json
```

### Configuration Options Explained

| Option | Value | What It Does |
|--------|-------|--------------|
| `scan-type: 'fs'` | Filesystem scan | Scans the checked-out repo directory rather than a container image. Trivy reads `package-lock.json` to resolve the full dependency tree. |
| `scan-ref: '.'` | Current directory | Tells Trivy to scan from the repository root. |
| `severity: 'CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN'` | Filter threshold | Report vulnerabilities of **all** severity levels. We enforce a zero-tolerance policy -- any known vulnerability with an available fix blocks deployment. |
| `exit-code: '1'` | Fail on findings | Exit with code 1 (failing the CI job) if any matching vulnerabilities are found. Set to `'0'` to make the scan informational only. |
| `ignore-unfixed: true` | Skip unfixed CVEs | Do not report vulnerabilities that have no patched version available yet. Only flag issues that can actually be resolved by upgrading. |
| `scanners: 'vuln'` | Vulnerability scanner only | Trivy can also scan for misconfigurations and secrets. We limit it to dependency vulnerabilities since Semgrep and gitleaks handle the other categories. |

### The Two-Step Pattern

The job runs Trivy twice:

1. **First run (gate):** Human-readable table output, `exit-code: '1'`. This is the step that fails the pipeline if vulnerabilities are found.
2. **Second run (artifact):** JSON output saved to `trivy-report.json`, runs `if: always()` (even if the first step failed). The JSON report is uploaded as a build artifact for detailed review and audit trail.

This pattern ensures you get both an immediate pass/fail signal and a machine-readable report for deeper analysis.

### What Trivy Scans (and Doesn't)

**What it scans:**
- `package-lock.json` -- resolves the complete transitive dependency tree and checks every package version against vulnerability databases
- Other lockfiles if present (`yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `go.sum`, etc.)

**What it does NOT scan:**
- Your application source code (that's Semgrep's job)
- Git history for secrets (that's gitleaks' job)
- Runtime behavior or network endpoints
- Container image layers (we use `scan-type: 'fs'`, not `scan-type: 'image'`)

### When Trivy Fails the Pipeline

If Trivy finds **any** vulnerability (regardless of severity) with a known fix, the pipeline fails. Here's how to resolve it:

#### Step 1: Read the Report

Download the `trivy-report` artifact from the failed GitHub Actions run, or read the human-readable output in the job logs. Each finding looks like:

```
┌───────────────────┬──────────────────┬──────────┬────────────────────┬───────────────┬──────────────────────────────────────┐
│     Library       │  Vulnerability   │ Severity │ Installed Version  │ Fixed Version │               Title                  │
├───────────────────┼──────────────────┼──────────┼────────────────────┼───────────────┼──────────────────────────────────────┤
│ example-package   │ CVE-2024-XXXXX   │ HIGH     │ 1.2.3              │ 1.2.4         │ Prototype pollution via ...           │
└───────────────────┴──────────────────┴──────────┴────────────────────┴───────────────┴──────────────────────────────────────┘
```

#### Step 2: Upgrade the Dependency

```bash
# If it's a direct dependency:
npm install example-package@latest

# If it's a transitive dependency, try:
npm audit fix

# If npm audit fix doesn't resolve it, check which direct dependency
# pulls it in and upgrade that:
npm ls example-package
npm install parent-package@latest
```

#### Step 3: If No Upgrade Is Available

If the vulnerability has a fix listed but upgrading the direct dependency doesn't resolve it (version conflict), or if you've assessed the risk and determined it doesn't apply to your usage:

1. Create a `.trivyignore` file in the project root
2. Add the CVE identifier:

```
# Prototype pollution in example-package -- not exploitable in our usage
# because we never pass untrusted input to the affected function.
# Reviewed by: [name] on [date]
CVE-2024-XXXXX
```

3. **Always include a comment** explaining why the CVE is being ignored and who reviewed it. This is critical for audit purposes.

#### Step 4: Verify

```bash
# Run npm audit locally to confirm the fix:
npm audit

# Push and verify the pipeline passes
git push
```

### Relationship to npm audit

Both `npm audit` and Trivy scan npm dependencies for vulnerabilities. The differences:

| Aspect | npm audit | Trivy |
|--------|-----------|-------|
| **Data source** | GitHub Advisory Database only | NVD + GitHub Advisory + Node.js Security WG + Aqua DB |
| **Scope** | npm packages only | Multi-ecosystem (npm, Docker, OS packages, etc.) |
| **Accuracy** | Occasionally has false positives | Cross-references multiple databases for fewer false positives |
| **CI integration** | Requires scripting to parse exit codes | Purpose-built GitHub Action with configurable severity, exit codes, and report formats |
| **Audit trail** | No built-in artifact | JSON report uploaded as build artifact |

We use Trivy in CI rather than `npm audit` because of its broader vulnerability database, better CI ergonomics, and artifact generation for audit compliance.

You can still use `npm audit` locally for a quick check during development:

```bash
# Quick local check:
npm audit

# Attempt automatic fixes:
npm audit fix
```

### Relationship to Other Security Scanners

| Tool | Category | What It Catches | Overlap with Trivy |
|------|----------|-----------------|-------------------|
| **Semgrep** | SAST | Vulnerabilities in **your code** (SQL injection, unsafe patterns) | None -- different scope entirely |
| **Trivy** | SCA | Vulnerabilities in **dependencies** (known CVEs) | -- |
| **gitleaks** | Secret Detection | Credentials committed to git | None -- different scope entirely |
| **SOC 2 script** | Control Verification | Missing security controls (auth, cookies, logging) | None -- checks architecture, not dependencies |

These tools are complementary. Semgrep ensures your code is secure. Trivy ensures the libraries your code depends on are secure. gitleaks ensures your credentials haven't leaked. The SOC 2 script ensures your security architecture hasn't regressed.

### SOC 2 Relevance

Trivy contributes to two SOC 2 Trust Service Criteria:

- **CC6.8 (Software Security):** Verifies that third-party components do not introduce known vulnerabilities into the application
- **CC9.1 (Risk Mitigation):** Demonstrates continuous monitoring of dependency risks with automated remediation guidance

### Key Links

- **Trivy GitHub:** https://github.com/aquasecurity/trivy
- **Trivy GitHub Action:** https://github.com/aquasecurity/trivy-action
- **Aqua Vulnerability DB:** https://avd.aquasec.com/
- **NVD (NIST):** https://nvd.nist.gov/
- **GitHub Advisory Database:** https://github.com/advisories
- **CI job location:** `.github/workflows/deploy.yml` → `trivy` job
- **Ignore file (if created):** `.trivyignore`
