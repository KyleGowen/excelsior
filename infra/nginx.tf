# Nginx reverse proxy configuration for excelsior.cards

# Security group for nginx (HTTP and HTTPS)
resource "aws_security_group" "nginx" {
  name_prefix = "${var.project_name}-nginx-"
  vpc_id      = data.aws_vpc.default.id

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-nginx-sg"
  }
}

# User data script for nginx configuration
locals {
  nginx_user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y nginx

    # Create nginx configuration for excelsior.cards
    cat > /etc/nginx/conf.d/excelsior.cards.conf << 'NGINX_EOF'
    server {
        listen 80;
        server_name excelsior.cards www.excelsior.cards;

        # Redirect HTTP to HTTPS (optional, uncomment if you have SSL)
        # return 301 https://$server_name$request_uri;

        # For now, proxy to HTTP (port 3000)
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Increase timeout for long-running requests
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # Optional: HTTPS configuration (uncomment when you have SSL certificates)
    # server {
    #     listen 443 ssl http2;
    #     server_name excelsior.cards www.excelsior.cards;
    #
    #     ssl_certificate /etc/ssl/certs/excelsior.cards.crt;
    #     ssl_certificate_key /etc/ssl/private/excelsior.cards.key;
    #
    #     location / {
    #         proxy_pass http://localhost:3000;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade $http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #         proxy_cache_bypass $http_upgrade;
    #     }
    # }
    NGINX_EOF

    # Start and enable nginx
    systemctl start nginx
    systemctl enable nginx

    # Configure nginx to start after Docker
    systemctl enable nginx

    # Create a simple health check script
    cat > /usr/local/bin/health-check.sh << 'HEALTH_EOF'
    #!/bin/bash
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        echo "Nginx is not running"
        exit 1
    fi

    # Check if the application is responding
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "Application is not responding"
        exit 1
    fi

    echo "All services are healthy"
    exit 0
    HEALTH_EOF

    chmod +x /usr/local/bin/health-check.sh

    # Set up log rotation for nginx
    cat > /etc/logrotate.d/nginx << 'LOGROTATE_EOF'
    /var/log/nginx/*.log {
        daily
        missingok
        rotate 52
        compress
        delaycompress
        notifempty
        create 640 nginx adm
        sharedscripts
        postrotate
            if [ -f /var/run/nginx.pid ]; then
                kill -USR1 `cat /var/run/nginx.pid`
            fi
        endscript
    }
    LOGROTATE_EOF
  EOF
}

# Note: EC2 instance and security group configurations are handled in ec2.tf and networking.tf
# This file only contains nginx-specific resources
