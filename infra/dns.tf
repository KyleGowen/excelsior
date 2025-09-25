# DNS Configuration for excelsior.cards domain

# Create Route 53 hosted zone for excelsior.cards
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-hosted-zone"
  })
}

# Data source to reference the hosted zone (for use in other resources)
data "aws_route53_zone" "main" {
  name         = aws_route53_zone.main.name
  private_zone = false
  depends_on   = [aws_route53_zone.main]
}

# A record pointing to the EC2 instance
resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "excelsior.cards"
  type    = "A"
  ttl     = 300
  records = [aws_eip.app_eip.public_ip]
}

# CNAME record for www subdomain
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.excelsior.cards"
  type    = "CNAME"
  ttl     = 300
  records = ["excelsior.cards"]
}

# Optional: AAAA record for IPv6 (if you have IPv6 support)
# resource "aws_route53_record" "main_ipv6" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "excelsior.cards"
#   type    = "AAAA"
#   ttl     = 300
#   records = [aws_eip.app_eip.ipv6_addresses]
# }
