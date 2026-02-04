# OverPower Deckbuilder - Deployment Strategy Documentation

## Overview

The OverPower Deckbuilder uses a modern CI/CD pipeline with GitHub Actions, Docker containerization, and AWS infrastructure managed by Terraform. This document details the complete deployment strategy, from code commit to production deployment.

## Architecture Overview

```
GitHub Repository (main branch)
    ↓ (push trigger)
GitHub Actions CI/CD Pipeline
    ↓ (build & test)
Docker Image → AWS ECR
    ↓ (deploy)
AWS EC2 Instance (Docker Container)
    ↓ (database)
AWS RDS PostgreSQL
    ↓ (domain)
excelsior.cards (via nginx proxy)
```

## Git Branch Strategy

### Primary Branch: `main`
- **Trigger**: All deployments are triggered by pushes to the `main` branch
- **Protection**: The `main` branch is the single source of truth for production
- **Commit Strategy**: Each commit to `main` triggers a full deployment pipeline

### Deployment Trigger
```yaml
on:
  push:
    branches: [ main ]
```

### Git Verification Process
The deployment pipeline includes comprehensive git verification:
- **Current branch verification**: Ensures building from `main` branch
- **Commit SHA verification**: Compares `git rev-parse HEAD` with `${{ github.sha }}`
- **Source file verification**: Checks that our fixes are present in the source files before building
- **Fetch depth**: Uses `fetch-depth: 0` to ensure complete git history

## Docker Image Build Process

### Multi-Stage Build Strategy

#### Stage 1: Build Stage
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build
```

#### Stage 2: Runtime Stage
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    bash openjdk17-jre curl tar \
    postgresql-client netcat-openbsd ca-certificates tzdata \
    dumb-init

# Install Flyway for database migrations
RUN curl -fsSL https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}-linux-x64.tar.gz \
    | tar xz -C /opt \
 && ln -s /opt/flyway-${FLYWAY_VERSION}/flyway /usr/local/bin/flyway

# Copy application files
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY public /app/public
COPY src/public /app/src/public
COPY src/resources /app/src/resources
COPY migrations /app/migrations
```

### Build Process Features

#### No-Cache Build Strategy
```bash
docker build --platform linux/amd64 --no-cache --pull --force-rm -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
```

- **`--no-cache`**: Prevents Docker layer caching issues
- **`--pull`**: Forces pull of base images to ensure latest versions
- **`--force-rm`**: Removes intermediate containers
- **`--platform linux/amd64`**: Ensures compatibility with EC2 instances

#### Pre-Build Verification
Before building, the pipeline verifies:
- Current commit SHA matches expected SHA
- Source files contain our fixes (debug logging, Victory Harben fix)
- Build fails if verification fails

#### Post-Build Verification
After building, the pipeline verifies:
- Docker image contains required files
- Debug logging is present in the built image
- Victory Harben fix is present in the built image

## AWS Infrastructure (Terraform)

### Core Components

#### 1. ECR (Elastic Container Registry)
**File**: `infra/ecr.tf`

```hcl
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-repo"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "AES256"
  }
}
```

**Features**:
- Private Docker registry for application images
- Automatic vulnerability scanning on push
- AES256 encryption at rest
- Lifecycle policy to manage image retention (keeps last 10 tagged images)

#### 2. EC2 Instance
**File**: `infra/ec2.tf`

```hcl
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  user_data              = local.user_data
}
```

**Features**:
- Amazon Linux 2023 AMI (latest)
- t2.micro instance (free tier eligible)
- IAM role for ECR and SSM access
- User data script for automatic setup

#### 3. RDS PostgreSQL Database
**File**: `infra/rds.tf`

```hcl
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"
  engine     = "postgres"
  engine_version = "16.4"
  instance_class    = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  publicly_accessible = true
}
```

**Features**:
- PostgreSQL 16.4 (latest version)
- GP3 storage with encryption at rest
- Publicly accessible (required for external access)
- Automated backups (7-day retention)
- Free tier eligible configuration

#### 4. Security Groups
**Files**: `infra/networking.tf`, `infra/ssl.tf`

- **Application Security Group**: Allows HTTP/HTTPS traffic
- **Database Security Group**: Allows PostgreSQL access from anywhere
- **SSL/TLS Configuration**: Managed by AWS Certificate Manager

#### 5. Domain and DNS
**Files**: `infra/dns.tf`, `infra/ssl.tf`

- **Route 53**: DNS management for `excelsior.cards`
- **SSL Certificate**: AWS Certificate Manager for HTTPS
- **Nginx Proxy**: Routes traffic from domain to application

### IAM Roles and Policies

#### EC2 Instance Role
```hcl
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}
```

**Attached Policies**:
- **ECR Access**: Pull images from ECR repository
- **SSM Access**: Retrieve configuration parameters
- **SSM Managed Instance Core**: Enable Systems Manager access

## Deployment Process

### 1. GitHub Actions Pipeline

#### Build Stage
```yaml
build:
  name: Build
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Build project
      run: npm run build
```

#### Test Stages
- **Unit Tests**: `npm run test:unit`
- **Integration Tests**: `npm run test:integration` (with PostgreSQL service)
- **Linting**: Optional linting step

