# SSL/TLS Configuration for excelsior.cards
# This file provides options for SSL certificate management

# Option 1: AWS Certificate Manager (ACM) - Recommended for production
# Uncomment the following resources if you want to use ACM for SSL certificates

# resource "aws_acm_certificate" "main" {
#   domain_name       = "excelsior.cards"
#   subject_alternative_names = ["www.excelsior.cards"]
#   validation_method = "DNS"

#   lifecycle {
#     create_before_destroy = true
#   }

#   tags = {
#     Name = "${var.project_name}-ssl-cert"
#   }
# }

# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }

#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = data.aws_route53_zone.main.zone_id
# }

# resource "aws_acm_certificate_validation" "main" {
#   certificate_arn         = aws_acm_certificate.main.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
# }

# Option 2: Let's Encrypt with Certbot (for free SSL certificates)
# This would require additional configuration in the user data script

# Option 3: Self-signed certificates (for testing only)
# This is not recommended for production use

# Note: SSL variables and outputs are defined in variables.tf and outputs.tf
