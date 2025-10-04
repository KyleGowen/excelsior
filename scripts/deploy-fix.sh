#!/bin/bash

# Script to fix production authentication issues
# This should be run on the production server

echo "🚀 Starting production authentication fix..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"

# Check if we're on the production server
if [ -f "/etc/nginx/sites-available/overpower" ] || [ -d "/opt/overpower" ]; then
    echo "✅ Running on production server"
    
    # Change to project directory
    cd "$PROJECT_DIR" || exit 1
    
    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found"
        exit 1
    fi
    
    echo "✅ Node.js and npm are available"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Run the authentication fix script
    echo "🔧 Running authentication fix..."
    node scripts/fix-production-auth.js
    
    # Check if the application is running
    if pgrep -f "node.*index.js" > /dev/null; then
        echo "🔄 Restarting application..."
        pkill -f "node.*index.js"
        sleep 2
        
        # Start the application in the background
        nohup node dist/index.js > app.log 2>&1 &
        echo "✅ Application restarted"
    else
        echo "ℹ️ Application not running, starting it..."
        nohup node dist/index.js > app.log 2>&1 &
        echo "✅ Application started"
    fi
    
    echo "🎉 Production fix completed!"
    
else
    echo "❌ This script should be run on the production server"
    echo "💡 To run on production, SSH into the server and run:"
    echo "   cd /path/to/overpower-deckbuilder"
    echo "   chmod +x scripts/deploy-fix.sh"
    echo "   ./scripts/deploy-fix.sh"
    exit 1
fi
