#!/bin/bash

# Force Production Server Restart Script
# This script forces a complete restart of the production container with latest image

set -e

echo "🔄 Force Restarting Production Server..."

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-west-2"
ECR_REPO="overpower-deckbuilder"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

# Get EC2 instance ID
INSTANCE_ID=$(cd infra && terraform output -raw ec2_instance_id 2>/dev/null || echo "")
if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Error: Could not get EC2 instance ID from Terraform"
    exit 1
fi

echo "📋 Instance ID: ${INSTANCE_ID}"

echo "🛑 Stopping and removing existing container..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
            "docker stop overpower-deckbuilder || true",
            "docker rm overpower-deckbuilder || true",
            "docker stop overpower-app || true",
            "docker rm overpower-app || true",
        "docker ps -a | grep overpower || echo \"No containers found\""
    ]' \
    --output text --query 'Command.CommandId'

sleep 5

echo "📥 Pulling latest image..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        \"aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${ECR_URI}\",
        \"docker pull ${ECR_URI}:latest\",
        \"docker images | grep overpower-deckbuilder | head -3\"
    ]" \
    --output text --query 'Command.CommandId'

sleep 10

echo "🚀 Starting fresh container..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "docker run -d --name overpower-app --restart unless-stopped -p 3000:3000 --env-file /opt/app/.env -e SKIP_MIGRATIONS=false '${ECR_URI}':latest",
        "sleep 5",
        "docker ps | grep overpower-deckbuilder",
        "docker logs overpower-deckbuilder --tail 30"
    ]' \
    --output text --query 'Command.CommandId'

sleep 15

echo "🔍 Verifying deployment..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "docker ps | grep overpower",
        "curl -s http://localhost:3000/health | head -20 || echo \"Health check failed\"",
        "docker logs overpower-app --tail 50 || docker logs overpower-deckbuilder --tail 50"
    ]' \
    --output text --query 'Command.CommandId'

echo ""
echo "✅ Force restart completed!"
echo ""
echo "🔍 To check logs:"
echo "   aws ssm send-command --instance-ids ${INSTANCE_ID} --document-name AWS-RunShellScript --parameters 'commands=[\"docker logs overpower-app -f\"]'"
echo ""

