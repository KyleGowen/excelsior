#!/bin/bash

# OverPower Deck Builder Production Deployment Script
# This script builds, pushes, and deploys the application to AWS

set -e

echo "🚀 Starting OverPower Deck Builder Production Deployment..."

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

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS CLI is not configured"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-west-2"
ECR_REPO="overpower-deckbuilder"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo "🏗️ Building Docker image for AMD64 architecture..."
docker build --platform linux/amd64 --no-cache -t ${ECR_REPO}:latest .

echo "🏷️ Tagging image for ECR..."
docker tag ${ECR_REPO}:latest ${ECR_URI}:latest

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

echo "📤 Pushing image to ECR..."
docker push ${ECR_URI}:latest

echo "🔍 Getting EC2 instance ID..."
INSTANCE_ID=$(cd infra && terraform output -raw ec2_instance_id 2>/dev/null || echo "")
if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Error: Could not get EC2 instance ID from Terraform"
    exit 1
fi

echo "📋 Instance ID: ${INSTANCE_ID}"

echo "🔧 Loading production secrets from SSM and applying migrations..."
EXPECTED_MIGRATION=$(find migrations -maxdepth 1 -type f -name 'V*__*.sql' -exec basename {} \; \
    | sed -E 's/^V([^_]+)__.*/\1/' \
    | sort -V \
    | tail -1)
SCRIPT_B64=$(base64 < .github/scripts/prepare-production.sh | tr -d '\n')
REMOTE_COMMAND="echo '$SCRIPT_B64' | base64 -d > /tmp/prepare-production.sh && chmod 700 /tmp/prepare-production.sh && ECR_IMAGE='${ECR_URI}:latest' EXPECTED_MIGRATION='$EXPECTED_MIGRATION' AWS_REGION='$AWS_REGION' bash /tmp/prepare-production.sh"
PARAMETERS=$(jq -n --arg command "$REMOTE_COMMAND" '{commands: [$command]}')
PREPARE_COMMAND_ID=$(aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --timeout-seconds 1200 \
    --parameters "$PARAMETERS" \
    --output text --query 'Command.CommandId')
bash .github/scripts/wait-ssm-command.sh "$PREPARE_COMMAND_ID" "$INSTANCE_ID" 240 "Prepare production and migrate"

echo "🐳 Deploying container to EC2..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin '${ECR_URI}'",
        "docker pull '${ECR_URI}':latest",
        "docker stop overpower-deckbuilder || true",
        "docker rm overpower-deckbuilder || true",
        "docker run -d --name overpower-deckbuilder --restart unless-stopped -p 3000:3000 --env-file /opt/app/.env '${ECR_URI}':latest"
    ]' \
    --output text --query 'Command.CommandId'

echo "⏳ Waiting for deployment to complete..."
sleep 30

echo "🔍 Checking deployment status..."
aws ssm send-command \
    --instance-ids "${INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "docker ps",
        "docker logs overpower-deckbuilder --tail 20"
    ]' \
    --output text --query 'Command.CommandId'

echo "⏳ Waiting for status check..."
sleep 10

echo "🌐 Getting application URL..."
APP_URL=$(cd infra && terraform output -raw app_http_url 2>/dev/null || echo "http://44.254.222.47:3000")

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application is available at:"
echo "   ${APP_URL}"
echo ""
echo "🔍 To check deployment status:"
echo "   aws ssm send-command --instance-ids ${INSTANCE_ID} --document-name AWS-RunShellScript --parameters 'commands=[\"docker ps\",\"docker logs overpower-deckbuilder --tail 20\"]'"
echo ""
echo "📊 To monitor logs:"
echo "   aws ssm send-command --instance-ids ${INSTANCE_ID} --document-name AWS-RunShellScript --parameters 'commands=[\"docker logs overpower-deckbuilder -f\"]'"
echo ""
