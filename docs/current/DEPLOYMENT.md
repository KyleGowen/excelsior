# OverPower Deck Builder - Production Deployment Guide

This guide explains how to deploy the OverPower Deck Builder application to AWS production environment.

## Prerequisites

1. **Docker** - For building the application image
2. **AWS CLI** - Configured with appropriate credentials
3. **Terraform** - For infrastructure management (if needed)
4. **Access to AWS Account** - With permissions for ECR, EC2, RDS, and SSM

## Quick Deployment

### Option 1: Automated Deployment Script (Recommended)

```bash
# From the project root directory
./scripts/deploy-to-production.sh
```

This script will:
- Build the Docker image for AMD64 architecture
- Push the image to ECR
- Deploy the container to EC2 with correct environment variables
- Verify the deployment

### Option 2: Manual Deployment

```bash
# 1. Build and push the image
docker build --platform linux/amd64 --no-cache -t overpower-deckbuilder .
docker tag overpower-deckbuilder:latest 474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder:latest
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 474120878015.dkr.ecr.us-west-2.amazonaws.com
docker push 474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder:latest

# 2. Deploy to EC2
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name "AWS-RunShellScript" --parameters 'commands=[...]'
```

## Infrastructure Overview

### AWS Resources

- **EC2 Instance**: `i-0dee560af076c0f9d` (t2.micro)
- **RDS PostgreSQL**: `op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432`
- **ECR Repository**: `474120878015.dkr.ecr.us-west-2.amazonaws.com/overpower-deckbuilder`
- **Domain**: `excelsior.cards` (via Route53)

### Database Configuration

- **Host**: `op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `overpower`
- **Username**: `postgres`
- **Password**: `TempPassword123!` (stored in SSM Parameter Store)
- **SSL**: Required (`sslmode=require`)

## Environment Variables

The application requires the following environment variables:

```bash
DATABASE_URL=postgresql://postgres:TempPassword123!@op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require
DB_HOST=op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=overpower
DB_USER=postgres
DB_PASSWORD=TempPassword123!
DB_USERNAME=postgres
NODE_ENV=production
PORT=3000
NODE_TLS_REJECT_UNAUTHORIZED=0
FLYWAY_URL=jdbc:postgresql://op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com:5432/overpower?sslmode=require
FLYWAY_USER=postgres
FLYWAY_PASSWORD=TempPassword123!
```

## Deployment Process

### 1. Build Phase
- Builds Docker image for AMD64 architecture (EC2 compatibility)
- Installs dependencies and builds TypeScript
- Copies application files and resources

### 2. Test Phase
- Runs unit tests to verify code quality
- Executes 9 parallel integration test categories:
  - Security, Authentication, Search & Filtering
  - Deck Core, Deck Security, Game Logic
  - UI/UX, User Management, Remaining tests
- Each test category runs independently with its own database

### 3. Migration Phase
- Runs production database migrations via SSM
- Uses simplified command execution for reliability
- Handles "no new migrations" scenarios gracefully
- Verifies database schema and connectivity

### 4. Push Phase
- Tags image for ECR repository
- Authenticates with ECR
- Pushes image to AWS ECR

### 5. Deploy Phase
- Creates environment file on EC2 instance
- Pulls latest image from ECR
- Stops and removes existing container
- Starts new container with environment variables

### 6. Verification Phase
- Checks container status
- Displays application logs
- Verifies server is running
- Performs health check validation

## Application Features

### Database Migrations
- Automatically runs Flyway migrations on startup
- Creates database schema and populates initial data
- Loads 43 characters and 8 locations from resources
- **Performance optimizations**: Includes V141 migration with database indexes for faster deck loading
- **Deployment process**: Uses simplified SSM command execution for reliability
- **Error handling**: Gracefully handles "no new migrations" scenarios

### Server Features
- Express.js server on port 3000
- PostgreSQL database integration
- User authentication and session management
- Deck building and management
- Card database with search functionality

### Performance Features
- **Optimized deck loading**: Pre-computed metadata and database indexes for fast deck display
- **Efficient queries**: Single JOIN query instead of multiple database calls
- **Frontend optimization**: Priority loading with decks appearing immediately
- **Database caching**: Repository-level caching reduces database load
- **Expected performance**: 80-90% faster deck loading compared to previous implementation

## Monitoring and Maintenance

### Check Application Status
```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker ps","docker logs overpower-deckbuilder --tail 20"]'
```

### View Application Logs
```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker logs overpower-deckbuilder -f"]'
```

### Restart Application
```bash
aws ssm send-command --instance-ids i-0dee560af076c0f9d --document-name AWS-RunShellScript --parameters 'commands=["docker restart overpower-deckbuilder"]'
```

## Application URLs

- **Production**: http://excelsior.cards
- **Direct IP**: http://44.254.222.47:3000
- **API Documentation**: http://excelsior.cards (same as main app)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if RDS instance is running
   - Verify security groups allow EC2 to connect to RDS
   - Confirm database credentials are correct

2. **SSL Certificate Issues**
   - Ensure `NODE_TLS_REJECT_UNAUTHORIZED=0` is set
   - Use `sslmode=require` for database connections

3. **Container Restart Loop**
   - Check application logs for errors
   - Verify all environment variables are set correctly
   - Ensure database is accessible

4. **Image Pull Failed**
   - Verify ECR authentication
   - Check if image exists in repository
   - Ensure correct image tag is used

### Debug Commands

```bash
# Check container status
docker ps -a

# View detailed logs
docker logs overpower-deckbuilder --tail 50

# Check environment variables
cat /opt/app/.env

# Test database connection
psql -h op-deckbuilder-postgres.cdaeyc0ik7bu.us-west-2.rds.amazonaws.com -U postgres -d overpower
```

## Security Considerations

- Database password is stored in AWS SSM Parameter Store
- SSL is required for database connections
- Application runs in Docker container for isolation
- Environment variables are not logged in plain text

## Cost Optimization

- Uses t2.micro EC2 instance (free tier eligible)
- Uses db.t3.micro RDS instance (free tier eligible)
- ECR storage is minimal for single application
- No load balancer (direct EC2 access)

## Backup and Recovery

- Database backups are handled by RDS (7-day retention)
- Application code is version controlled in Git
- Docker images are stored in ECR
- Infrastructure is managed by Terraform

## Updates and Maintenance

### Code Updates
1. Make changes to code
2. Run `./scripts/deploy-to-production.sh`
3. Verify deployment success

### Database Updates
1. Create new migration files
2. Deploy application (migrations run automatically)
3. Verify migration success in logs

### Infrastructure Updates
1. Modify Terraform files in `infra/` directory
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify AWS resource status
4. Check Terraform state for infrastructure issues

## Notes

- The application automatically creates an initial user "kyle" on first startup
- Database migrations run automatically on each deployment
- The application loads card data from the `src/resources` directory
- All API endpoints are available at the root URL
