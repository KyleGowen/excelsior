# Database Migrations with Flyway

This directory contains database migration scripts for the OverPower Deck Builder application using Flyway.

## Overview

Flyway is a database migration tool that helps manage database schema changes and data migrations in a version-controlled manner.

## Directory Structure

```
migrations/
├── V1__Create_users_table.sql
├── V2__Create_sessions_table.sql
├── V3__Create_decks_table.sql
├── V4__Create_characters_table.sql
├── V5__Create_locations_table.sql
├── V6__Create_special_cards_table.sql
├── V7__Create_missions_table.sql
├── V8__Create_events_table.sql
├── V9__Create_aspects_table.sql
├── V10__Create_advanced_universe_cards_table.sql
├── V11__Create_teamwork_cards_table.sql
├── V12__Create_ally_universe_cards_table.sql
├── V13__Create_training_cards_table.sql
├── V14__Create_basic_universe_cards_table.sql
├── V15__Create_power_cards_table.sql
├── V16__Create_deck_cards_table.sql
├── V17__Create_triggers_and_functions.sql
├── V18__Migrate_users_data.sql
├── V19__Migrate_sessions_data.sql
└── README.md
```

## Configuration

The Flyway configuration is stored in `conf/flyway.conf`:

```properties
flyway.url=jdbc:postgresql://localhost:1337/overpower
flyway.user=postgres
flyway.password=password
flyway.schemas=public
flyway.locations=filesystem:migrations
flyway.baselineOnMigrate=true
flyway.validateOnMigrate=true
flyway.cleanDisabled=false
flyway.baselineVersion=0
flyway.baselineDescription=Initial baseline
```

## Available Commands

### Schema Migrations
- `npm run migrate` - Run all pending migrations
- `npm run migrate:info` - Show migration status and history
- `npm run migrate:validate` - Validate applied migrations
- `npm run migrate:repair` - Repair migration history table

### Data Migrations
- `npm run migrate:data` - Populate database with card data from markdown files

## Migration Naming Convention

Migrations follow the Flyway naming convention:
- `V{version}__{description}.sql` for versioned migrations
- `R{description}.sql` for repeatable migrations

## Database Schema

The migrations create the following tables:

### Core Tables
- **users** - User accounts and authentication
- **sessions** - User session management
- **decks** - User-created decks
- **deck_cards** - Junction table for cards in decks

### Card Tables
- **characters** - Character cards with stats
- **special_cards** - Special ability cards
- **power_cards** - Power cards (Energy, Combat, etc.)
- **missions** - Mission cards
- **events** - Event cards
- **aspects** - Aspect cards
- **advanced_universe_cards** - Advanced universe cards
- **teamwork_cards** - Teamwork cards
- **ally_universe_cards** - Ally universe cards
- **training_cards** - Training cards
- **basic_universe_cards** - Basic universe cards
- **locations** - Location cards

### Features
- **Alternate Images** - Support for multiple card art variants
- **One Per Deck** - Cards that can only be included once per deck
- **Special Keywords** - Cataclysm, Ambush, Assist, Fortifications flags
- **Auto-updating Timestamps** - Triggers for updated_at columns

## Data Population

The data migration script (`src/scripts/migrateCardData.ts`) reads from markdown files in `src/resources/cards/descriptions/` and populates the database with:

- Character stats and information
- Special card effects and keywords
- Power card values and types
- All other card types with their respective data

## Environment Variables

The migration scripts use the following environment variables (from `.env`):

```bash
DB_HOST=localhost
DB_PORT=1337
DB_NAME=overpower
DB_USER=postgres
DB_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@localhost:1337/overpower
```

## Usage Examples

### Initial Setup
```bash
# Start the database
cd docker && docker-compose up -d

# Run schema migrations
npm run migrate

# Populate with card data
npm run migrate:data
```

### Check Migration Status
```bash
npm run migrate:info
```

### Validate Migrations
```bash
npm run migrate:validate
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running: `cd docker && docker-compose ps`
   - Check connection details in `conf/flyway.conf`

2. **Migration Validation Failed**
   - Run `npm run migrate:repair` to fix schema history table
   - Check for conflicting migrations

3. **Data Migration Issues**
   - Verify markdown files exist in `src/resources/cards/descriptions/`
   - Check file format matches expected structure

### Reset Database
```bash
# Clean database (WARNING: This will delete all data)
cd docker && docker-compose down -v && docker-compose up -d

# Re-run migrations
npm run migrate
npm run migrate:data
```

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development environment first
3. **Use descriptive names** for migration files
4. **Keep migrations small** and focused on single changes
5. **Never modify** already applied migrations
6. **Use transactions** for data migrations when possible