#### Docker Build Stage
```yaml
build-docker:
  name: Build & Push Docker Image
  needs: [build, unit-tests, integration-tests]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

**Process**:
1. **Git Verification**: Verify correct commit and branch
2. **Source Verification**: Check fixes are present in source files
3. **Docker Build**: Build with no-cache strategy
4. **Image Verification**: Verify built image contains fixes
5. **ECR Push**: Push to AWS ECR with commit SHA and `latest` tags

### 2. Database Migration Stage

#### Production Migrations
```yaml
run-migrations:
  name: Run Production Migrations
  needs: [build-docker]
```

**Process**:
1. **Environment Setup**: Create environment file on EC2
2. **Flyway Configuration**: Copy Flyway config to EC2
3. **Migration Execution**: Run Flyway migrations on production database
4. **Verification**: Ensure migrations completed successfully

### 3. Application Deployment Stage

#### Nuclear Deployment Strategy
```yaml
deploy:
  name: Deploy to Production
  needs: [run-migrations]
```

**Process**:
1. **System Cleanup**: `docker system prune -af` (nuclear option)
2. **ECR Login**: Authenticate with AWS ECR
3. **Image Pull**: `docker pull --no-cache $ECR_URI:latest`
4. **Container Cleanup**: Stop and remove all existing containers
5. **Fresh Container**: Start new container with latest image
6. **Health Check**: Verify container is running
7. **Flyway Repair**: Run Flyway repair if needed

#### Deployment Commands
```bash
# Nuclear cleanup
docker system prune -af
docker volume prune -f
docker network prune -f

# Force pull latest image
docker pull --no-cache $ECR_URI:latest

# Stop and remove all containers
docker stop $(docker ps -aq) || true
docker rm $(docker ps -aq) || true

# Start fresh container
docker run -d --name overpower-app --restart unless-stopped \
  -p 3000:3000 --env-file /opt/app/.env \
  -e SKIP_MIGRATIONS=false $ECR_URI:latest
```

## Environment Configuration

### Environment Variables
The application uses the following environment variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@rds-endpoint:5432/overpower?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0
SKIP_MIGRATIONS=false
```

### Configuration Sources
1. **SSM Parameters**: Database connection details stored in AWS Systems Manager
2. **Environment File**: `/opt/app/.env` on EC2 instance
3. **Container Environment**: Passed via `-e` flags during deployment

## Monitoring and Logging

### Application Logs
- **Container Logs**: `docker logs overpower-app`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/user-data.log`

### Health Checks
- **Application Health**: `http://excelsior.cards/health`
- **Container Status**: `docker ps`
- **Database Connectivity**: Built into application startup

### Log Rotation
```bash
# Docker container logs
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}

# Nginx logs
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 nginx adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

## Security Considerations

### Network Security
- **Security Groups**: Restrict access to necessary ports only
- **SSL/TLS**: HTTPS enforced via AWS Certificate Manager
- **Database Access**: PostgreSQL accessible from internet (consider restricting in production)

### Container Security
- **Image Scanning**: ECR automatically scans for vulnerabilities
- **Non-root User**: Application runs as non-root user
- **Minimal Base Image**: Alpine Linux for smaller attack surface

### Access Control
- **IAM Roles**: Least privilege access for EC2 instance
- **ECR Policies**: Restrict image access to AWS account
- **SSM Parameters**: Encrypted configuration storage

## Troubleshooting

### Common Issues and Solutions

#### 1. Deployment Not Updating Code
**Symptoms**: New code not appearing in production despite successful deployment
**Solution**: Nuclear deployment strategy with no-cache builds

#### 2. Database Connection Issues
**Symptoms**: Application fails to start due to database connectivity
**Solution**: Check RDS security groups and connection string

#### 3. Container Startup Failures
**Symptoms**: Container exits immediately after starting
**Solution**: Check container logs and environment variables

### Debugging Commands
```bash
# Check container status
docker ps

# View container logs
docker logs overpower-app --tail 50

# Check application health
curl http://localhost:3000/health

# Verify environment variables
docker exec overpower-app env

# Check database connectivity
docker exec overpower-app psql $DATABASE_URL -c "SELECT 1;"
```

## Future Improvements

### Potential Enhancements
1. **Blue-Green Deployment**: Zero-downtime deployments
2. **Auto-scaling**: Scale based on demand
3. **Load Balancing**: Multiple EC2 instances
4. **Custom VPC**: More secure network isolation
5. **Secrets Management**: AWS Secrets Manager for sensitive data
6. **Monitoring**: CloudWatch integration for metrics and alerts

### Cost Optimization
1. **Spot Instances**: Use spot instances for non-critical workloads
2. **Reserved Instances**: For predictable workloads
3. **Storage Optimization**: Use appropriate storage classes
4. **Resource Right-sizing**: Monitor and adjust instance sizes

## Conclusion

The OverPower Deckbuilder deployment strategy provides a robust, automated CI/CD pipeline that ensures reliable deployments with comprehensive verification and monitoring. The nuclear deployment approach with no-cache builds ensures that new code is always properly deployed, while the Terraform-managed infrastructure provides a solid foundation for scalability and security.
