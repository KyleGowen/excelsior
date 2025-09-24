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
