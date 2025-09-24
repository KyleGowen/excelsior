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
  value = "postgresql://${aws_db_instance.postgres.username}:${aws_db_instance.postgres.password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}"
  
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
