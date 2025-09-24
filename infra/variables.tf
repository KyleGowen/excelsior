# Variables for OverPower Deckbuilder AWS Infrastructure

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"  # Oregon - good for free tier
  
  validation {
    condition = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "op-deckbuilder"
  
  validation {
    condition     = length(var.project_name) >= 3 && length(var.project_name) <= 20
    error_message = "Project name must be between 3 and 20 characters."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Optional: AWS Profile (uncomment if needed)
# variable "aws_profile" {
#   description = "AWS profile to use for authentication"
#   type        = string
#   default     = "default"
# }

# RDS Database Configuration
variable "db_instance_class" {
  description = "RDS instance class (must be db.t3.micro for free tier)"
  type        = string
  default     = "db.t3.micro"
  
  validation {
    condition     = contains(["db.t3.micro", "db.t3.small", "db.t3.medium"], var.db_instance_class)
    error_message = "Instance class must be one of: db.t3.micro, db.t3.small, db.t3.medium."
  }
}

variable "db_allocated_storage" {
  description = "Initial allocated storage in GB (20GB is free tier limit)"
  type        = number
  default     = 20
  
  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 1000
    error_message = "Allocated storage must be between 20 and 1000 GB."
  }
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "overpower"
  
  validation {
    condition     = length(var.db_name) >= 1 && length(var.db_name) <= 64
    error_message = "Database name must be between 1 and 64 characters."
  }
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
  
  validation {
    condition     = length(var.db_username) >= 1 && length(var.db_username) <= 16
    error_message = "Database username must be between 1 and 16 characters."
  }
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
  default     = "TempPassword123!"  # Change this in production!
  
  validation {
    condition     = length(var.db_password) >= 8 && length(var.db_password) <= 128
    error_message = "Database password must be between 8 and 128 characters."
  }
}

variable "db_port" {
  description = "Port for the database"
  type        = number
  default     = 5432
  
  validation {
    condition     = var.db_port >= 1150 && var.db_port <= 65535
    error_message = "Database port must be between 1150 and 65535."
  }
}
