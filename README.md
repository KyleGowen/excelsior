# Overpower Deckbuilder

A personal learning project for building a card game deck builder application using Node.js, TypeScript, and Express.

## Project Overview

This is a deck building application for the Overpower card game, featuring:
- Character card management
- Power card system
- Special card effects
- Deck building and management
- Sandbox mode for experimentation

## Features

- **Card Database**: 43 characters, 7 power cards, 5 special cards
- **Advanced Deckbuilder**: Interactive interface for building custom decks
- **Card Management**: Search, filter, and organize cards by type
- **Deck Statistics**: Real-time deck analysis and validation
- **Sandbox Mode**: Experiment with cards without saving
- **Deck Persistence**: Save and load custom deck configurations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: In-memory database with file persistence
- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: TypeScript compiler

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
```bash
npm run dev
```
The server will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/cards` - Get all character cards
- `GET /api/power-cards` - Get all power cards
- `GET /api/special-cards` - Get all special cards
- `GET /api/decks/sandbox` - Get current sandbox deck
- `POST /api/decks` - Create a new deck
- `PUT /api/decks/:id` - Update an existing deck

## Project Structure

```
src/
├── database/          # Database logic and data loading
├── routes/            # API route handlers
├── types/             # TypeScript type definitions
└── index.ts           # Server entry point

public/
├── index.html         # Landing page
└── deckbuilder.html   # Advanced deckbuilder interface

