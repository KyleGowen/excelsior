# Amazon SES Email Forwarding Infrastructure
# This sets up email forwarding from kyle@excelsior.cards to kyle.gowen@gmail.com
# Uses S3 + Lambda approach for reliable email forwarding

# S3 bucket to store incoming emails
resource "aws_s3_bucket" "email_storage" {
  bucket = "${var.project_name}-email-storage-${random_string.bucket_suffix.result}"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-email-storage"
  })
}

# Random suffix for S3 bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "email_storage" {
  bucket = aws_s3_bucket.email_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket lifecycle configuration to clean up old emails
resource "aws_s3_bucket_lifecycle_configuration" "email_storage" {
  bucket = aws_s3_bucket.email_storage.id

  rule {
    id     = "delete_old_emails"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

# S3 bucket policy to allow SES to write incoming emails
resource "aws_s3_bucket_policy" "email_storage" {
  bucket = aws_s3_bucket.email_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSESPuts"
        Effect = "Allow"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.email_storage.arn}/*"
        Condition = {
          StringEquals = {
            "aws:Referer" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket.email_storage]
}

# SES Receipt Rule Set
resource "aws_ses_receipt_rule_set" "email_forwarding" {
  rule_set_name = "${var.project_name}-email-forwarding"
}

# SES Receipt Rule for kyle@excelsior.cards
resource "aws_ses_receipt_rule" "kyle_forwarding" {
  name          = "kyle-forwarding"
  rule_set_name = aws_ses_receipt_rule_set.email_forwarding.rule_set_name
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Require"

  recipients = [var.forward_from_email]

  # First action: Save email to S3
  s3_action {
    bucket_name = aws_s3_bucket.email_storage.bucket
    position    = 1
  }

  # Second action: Invoke Lambda to forward email
  lambda_action {
    function_arn    = aws_lambda_function.email_forwarder.arn
    invocation_type = "Event"
    position        = 2
  }

  depends_on = [
    aws_s3_bucket_policy.email_storage,
    aws_ses_active_receipt_rule_set.email_forwarding,
    aws_lambda_function.email_forwarder,
    aws_lambda_permission.ses_lambda_permission
  ]
}

# Lambda function to process and forward emails
resource "aws_lambda_function" "email_forwarder" {
  filename         = "email_forwarder.zip"
  function_name    = "${var.project_name}-email-forwarder"
  role            = aws_iam_role.lambda_email_forwarder.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.email_forwarder_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      FORWARD_TO_EMAIL = var.forward_to_email
      FROM_EMAIL      = var.forward_from_email
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-email-forwarder"
  })
}

# Create the Lambda function code
data "archive_file" "email_forwarder_zip" {
  type        = "zip"
  output_path = "email_forwarder.zip"
  source {
    content = file("${path.module}/email_forwarder.js")
    filename = "index.js"
  }
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_email_forwarder" {
  name = "${var.project_name}-lambda-email-forwarder"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-email-forwarder"
  })
}

# IAM policy for Lambda to send emails via SES and read from S3
resource "aws_iam_policy" "lambda_email_forwarder_policy" {
  name        = "${var.project_name}-lambda-email-forwarder-policy"
  description = "Policy for Lambda to send emails via SES and read from S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.email_storage.arn}/*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-email-forwarder-policy"
  })
}

# Attach email forwarder policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_email_forwarder_policy" {
  role       = aws_iam_role.lambda_email_forwarder.name
  policy_arn = aws_iam_policy.lambda_email_forwarder_policy.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_email_forwarder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Permission for SES to invoke Lambda (basic permission)
resource "aws_lambda_permission" "ses_lambda_permission" {
  statement_id  = "AllowExecutionFromSES"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_forwarder.function_name
  principal     = "ses.amazonaws.com"
  # Use rule set ARN initially, will be updated after rule creation
  source_arn    = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:receipt-rule-set/${aws_ses_receipt_rule_set.email_forwarding.rule_set_name}"
}

# Additional permission with specific rule ARN (created after rule exists)
# Note: This will be created in a separate apply after the rule exists
resource "aws_lambda_permission" "ses_lambda_permission_rule" {
  statement_id  = "AllowExecutionFromSESRule"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_forwarder.function_name
  principal     = "ses.amazonaws.com"
  source_arn    = aws_ses_receipt_rule.kyle_forwarding.arn
  
  depends_on = [aws_ses_receipt_rule.kyle_forwarding]
  
  # This will be created in a separate apply
  count = 0
}

# S3 bucket notification to trigger Lambda when emails are stored
resource "aws_s3_bucket_notification" "email_forwarder_trigger" {
  bucket = aws_s3_bucket.email_storage.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.email_forwarder.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.s3_lambda_permission]
}

# Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "s3_lambda_permission" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_forwarder.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.email_storage.arn
}

# Set the active receipt rule set
resource "aws_ses_active_receipt_rule_set" "email_forwarding" {
  rule_set_name = aws_ses_receipt_rule_set.email_forwarding.rule_set_name
}
