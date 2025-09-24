#!/bin/bash

# User data script for OverPower Deckbuilder EC2 instance
# This script installs Docker, pulls the application image from ECR, and runs it

set -e  # Exit on any error

# Log everything to /var/log/user-data.log
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting user data script execution..."

# Update system packages
echo "Updating system packages..."
dnf update -y

# Install Docker
echo "Installing Docker..."
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
dnf install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install jq for JSON parsing
echo "Installing jq..."
dnf install -y jq

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_repository_url}

# Get database connection details from SSM
echo "Retrieving database configuration from SSM..."
DB_URL=$(aws ssm get-parameter --name "/${project_name}/${environment}/database/url" --with-decryption --region ${aws_region} --query 'Parameter.Value' --output text)
APP_ENV=$(aws ssm get-parameter --name "/${project_name}/${environment}/app/environment" --region ${aws_region} --query 'Parameter.Value' --output text)
APP_PORT=$(aws ssm get-parameter --name "/${project_name}/${environment}/app/port" --region ${aws_region} --query 'Parameter.Value' --output text)

echo "Database URL retrieved successfully"
echo "Application environment: $APP_ENV"
echo "Application port: $APP_PORT"

# Pull the latest application image
echo "Pulling application image from ECR..."
docker pull ${ecr_repository_url}:latest

# Stop any existing container with the same name
echo "Stopping any existing application container..."
docker stop overpower-app || true
docker rm overpower-app || true

# Run the application container
echo "Starting application container..."
docker run -d \
  --name overpower-app \
  --restart unless-stopped \
  -p 80:3000 \
  -p 443:3000 \
  -p 3000:3000 \
  -e NODE_ENV=$APP_ENV \
  -e DATABASE_URL="$DB_URL" \
  -e PORT=3000 \
  ${ecr_repository_url}:latest

# Wait a moment for the container to start
sleep 10

# Check if the container is running
echo "Checking application status..."
if docker ps | grep -q overpower-app; then
    echo "✅ Application container is running successfully!"
    echo "Application should be accessible at:"
    echo "  - http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
    echo "  - http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):80"
else
    echo "❌ Application container failed to start"
    echo "Container logs:"
    docker logs overpower-app || true
    exit 1
fi

# Set up log rotation for Docker containers
echo "Setting up log rotation..."
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

echo "User data script completed successfully!"
