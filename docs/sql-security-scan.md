## Runtime SQL security scan (injection-focused)

Scope: **runtime application code** that executes SQL via `pg` (Express routes → services → repositories).

### SQL execution entry points (runtime)

- **Pool initialization**
  - `src/config/DataSourceConfig.ts` (creates `pg.Pool`)
- **Repositories (primary SQL surface)**
  - `src/database/PostgreSQLUserRepository.ts`
  - `src/database/PostgreSQLDeckRepository.ts`
  - `src/database/PostgreSQLCardRepository.ts`
  - `src/database/collectionsRepository.ts`
- **Server-level queries**
  - `src/index.ts` (health-check DB queries; static SQL)

### Findings (initial)

#### 1) At-risk: dynamic SQL identifier interpolation (table name)

- **Location**: `src/database/collectionsRepository.ts` (`CollectionsRepository.verifyCardExists`)
- **Shape**: ``SELECT 1 FROM ${tableName} WHERE id = $1``
- **Why this is at-risk**:
  - identifiers (table/column) **cannot be parameterized** with `$1` placeholders; interpolation creates a fragile footgun.
  - current behavior relies on a `switch` whitelist, but the API accepts arbitrary `cardType` values and the pattern is easy to accidentally widen in future refactors.
- **Plan to fix**:
  - enforce strict `cardType` whitelist validation at the API boundary (return `400` for invalid/unknown values)
  - remove identifier interpolation in the repository by switching to per-type static query strings
  - add an integration test that sends injection-shaped `cardType` inputs and asserts `400` (and that normal usage still works)

### Semgrep scan + triage (runtime SQL injection patterns)

- **Semgrep rules**: `.semgrep.yml` (focuses on interpolation/concatenation inside `pg` `.query(...)` calls).
- **Triage outcome**:
  - **Remaining blocking finding**: `src/database/collectionsRepository.ts` (dynamic `FROM ${tableName}`) → **to be fixed**.
  - **Reviewed safe/expected patterns** (suppressed with inline `nosemgrep` + rationale):
    - `src/database/PostgreSQLDeckRepository.ts` and `src/database/PostgreSQLUserRepository.ts` dynamic `SET ${setClause.join(', ')}` updates.
      - These are **not user-controlled identifiers**: the `setClause` entries are constructed from a fixed set of hardcoded column assignments in the repository code, while values remain parameterized.

### Notes

- Most repository queries already use `pg` parameter placeholders (`$1`, `$2`, …) with a values array, which is the preferred approach for user-controlled data.

