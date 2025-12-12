#!/bin/bash

# Check Production Route Script
# Verifies that the PUT /api/decks/:id/cards route exists in production

set -e

echo "🔍 Checking Production Route Status..."

# Get EC2 instance ID
INSTANCE_ID=$(cd infra && terraform output -raw ec2_instance_id 2>/dev/null || echo "i-04493611b99785f28")

echo "📋 Instance ID: ${INSTANCE_ID}"

echo "🔍 Checking if route exists in production container..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "echo \"=== PRODUCTION ROUTE CHECK ===\"",
        "echo \"\"",
        "echo \"Checking container status...\"",
        "docker ps | grep overpower || echo \"No overpower container found\"",
        "echo \"\"",
        "echo \"Checking for PUT /api/decks/:id/cards route in dist/index.js...\"",
        "if docker exec overpower-app grep -q \"PUT.*decks.*cards\" /app/dist/index.js 2>/dev/null; then",
        "  echo \"✅ Route found in overpower-app container\"",
        "  docker exec overpower-app grep \"PUT.*decks.*cards\" /app/dist/index.js | head -1",
        "elif docker exec overpower-deckbuilder grep -q \"PUT.*decks.*cards\" /app/dist/index.js 2>/dev/null; then",
        "  echo \"✅ Route found in overpower-deckbuilder container\"",
        "  docker exec overpower-deckbuilder grep \"PUT.*decks.*cards\" /app/dist/index.js | head -1",
        "else",
        "  echo \"❌ Route NOT found in any container\"",
        "fi",
        "echo \"\"",
        "echo \"Checking container logs for route registration...\"",
        "docker logs overpower-app --tail 50 2>/dev/null | grep -i \"route\|PUT\|decks.*cards\" || docker logs overpower-deckbuilder --tail 50 2>/dev/null | grep -i \"route\|PUT\|decks.*cards\" || echo \"No route registration logs found\"",
        "echo \"\"",
        "echo \"=== END ROUTE CHECK ===\""
    ]' \
    --output text --query 'Command.CommandId'

echo "⏳ Waiting for check to complete..."
sleep 10

echo ""
echo "✅ Route check completed!"
echo ""
echo "If route is missing, run: ./scripts/force-production-restart.sh"










