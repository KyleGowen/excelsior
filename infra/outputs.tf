# Consolidated outputs for OverPower Deckbuilder Infrastructure

# =============================================================================
# BASIC ACCOUNT INFO
# =============================================================================

output "aws_account_id" {
  description = "The AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "The AWS region"
  value       = data.aws_region.current.name
}

output "project_name" {
  description = "The name of the project"
  value       = var.project_name
}

# =============================================================================
# RDS DATABASE
# =============================================================================

output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = "${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}"
}

output "rds_database_name" {
  description = "The name of the database"
  value       = aws_db_instance.postgres.db_name
}

output "rds_username" {
  description = "The master username for the database"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "rds_connection_string" {
  description = "Full connection string for the RDS instance"
  value       = "postgresql://${aws_db_instance.postgres.username}:${aws_db_instance.postgres.password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

output "rds_port" {
  description = "The port for the database"
  value       = aws_db_instance.postgres.port
}

# =============================================================================
# ECR DOCKER REGISTRY
# =============================================================================

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.app.arn
}

output "ecr_registry_id" {
  description = "ECR registry ID"
  value       = aws_ecr_repository.app.registry_id
}

output "docker_login_command" {
  description = "Docker login command for ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
}

output "docker_build_command" {
  description = "Docker build and push commands"
  value       = "docker build -t ${aws_ecr_repository.app.name}:latest . && docker tag ${aws_ecr_repository.app.name}:latest ${aws_ecr_repository.app.repository_url}:latest && docker push ${aws_ecr_repository.app.repository_url}:latest"
}

# =============================================================================
# NETWORKING & SECURITY
# =============================================================================

output "app_security_group_id" {
  description = "Security group ID for the app EC2"
  value       = aws_security_group.app_sg.id
}

output "app_elastic_ip" {
  description = "Allocated Elastic IP address for the app"
  value       = aws_eip.app_eip.public_ip
}

output "app_elastic_ip_allocation_id" {
  description = "Elastic IP allocation ID (used to associate with EC2/NAT)"
  value       = aws_eip.app_eip.id
}

# =============================================================================
# SSM PARAMETER STORE
# =============================================================================

output "ssm_db_host_parameter" {
  description = "SSM parameter name for database host"
  value       = aws_ssm_parameter.db_host.name
}

output "ssm_db_port_parameter" {
  description = "SSM parameter name for database port"
  value       = aws_ssm_parameter.db_port.name
}

output "ssm_db_name_parameter" {
  description = "SSM parameter name for database name"
  value       = aws_ssm_parameter.db_name.name
}

output "ssm_db_username_parameter" {
  description = "SSM parameter name for database username"
  value       = aws_ssm_parameter.db_username.name
}

output "ssm_db_password_parameter" {
  description = "SSM parameter name for database password"
  value       = aws_ssm_parameter.db_password.name
}

output "ssm_db_url_parameter" {
  description = "SSM parameter name for complete database URL"
  value       = aws_ssm_parameter.db_url.name
}

output "ssm_app_environment_parameter" {
  description = "SSM parameter name for application environment"
  value       = aws_ssm_parameter.app_environment.name
}

output "ssm_app_port_parameter" {
  description = "SSM parameter name for application port"
  value       = aws_ssm_parameter.app_port.name
}

# =============================================================================
# APPLICATION ACCESS
# =============================================================================

output "app_public_url" {
  description = "Public URL to access the application"
  value       = "http://${aws_eip.app_eip.public_ip}:3000"
}

output "app_http_url" {
  description = "HTTP URL to access the application"
  value       = "http://${aws_eip.app_eip.public_ip}:80"
}

output "app_https_url" {
  description = "HTTPS URL to access the application (once SSL is configured)"
  value       = "https://${aws_eip.app_eip.public_ip}:443"
}
