# Networking for public access to the application

# Security Group for the application (EC2)
resource "aws_security_group" "app_sg" {
  name_prefix = "${var.project_name}-app-"
  description = "Security group for app EC2 to allow HTTP/HTTPS and app port"
  vpc_id      = data.aws_vpc.default.id

  # Allow HTTP (80)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  # Allow HTTPS (443)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS"
  }

  # Allow app port (3000) for direct access/testing
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow app port"
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name        = "${var.project_name}-app-sg"
    Environment = var.environment
  }
}

# Elastic IP for stable public URL
resource "aws_eip" "app_eip" {
  domain = "vpc"
  # Association to EC2 will be defined once EC2 exists; for now, allocate

  tags = {
    Name        = "${var.project_name}-eip"
    Environment = var.environment
  }
}

