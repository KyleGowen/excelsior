# Output values for the OverPower Deckbuilder infrastructure

# Application URLs
output "app_http_url" {
  description = "HTTP URL of the application"
  value       = "http://${var.domain_name}"
}

output "app_https_url" {
  description = "HTTPS URL of the application (if SSL is enabled)"
  value       = var.enable_ssl ? "https://${var.domain_name}" : null
}

output "app_public_url" {
  description = "Public URL of the application"
  value       = "http://${aws_eip.app_eip.public_ip}:3000"
}

# Infrastructure Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# EC2 Information
output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "ec2_instance_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_eip.app_eip.public_ip
}

output "ec2_instance_private_ip" {
  description = "EC2 instance private IP"
  value       = aws_instance.app.private_ip
}

output "ec2_instance_state" {
  description = "EC2 instance state"
  value       = aws_instance.app.instance_state
}

# Network Information
output "app_elastic_ip" {
  description = "Elastic IP address"
  value       = aws_eip.app_eip.public_ip
}

output "app_elastic_ip_allocation_id" {
  description = "Elastic IP allocation ID"
  value       = aws_eip.app_eip.id
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = aws_security_group.app_sg.id
}

# RDS Information
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = "${aws_db_instance.postgres.endpoint}"
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "rds_username" {
  description = "RDS username"
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "rds_connection_string" {
  description = "RDS connection string"
  value       = "postgresql://${aws_db_instance.postgres.username}:${var.rds_password}@${aws_db_instance.postgres.endpoint}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}

# ECR Information
output "ecr_registry_id" {
  description = "ECR registry ID"
  value       = aws_ecr_repository.app.registry_id
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.app.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

# Docker Commands
output "docker_login_command" {
  description = "Docker login command for ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
}

output "docker_build_command" {
  description = "Docker build and push command"
  value       = "docker build -t ${var.project_name}-repo:latest . && docker tag ${var.project_name}-repo:latest ${aws_ecr_repository.app.repository_url}:latest && docker push ${aws_ecr_repository.app.repository_url}:latest"
}

# SSM Parameters
output "ssm_db_host_parameter" {
  description = "SSM parameter for database host"
  value       = aws_ssm_parameter.db_host.name
}

output "ssm_db_port_parameter" {
  description = "SSM parameter for database port"
  value       = aws_ssm_parameter.db_port.name
}

output "ssm_db_name_parameter" {
  description = "SSM parameter for database name"
  value       = aws_ssm_parameter.db_name.name
}

output "ssm_db_username_parameter" {
  description = "SSM parameter for database username"
  value       = aws_ssm_parameter.db_username.name
}

output "ssm_db_password_parameter" {
  description = "SSM parameter for database password"
  value       = aws_ssm_parameter.db_password.name
}

output "ssm_db_url_parameter" {
  description = "SSM parameter for database URL"
  value       = aws_ssm_parameter.db_url.name
}

output "ssm_app_environment_parameter" {
  description = "SSM parameter for app environment"
  value       = aws_ssm_parameter.app_environment.name
}

output "ssm_app_port_parameter" {
  description = "SSM parameter for app port"
  value       = aws_ssm_parameter.app_port.name
}

# Domain Information
output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "dns_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "dns_name_servers" {
  description = "Route 53 name servers - configure these at your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

# SSL Information
output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate (if SSL is enabled)"
  value       = var.enable_ssl ? var.ssl_certificate_arn : null
}

# Note: Data source for current AWS account is defined in main.tf