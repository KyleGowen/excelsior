# ECR (Elastic Container Registry) for OverPower Deckbuilder Docker Images
# This creates a private Docker registry to store our application images

# ECR Repository for the main application
resource "aws_ecr_repository" "app" {
  name                 = "${var.project_name}-repo"
  image_tag_mutability = "MUTABLE"  # Allows overwriting tags (useful for dev)
  
  # Image scanning configuration
  image_scanning_configuration {
    scan_on_push = true  # Automatically scan images for vulnerabilities
  }
  
  # Encryption configuration
  encryption_configuration {
    encryption_type = "AES256"  # Use AWS managed encryption
  }
  
  
  tags = {
    Name        = "${var.project_name}-ecr-repo"
    Environment = var.environment
  }
}

# ECR Lifecycle Policy - manages image retention
resource "aws_ecr_lifecycle_policy" "app_lifecycle" {
  repository = aws_ecr_repository.app.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ECR Repository Policy - allows cross-account access if needed
resource "aws_ecr_repository_policy" "app_policy" {
  repository = aws_ecr_repository.app.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

