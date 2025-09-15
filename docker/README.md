# Docker PostgreSQL Setup

This directory contains Docker Compose configuration for running a PostgreSQL database for the OverPower Deckbuilder application.

## Quick Start

1. **Start the database:**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **Stop the database:**
   ```bash
   cd docker
   docker-compose down
   ```

3. **View logs:**
   ```bash
   cd docker
   docker-compose logs -f postgres
   ```

## Database Configuration

- **Host:** localhost
- **Port:** 1337
- **Database:** overpower
- **Username:** postgres
- **Password:** password

## Connection String

```
postgresql://postgres:password@localhost:1337/overpower
```

## Data Persistence

The database data is persisted in a Docker volume named `postgres_data`. To completely reset the database:

```bash
cd docker
docker-compose down -v
docker-compose up -d
```

## Health Check

The PostgreSQL container includes a health check that verifies the database is ready to accept connections. You can check the status with:

```bash
docker ps
```

The container should show "healthy" status when ready.
