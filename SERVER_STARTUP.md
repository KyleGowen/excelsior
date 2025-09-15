# Server Startup Guide

This guide explains how to start the OverPower Deck Builder server with automatic database migrations and data population.

## Quick Start

### Option 1: Full Automated Startup (Recommended)
```bash
npm run start:full
```

This script will:
- Check if Docker is running
- Start PostgreSQL database if needed
- Wait for database to be ready
- Build the TypeScript project
- Start the server with automatic Flyway migrations

### Option 2: Manual Startup
```bash
# 1. Start the database
cd docker && docker-compose up -d

# 2. Build the project
npm run build

# 3. Start the server (migrations run automatically)
npm start
```

## What Happens During Startup

### 1. Database Initialization
The server automatically runs Flyway migrations and data population:

```typescript
// Database initialization sequence
1. Run Flyway migrations (V1-V19)
2. Populate database with card data from markdown files
3. Initialize in-memory repositories
4. Start Express server
```

### 2. Migration Process
- **Schema Migrations**: Creates all database tables and indexes
- **Data Population**: Loads card data from `src/resources/cards/descriptions/`
- **Validation**: Ensures database is in correct state

### 3. Server Health Checks
- **Health Endpoint**: `GET /health` - Basic server status
- **Database Status**: `GET /api/database/status` - Database migration status

## Environment Configuration

The server uses environment variables from `.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=1337
DB_NAME=overpower
DB_USER=postgres
DB_PASSWORD=password

# Connection String
DATABASE_URL=postgresql://postgres:password@localhost:1337/overpower
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
cd docker && docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose down && docker-compose up -d
```

### Migration Issues
```bash
# Check migration status
npm run migrate:info

# Validate migrations
npm run migrate:validate

# Repair migration history
npm run migrate:repair
```

### Server Issues
```bash
# Check server logs
npm start

# Test health endpoint
curl http://localhost:3000/health

# Test database status
curl http://localhost:3000/api/database/status
```

## Development Workflow

### First Time Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm run start:full`

### Daily Development
1. Start the server: `npm start` (migrations run automatically)
2. Make changes to code
3. Restart server as needed

### Adding New Migrations
1. Create new migration file in `migrations/`
2. Run migration: `npm run migrate`
3. Update data if needed: `npm run migrate:data`

## Production Deployment

### Prerequisites
- PostgreSQL database running
- Node.js and npm installed
- Environment variables configured

### Deployment Steps
1. Set production environment variables
2. Build the project: `npm run build`
3. Start the server: `npm start`

The server will automatically:
- Run any pending migrations
- Populate data if needed
- Start the web server

## Monitoring

### Health Checks
- **Basic Health**: `GET /health`
- **Database Status**: `GET /api/database/status`

### Logs
The server provides detailed logging for:
- Migration progress
- Database initialization
- Error handling
- Server startup

### Database Status
The database status endpoint returns:
```json
{
  "status": "OK",
  "database": {
    "valid": true,
    "upToDate": true,
    "migrations": "Flyway managed"
  }
}
```

## Best Practices

1. **Always use the automated startup** for development
2. **Check database status** before deploying
3. **Monitor logs** during startup
4. **Test health endpoints** after deployment
5. **Keep migrations small** and focused
6. **Backup database** before major changes

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify database connectivity
4. Check migration status
5. Contact the development team
