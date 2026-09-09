# AWS Systems Manager Parameter Store for database connection details
# This stores sensitive database credentials securely for the application to access

# Database host/endpoint
resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.project_name}/${var.environment}/database/host"
  type  = "String"
  value = aws_db_instance.postgres.address
  
  description = "Database host endpoint for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-host"
    Environment = var.environment
  }
}

# Database port
resource "aws_ssm_parameter" "db_port" {
  name  = "/${var.project_name}/${var.environment}/database/port"
  type  = "String"
  value = tostring(aws_db_instance.postgres.port)
  
  description = "Database port for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-port"
    Environment = var.environment
  }
}

# Database name
resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.project_name}/${var.environment}/database/name"
  type  = "String"
  value = aws_db_instance.postgres.db_name
  
  description = "Database name for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-name"
    Environment = var.environment
  }
}

# Database username (sensitive)
resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.project_name}/${var.environment}/database/username"
  type  = "SecureString"
  value = aws_db_instance.postgres.username
  
  description = "Database username for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-username"
    Environment = var.environment
  }
}

# Database password (sensitive)
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/${var.environment}/database/password"
  type  = "SecureString"
  value = aws_db_instance.postgres.password
  
  description = "Database password for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-password"
    Environment = var.environment
  }
}

# Complete database URL (sensitive)
resource "aws_ssm_parameter" "db_url" {
  name  = "/${var.project_name}/${var.environment}/database/url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.postgres.username}:${aws_db_instance.postgres.password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}?sslmode=require"
  
  description = "Complete database connection URL for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-db-url"
    Environment = var.environment
  }
}

# Application environment
resource "aws_ssm_parameter" "app_environment" {
  name  = "/${var.project_name}/${var.environment}/app/environment"
  type  = "String"
  value = "production"
  
  description = "Application environment for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-app-environment"
    Environment = var.environment
  }
}

# Firebase client config
resource "aws_ssm_parameter" "firebase_api_key" {
  count       = var.firebase_api_key != "" ? 1 : 0
  name        = "/${var.project_name}/${var.environment}/firebase/api_key"
  type        = "String"
  value       = var.firebase_api_key
  description = "Firebase API key for web client"
  tags        = { Name = "${var.project_name}-firebase-api-key", Environment = var.environment }
}

resource "aws_ssm_parameter" "firebase_auth_domain" {
  count       = var.firebase_auth_domain != "" ? 1 : 0
  name        = "/${var.project_name}/${var.environment}/firebase/auth_domain"
  type        = "String"
  value       = var.firebase_auth_domain
  description = "Firebase auth domain"
  tags        = { Name = "${var.project_name}-firebase-auth-domain", Environment = var.environment }
}

resource "aws_ssm_parameter" "firebase_project_id" {
  count       = var.firebase_project_id != "" ? 1 : 0
  name        = "/${var.project_name}/${var.environment}/firebase/project_id"
  type        = "String"
  value       = var.firebase_project_id
  description = "Firebase project ID"
  tags        = { Name = "${var.project_name}-firebase-project-id", Environment = var.environment }
}

resource "aws_ssm_parameter" "firebase_app_id" {
  count       = var.firebase_app_id != "" ? 1 : 0
  name        = "/${var.project_name}/${var.environment}/firebase/app_id"
  type        = "String"
  value       = var.firebase_app_id
  description = "Firebase web app ID"
  tags        = { Name = "${var.project_name}-firebase-app-id", Environment = var.environment }
}

# Service account JSON is sensitive and often passed via -var at apply time, not stored in tfvars.
# Count is based on Firebase being configured (firebase_project_id) so the parameter is not
# destroyed when the JSON var is empty. Value is ignored after create so we don't overwrite
# the secret when running plan/apply without -var "firebase_service_account_json=...".
# To set or rotate the secret: pass -var at apply, or use: aws ssm put-parameter --overwrite ...
resource "aws_ssm_parameter" "firebase_service_account_json" {
  count       = var.firebase_project_id != "" ? 1 : 0
  name        = "/${var.project_name}/${var.environment}/firebase/service_account_json"
  type        = "SecureString"
  value       = var.firebase_service_account_json
  description = "Firebase Admin SDK service account JSON"
  tags        = { Name = "${var.project_name}-firebase-service-account", Environment = var.environment }

  lifecycle {
    ignore_changes = [value]
  }
}

# Application port
resource "aws_ssm_parameter" "app_port" {
  name  = "/${var.project_name}/${var.environment}/app/port"
  type  = "String"
  value = "3000"
  
  description = "Application port for ${var.project_name}"
  
  tags = {
    Name        = "${var.project_name}-app-port"
    Environment = var.environment
  }
}

# CloudFront CDN base URL for card image delivery
# Set automatically from the CloudFront distribution output after terraform apply.
# The application reads this at startup via /js/app-config.js to prefix card image paths.
resource "aws_ssm_parameter" "cdn_base_url" {
  name  = "/${var.project_name}/${var.environment}/app/cdn_base_url"
  type  = "String"
  value = "https://${aws_cloudfront_distribution.card_images.domain_name}"

  description = "CloudFront CDN base URL for card images (excelsior.cards)"

  tags = {
    Name        = "${var.project_name}-cdn-base-url"
    Environment = var.environment
  }
}

# -----------------------------------------------------------------------------
# JWT signing secret for /api/v1 (Bearer tokens) — NOT managed by Terraform.
# Production requires JWT_SECRET in the container env when NODE_ENV=production.
# Path (default Terraform vars): /op-deckbuilder/dev/app/jwt_secret (SecureString).
# Create manually when reviving infra; see docs/current/DEPLOYMENT.md
# (API v1 / JWT, infrastructure revival checklist).
# -----------------------------------------------------------------------------
