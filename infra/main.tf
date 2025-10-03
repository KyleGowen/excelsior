# OverPower Deckbuilder - AWS Infrastructure
# Terraform configuration for deploying the application to AWS

terraform {
  required_version = ">= 1.9.0"  # Latest stable version as of 2024
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Latest AWS provider
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  # Optional: Uncomment if you want to specify a specific AWS profile
  # profile = var.aws_profile
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources for current AWS account and region info
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

