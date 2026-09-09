# Input variables for the OverPower Deckbuilder infrastructure

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "op-deckbuilder"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_database_name" {
  description = "RDS database name"
  type        = string
  default     = "overpower"
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "postgres"
}

variable "rds_password" {
  description = "RDS master password (supply through TF_VAR_rds_password; never commit it)"
  type        = string
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(var.rds_password) >= 32
    error_message = "rds_password must be at least 32 characters."
  }
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

# Phase 1: explicit allowlist of IPv4 CIDRs permitted to reach RDS on the DB
# port in addition to the app EC2 SG. Empty by default — add a CIDR here when
# a CI runner or trusted admin tool needs direct access. Documented in
# docs/current/OPS_RDS_SECURITY_GROUP.md.
variable "rds_admin_cidrs" {
  description = "Additional IPv4 CIDRs allowed to connect to RDS (in addition to the app EC2 SG)."
  type        = list(string)
  default     = []
}

# EC2 Configuration
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "op-deckbuilder-key"
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "excelsior.cards"
}

variable "enable_ssl" {
  description = "Enable SSL/TLS configuration"
  type        = bool
  default     = false
}

variable "ssl_certificate_arn" {
  description = "ARN of the SSL certificate (if using ACM)"
  type        = string
  default     = ""
}

# ECR Configuration
variable "ecr_repository_name" {
  description = "ECR repository name"
  type        = string
  default     = "op-deckbuilder-repo"
}

# Email Forwarding Configuration
variable "forward_from_email" {
  description = "Email address to forward from"
  type        = string
  default     = "kyle@excelsior.cards"
}

variable "forward_to_email" {
  description = "Email address to forward to"
  type        = string
  default     = "kyle.gowen@gmail.com"
}

variable "ses_default_configuration_set_name" {
  description = "Existing SES configuration set automatically applied to mail sent from the domain identity"
  type        = string
  default     = "my-first-configuration-set"
}

# Firebase (for Google Sign-In)
variable "firebase_api_key" {
  description = "Firebase API key for web client"
  type        = string
  default     = ""
}

variable "firebase_auth_domain" {
  description = "Firebase auth domain"
  type        = string
  default     = ""
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  default     = ""
}

variable "firebase_app_id" {
  description = "Firebase web app ID"
  type        = string
  default     = ""
}

variable "firebase_service_account_json" {
  description = "Firebase Admin SDK service account JSON (from infra/firebase-service-account.json)"
  type        = string
  default     = ""
  sensitive   = true
}

# CI/CD IAM Configuration
variable "ci_iam_username" {
  description = "IAM username for the CI/CD user (GitHub Actions). Credentials are stored as AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in GitHub Actions secrets. Run 'aws iam list-users' to find the username."
  type        = string
  default     = ""
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "OverPower Deckbuilder"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
