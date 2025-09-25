#!/bin/bash

# Get Route 53 name servers for excelsior.cards
# Run this after terraform apply to get the name servers for your domain registrar

set -e

echo "🔍 Getting Route 53 name servers for excelsior.cards..."
echo ""

# Check if we're in the right directory
if [ ! -f "main.tf" ]; then
    echo "❌ Error: Please run this script from the infra/ directory"
    exit 1
fi

# Get the name servers
echo "📋 Route 53 Name Servers:"
echo "   Configure these at your domain registrar (excelsior.cards):"
echo ""

terraform output -raw dns_name_servers | tr -d '[]",' | tr ' ' '\n' | sed 's/^/   /'

echo ""
echo "📋 Instructions:"
echo "   1. Log into your domain registrar (where you bought excelsior.cards)"
echo "   2. Find the DNS/Name Server settings"
echo "   3. Replace the current name servers with the ones listed above"
echo "   4. Save the changes"
echo ""
echo "⏰ DNS propagation typically takes 24-48 hours"
echo "🔍 Test with: dig excelsior.cards NS"
echo ""
