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

# Email forwarding DNS records for Amazon SES

# DKIM CNAME records for email authentication
resource "aws_route53_record" "dkim_1" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "xonnbcs2hhr4stwsl7jnwtjf4auqxews._domainkey.excelsior.cards"
  type    = "CNAME"
  ttl     = 300
  records = ["xonnbcs2hhr4stwsl7jnwtjf4auqxews.dkim.amazonses.com"]
}

resource "aws_route53_record" "dkim_2" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "o6afnxv46ggqws4xxexivbm4bd4dwcuq._domainkey.excelsior.cards"
  type    = "CNAME"
  ttl     = 300
  records = ["o6afnxv46ggqws4xxexivbm4bd4dwcuq.dkim.amazonses.com"]
}

resource "aws_route53_record" "dkim_3" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "o2ygfccjz4c6s7zfxqbo3tfr7vlu7s3u._domainkey.excelsior.cards"
  type    = "CNAME"
  ttl     = 300
  records = ["o2ygfccjz4c6s7zfxqbo3tfr7vlu7s3u.dkim.amazonses.com"]
}

# DMARC TXT record for email policy
resource "aws_route53_record" "dmarc" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_dmarc.excelsior.cards"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
}

# MX record to route mail to Amazon SES
resource "aws_route53_record" "mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "excelsior.cards"
  type    = "MX"
  ttl     = 3600
  records = ["10 inbound-smtp.us-west-2.amazonaws.com"]
}

# Optional: AAAA record for IPv6 (if you have IPv6 support)
# resource "aws_route53_record" "main_ipv6" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "excelsior.cards"
#   type    = "AAAA"
#   ttl     = 300
#   records = [aws_eip.app_eip.ipv6_addresses]
# }
