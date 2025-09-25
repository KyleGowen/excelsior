# Domain Setup Guide for excelsior.cards

This guide explains how to set up the `excelsior.cards` domain to point to your OverPower Deckbuilder application.

## Prerequisites

1. **Domain Registration**: You must own the `excelsior.cards` domain
2. **Route 53 Hosted Zone**: You need to create a Route 53 hosted zone for `excelsior.cards`
3. **Terraform**: Ensure you have Terraform installed and configured

## Step 1: Deploy Infrastructure with Terraform

The Route 53 hosted zone will be created automatically by Terraform. Simply run:

```bash
cd infra/
./deploy-domain.sh
```

**Important**: After Terraform completes, it will display the Route 53 name servers. You must update your domain registrar's DNS settings to use these name servers.

## Step 2: Update Domain Registrar

1. Log into your domain registrar (where you bought excelsior.cards)
2. Find the DNS/Name Server settings
3. Replace the current name servers with the Route 53 name servers from Step 1
4. Save the changes

**Note**: DNS propagation can take 24-48 hours, but usually happens within a few hours.

## Step 3: Verify Deployment

After updating your domain registrar, verify the deployment:

```bash
# Check if the hosted zone was created
terraform output dns_zone_id

# Check the name servers
terraform output dns_name_servers
```

## Step 4: Verify DNS Configuration

After DNS propagation, verify the DNS records:

```bash
# Check A record
dig excelsior.cards A

# Check CNAME record
dig www.excelsior.cards CNAME

# Test connectivity
curl -I http://excelsior.cards
```

## Step 5: SSL Certificate (Optional but Recommended)

For production use, you should enable SSL. There are several options:

### Option A: AWS Certificate Manager (ACM) - Recommended

1. Uncomment the ACM resources in `ssl.tf`
2. Set `enable_ssl = true` in your `terraform.tfvars`
3. Run `terraform apply`

### Option B: Let's Encrypt (Free)

1. SSH into your EC2 instance
2. Install Certbot
3. Generate certificates
4. Update nginx configuration

### Option C: Self-signed (Testing only)

Not recommended for production use.

## Configuration Files

### dns.tf
- Creates Route 53 A record pointing to your EC2 instance
- Creates CNAME record for www subdomain
- Handles IPv6 if needed

### nginx.tf
- Installs and configures nginx as a reverse proxy
- Routes traffic from port 80/443 to your application on port 3000
- Includes health check endpoints
- Configures log rotation

### ssl.tf
- Provides SSL certificate management options
- Supports AWS Certificate Manager
- Includes Let's Encrypt configuration template

## Architecture

```
Internet → Route 53 → EC2 Instance → Nginx (Port 80/443) → Docker App (Port 3000)
```

## Troubleshooting

### DNS Not Working
1. Check if Route 53 hosted zone exists
2. Verify name servers are updated at domain registrar
3. Wait for DNS propagation (up to 48 hours)
4. Use `dig` or `nslookup` to test DNS resolution

### Application Not Accessible
1. Check EC2 security groups allow HTTP/HTTPS traffic
2. Verify nginx is running: `systemctl status nginx`
3. Check application logs: `docker logs op-deckbuilder-app`
4. Test local connectivity: `curl http://localhost:3000`

### SSL Issues
1. Verify certificate is valid and not expired
2. Check nginx SSL configuration
3. Ensure security groups allow HTTPS traffic
4. Test with `openssl s_client -connect excelsior.cards:443`

## Monitoring

The configuration includes:
- Health check endpoints at `/health`
- Nginx access and error logs
- Application logs via Docker
- CloudWatch integration (if configured)

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Security Groups**: Only open necessary ports
3. **Updates**: Keep nginx and the application updated
4. **Monitoring**: Set up monitoring and alerting
5. **Backups**: Regular database backups

## Cost Optimization

- Use t3.micro instance for development
- Consider Reserved Instances for production
- Monitor Route 53 query costs
- Use CloudFront for static content caching (future enhancement)

## Next Steps

1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Add CloudFront for better performance
5. Set up SSL certificates
6. Configure log aggregation