dist/                  # Compiled JavaScript output
```

## Data Sources

The application loads card data from markdown files:
- `overpower-erb-characters.md` - Character cards
- `overpower-erb-powercards.md` - Power cards
- `overpower-erb-aspects.md` - Special cards
- `overpower-erb-locations.md` - Location data

## Learning Goals

This project serves as a learning exercise for:
- TypeScript development
- Express.js API design
- Frontend-backend integration
- Database design patterns
- Card game mechanics implementation

## License

This is a personal learning project. All card game content belongs to their respective owners.

## AWS Deployment Guide

This application is designed to be deployed on AWS using Docker, Terraform, and EC2. Follow this comprehensive guide to deploy the application to production.

### Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured with appropriate permissions
2. **Docker** installed locally
3. **Terraform** installed (version >= 1.9.0)
4. **Node.js** (v14 or higher) for building the application
5. **Domain name** (optional, defaults to `excelsior.cards`)

### Required AWS Permissions

Your AWS user/role needs the following permissions:
- EC2 (create instances, security groups, elastic IPs)
- RDS (create databases, security groups)
- ECR (create repositories, push/pull images)
- SSM (create parameters, send commands)
- Route 53 (create hosted zones, DNS records)
- IAM (create roles and policies)

### Step 1: Configure Terraform Variables

Navigate to the `infra/` directory and review the variables in `variables.tf`:

```bash
cd infra/
```

Key variables you may want to customize:

| Variable | Default | Description | Where to Find |
|----------|---------|-------------|---------------|
| `aws_region` | `us-west-2` | AWS region for deployment | Choose your preferred region |
| `domain_name` | `excelsior.cards` | Your domain name | Your domain registrar |
| `rds_password` | `TempPassword123!` | Database password | **CHANGE THIS** for security |
| `ec2_instance_type` | `t3.micro` | EC2 instance size | AWS EC2 pricing |
| `rds_instance_class` | `db.t3.micro` | RDS instance size | AWS RDS pricing |

### Step 2: Deploy Infrastructure with Terraform

1. **Initialize Terraform:**
   ```bash
   cd infra/
   terraform init
   ```

2. **Plan the deployment:**
   ```bash
   terraform plan
   ```

3. **Apply the infrastructure:**
   ```bash
   terraform apply
   ```

4. **Save the outputs:**
   ```bash
   terraform output > terraform-outputs.txt
   ```

### Step 3: Configure Domain (Optional)

If using a custom domain:

1. **Get the name servers from Terraform output:**
   ```bash
   terraform output dns_name_servers
   ```

2. **Configure at your domain registrar:**
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Update the nameservers to the values from step 1
   - Wait for DNS propagation (can take up to 48 hours)

### Step 4: Build and Deploy Application

1. **Build the application:**
   ```bash
   cd ..  # Back to project root
   npm install
   npm run build
   ```

2. **Run tests to verify functionality:**
   ```bash
   npm test
   ```

3. **Build Docker image for AMD64:**
   ```bash
   docker buildx build --platform linux/amd64 --no-cache -t overpower-deckbuilder:latest .
   ```

4. **Get ECR repository URL from Terraform:**
   ```bash
   cd infra/
   ECR_URL=$(terraform output -raw ecr_repository_url)
   echo $ECR_URL
   ```

5. **Login to ECR:**
   ```bash
   aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_URL
   ```

6. **Tag and push image:**
   ```bash
   docker tag overpower-deckbuilder:latest $ECR_URL:latest
   docker push $ECR_URL:latest
   ```

### Step 5: Deploy to EC2

The EC2 instance will automatically deploy the application using the `user_data.sh` script. To manually trigger a redeploy:

1. **Get the EC2 instance ID:**
   ```bash
   cd infra/
   INSTANCE_ID=$(terraform output -raw ec2_instance_id)
   echo $INSTANCE_ID
   ```

2. **Redeploy the application:**
   ```bash
   aws ssm send-command \
     --region us-west-2 \
     --instance-ids $INSTANCE_ID \
     --document-name "AWS-RunShellScript" \
     --parameters 'commands=["docker stop overpower-app || true", "docker rm overpower-app || true", "docker pull '"$ECR_URL"':latest", "docker run -d --name overpower-app --restart unless-stopped -p 3000:3000 -e NODE_ENV=production -e DATABASE_URL=\"$(aws ssm get-parameter --name \"/op-deckbuilder/dev/database/url\" --with-decryption --region us-west-2 --query \"Parameter.Value\" --output text)\" -e NODE_TLS_REJECT_UNAUTHORIZED=0 -e PORT=3000 '"$ECR_URL"':latest", "sleep 20", "docker ps | grep overpower-app"]'
   ```

### Step 6: Verify Deployment

1. **Check application status:**
   ```bash
   # Get the public IP
   PUBLIC_IP=$(cd infra/ && terraform output -raw ec2_instance_public_ip)
   
   # Test direct access
   curl -I http://$PUBLIC_IP:3000
   
   # Test domain access (if configured)
   curl -I http://excelsior.cards
   ```

2. **Check container logs:**
   ```bash
   aws ssm send-command \
     --region us-west-2 \
     --instance-ids $INSTANCE_ID \
     --document-name "AWS-RunShellScript" \
     --parameters 'commands=["docker logs overpower-app --tail 20"]'
   ```

### Step 7: Monitor and Maintain

1. **View application logs:**
   ```bash
   aws ssm send-command \
     --region us-west-2 \
     --instance-ids $INSTANCE_ID \
     --document-name "AWS-RunShellScript" \
     --parameters 'commands=["docker logs overpower-app --follow"]'
   ```

2. **Restart application:**
   ```bash
   aws ssm send-command \
     --region us-west-2 \
     --instance-ids $INSTANCE_ID \
     --document-name "AWS-RunShellScript" \
     --parameters 'commands=["docker restart overpower-app"]'
   ```

### Environment Variables

The application uses these environment variables (automatically configured by Terraform):

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | SSM Parameter | `production` |
| `DATABASE_URL` | SSM Parameter | PostgreSQL connection string |
| `PORT` | SSM Parameter | `3000` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Hardcoded | `0` (for development) |

### SSM Parameters

Terraform creates these SSM parameters for configuration:

- `/op-deckbuilder/dev/database/url` - Database connection string
- `/op-deckbuilder/dev/database/host` - Database hostname
- `/op-deckbuilder/dev/database/port` - Database port
- `/op-deckbuilder/dev/database/name` - Database name
- `/op-deckbuilder/dev/database/username` - Database username
- `/op-deckbuilder/dev/database/password` - Database password (encrypted)
- `/op-deckbuilder/dev/app/environment` - Application environment
- `/op-deckbuilder/dev/app/port` - Application port

### Troubleshooting

**Application not accessible:**
1. Check EC2 instance status: `aws ec2 describe-instances --instance-ids $INSTANCE_ID`
2. Check security group rules allow port 80 and 3000
3. Check nginx status: `systemctl status nginx`
4. Check container logs: `docker logs overpower-app`

**Database connection issues:**
1. Verify RDS instance is running
2. Check security group allows connections from EC2
3. Verify database credentials in SSM parameters

**Domain not resolving:**
1. Check Route 53 hosted zone configuration
2. Verify nameservers at domain registrar
3. Wait for DNS propagation (up to 48 hours)

### Cost Optimization

- **EC2**: Use `t3.micro` for development, scale up for production
- **RDS**: Use `db.t3.micro` for development, scale up for production
- **Storage**: RDS defaults to 20GB, adjust based on needs
- **Domain**: Route 53 hosted zone costs ~$0.50/month

### Security Considerations

- Change default database password
- Use IAM roles instead of access keys
- Enable SSL/TLS for production
- Regular security updates for EC2 instance
- Monitor CloudTrail logs for suspicious activity

## Contributing

This is a personal project for learning purposes. No contributions needed.
