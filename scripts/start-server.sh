#!/bin/bash

# OverPower Deck Builder Server Startup Script
# This script ensures the database is running and starts the server with migrations

set -e

echo "🚀 Starting OverPower Deck Builder Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database is running
echo "🔍 Checking database status..."
cd docker
if ! docker-compose ps | grep -q "overpower-postgres.*Up"; then
    echo "📊 Starting PostgreSQL database..."
    docker-compose up -d
    echo "⏳ Waiting for database to be ready..."
    sleep 10
else
    echo "✅ Database is already running"
fi

# Go back to project root
cd ..

# Check if database is accessible
echo "🔍 Testing database connection..."
if ! docker-compose -f docker/docker-compose.yml exec postgres psql -U postgres -d overpower -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    exit 1
fi

echo "✅ Database is accessible"

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Start the server
echo "🚀 Starting server with automatic migrations..."
npm start
