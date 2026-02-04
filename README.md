## Excelsior

Excelsior is an **Overpower card game database + deck building tool** that was **100% vibe coded by me**.

### Website / accounts

- **Live site**: `https://excelsior.cards`
- **Questions or want an account?** Contact me (repo owner) and I’ll get you set up.

### Install dependencies

You’ll need:

- **Node.js + npm**
- **Docker** (recommended for local Postgres via `docker/docker-compose.yml`)

From the repo root:

```bash
npm install
```

### Run the server

#### Option A (recommended): start everything (Postgres + build + server)

```bash
npm run start:full
```

#### Option B: dev mode (assumes database is already available)

```bash
# start postgres (if you use docker)
cd docker && docker-compose up -d
cd ..

# run the server
npm run dev
```

By default the server listens on `http://localhost:8085` (override with `PORT`).

### Run tests (unit + integration)

```bash
# unit tests
npm run test:unit

# integration tests (requires a database)
npm run test:integration
```

### Verify the server is running

Use the **health check endpoint**:

```bash
curl -s http://localhost:8085/health | jq -r '
"Server Health Check
┌─────────────────────────────────────────────────────────────┐
│ Status: " + (if .status == "OK" then "OK" else "ERROR" end) + " │
│ Uptime: " + (.uptime | floor | . / 3600 | floor | tostring) + "h " + ((.uptime | floor) % 3600 / 60 | floor | tostring) + "m " + ((.uptime | floor) % 60 | tostring) + "s │
│ Database: " + (if .database.status == "OK" then "Connected" else "Error" end) + " (" + (.database.latency // "N/A") + ") │
│ Response Time: " + .latency + " │
│ Environment: " + .environment + " │
├─────────────────────────────────────────────────────────────┤
│ Latest Git Commit: │
│ " + .git.shortCommit + " - " + .git.commitMessage + " │
├─────────────────────────────────────────────────────────────┤
│ Latest Migration: │
│ V" + .database.migrations.latest.version + " - " + .database.migrations.latest.description + " │
└─────────────────────────────────────────────────────────────┘"'
```

### Docs

- **Current**: `docs/current/`
- **History**: `docs/history/`
- **Product/UI**: `docs/`

