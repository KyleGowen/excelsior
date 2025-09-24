# OverPower Deckbuilder - AWS Infrastructure

This directory contains Terraform configuration for deploying the OverPower Deckbuilder application to AWS.

## Prerequisites

1. **Terraform** (>= 1.9.0) - [Download here](https://www.terraform.io/downloads)
2. **AWS CLI** configured with credentials
3. **AWS Account** with appropriate permissions

## AWS Free Tier Considerations

⚠️ **Important Free Tier Limits:**

- **EC2**: 750 hours/month of t2.micro instances (1 instance running 24/7)
- **RDS**: 750 hours/month of db.t3.micro instances + 20GB storage
- **EBS**: 30GB of General Purpose (gp2) storage
- **Data Transfer**: 1GB/month out to internet
- **Load Balancer**: NOT included in free tier (will incur costs)

## Current Configuration

- **Terraform Version**: >= 1.9.0 (latest stable)
- **AWS Provider**: ~> 5.0 (latest)
- **Default Region**: us-west-2 (Oregon)
- **Project Name**: op-deckbuilder

## Getting Started

1. **Initialize Terraform:**
   ```bash
   cd infra
   terraform init
   ```

2. **Plan the deployment:**
   ```bash
   terraform plan
   ```

3. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Next Steps

This is just the basic Terraform setup. We'll add resources step by step:

1. ✅ **Basic Terraform setup** (completed)
2. ✅ **RDS PostgreSQL Database** (completed)
3. ✅ **ECR Docker Registry** (completed)
4. 🔄 **EC2 Instance** (next)
5. 🔄 **Application Load Balancer** (optional - not free tier)
6. 🔄 **Domain and SSL** (optional)

## RDS Database Configuration

The RDS PostgreSQL database is configured with:

- **Engine**: PostgreSQL 16.4 (latest version)
- **Instance Class**: db.t3.micro (free tier eligible)
- **Storage**: 20GB gp3 (free tier eligible)
- **Database Name**: "overpower" (auto-created)
- **Access**: Publicly accessible from internet (for external database tools)
- **Security**: Encrypted storage, 7-day backup retention
- **Network**: Uses default VPC and subnets

**⚠️ Security Note**: The database is configured for external access (0.0.0.0/0). In production, restrict access to specific IP ranges.

## ECR Docker Registry Configuration

The ECR (Elastic Container Registry) is configured with:

- **Repository Name**: op-deckbuilder-repo
- **Image Scanning**: Automatic vulnerability scanning on push
- **Encryption**: AES256 encryption at rest
- **Lifecycle Policy**: 
  - Keep last 10 tagged images (v* tags)
  - Delete untagged images older than 1 day
- **Access**: Private repository with IAM-based access control
- **Tag Mutability**: Mutable (allows overwriting tags for dev)

## Cost Estimation

For a basic setup within free tier:
- **EC2 t2.micro**: Free (750 hours/month)
- **RDS db.t3.micro**: Free (750 hours/month)
- **RDS Storage 20GB**: Free (20GB gp3)
- **ECR**: Free (500MB storage/month)
- **EBS 20GB**: Free
- **Data Transfer**: Free (1GB/month)

**Total estimated cost: $0/month** (within free tier limits)

## Notes

- All resources will be tagged with project and environment information
- Default region is us-west-2 (Oregon) which has good free tier availability
- We'll add resources incrementally to ensure everything works at each step
