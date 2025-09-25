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
  default     = "db.t3.micro"
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
  description = "RDS master password"
  type        = string
  default     = "TempPassword123!"
  sensitive   = true
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
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