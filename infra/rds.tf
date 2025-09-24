# RDS PostgreSQL Database for OverPower Deckbuilder
# This creates a PostgreSQL database accessible from outside AWS

# Data source for default VPC (we'll use this for now, can be replaced with custom VPC later)
data "aws_vpc" "default" {
  default = true
}

# Data source for default subnets
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security group for RDS - allows PostgreSQL access from anywhere
# WARNING: This allows access from the internet. In production, restrict this!
resource "aws_security_group" "rds_sg" {
  name_prefix = "${var.project_name}-rds-"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = data.aws_vpc.default.id

  # Allow PostgreSQL access from anywhere (0.0.0.0/0)
  # In production, restrict this to specific IP ranges or security groups
  ingress {
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL access from internet"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

# DB subnet group - uses default subnets
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  # Basic configuration
  identifier = "${var.project_name}-postgres"
  engine     = "postgres"
  engine_version = "16.4"  # Latest PostgreSQL version supported by RDS
  
  # Instance configuration
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"  # General Purpose SSD (gp3) - better performance than gp2
  storage_encrypted = true   # Encrypt storage at rest
  
  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = var.db_port
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = true  # Allows access from internet (required for external access)
  
  # Backup configuration
  backup_retention_period = 7  # Keep backups for 7 days (free tier allows up to 7 days)
  backup_window          = "03:00-04:00"  # UTC time
  maintenance_window     = "sun:04:00-sun:05:00"  # UTC time
  
  # Monitoring and logging
  monitoring_interval = 0  # Disable enhanced monitoring (not free tier)
  monitoring_role_arn = null
  
  # Performance Insights (disabled for free tier)
  performance_insights_enabled = false
  
  # Deletion protection (disabled for dev environment)
  deletion_protection = var.environment == "prod" ? true : false
  
  # Skip final snapshot for dev environment
  skip_final_snapshot = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  tags = {
    Name        = "${var.project_name}-postgres"
    Environment = var.environment
  }
}

