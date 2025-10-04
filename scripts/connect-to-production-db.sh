#!/bin/bash

# Script to connect to production database
# Make sure you have psql installed and AWS credentials configured

echo "🔗 Connecting to production database..."

# Database connection details
DB_HOST="op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="overpower"
DB_USER="postgres"

echo "📊 Database Details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

echo "✅ psql found, connecting..."

# Connect to the database
# You'll be prompted for the password
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo "🔌 Disconnected from database"
