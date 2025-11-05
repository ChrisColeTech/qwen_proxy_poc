# Qwen Proxy Backend - Deployment Guide

Complete guide for deploying the Qwen Proxy Backend in production environments.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
  - [Docker Deployment](#docker-deployment)
  - [PM2 Deployment](#pm2-deployment)
  - [Systemd Service](#systemd-service)
  - [Manual Deployment](#manual-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Performance Tuning](#performance-tuning)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## System Requirements

### Minimum Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, Alpine)
- **Node.js**: >= 18.0.0 LTS
- **RAM**: 512 MB minimum, 1 GB recommended
- **Disk**: 1 GB free space
- **Network**: Internet connection to chat.qwen.ai
- **CPU**: 1 core minimum, 2+ cores recommended

### Recommended Production Setup

- **RAM**: 2 GB+
- **CPU**: 2-4 cores
- **Disk**: SSD with 10 GB+ free space
- **Network**: Low latency connection (<100ms to Qwen API)

### Software Dependencies

- Node.js 18+ or 20 LTS
- npm or yarn
- Git (for deployment)
- Optional: Docker, PM2, nginx, Prometheus, Grafana

---

## Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-repo/qwen-proxy.git
cd qwen-proxy/backend

# Or if deploying from a specific release
git clone --branch v1.0.0 https://github.com/your-repo/qwen-proxy.git
cd qwen-proxy/backend
```

### 2. Install Dependencies

```bash
# Install production dependencies
npm ci --only=production

# Or for development
npm install
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your credentials and settings
nano .env.production
```

**Required Configuration:**

```bash
QWEN_TOKEN=your_actual_token_here
QWEN_COOKIES=your_actual_cookies_here
```

See [Configuration](#configuration) section for all available options.

### 4. Verify Installation

```bash
# Test configuration
npm run validate-config

# Expected output:
# Configuration is valid!
```

---

## Configuration

### Environment Variables Reference

#### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment: `development`, `production`, `test` |
| `PORT` | `3000` | HTTP server port |
| `TRUST_PROXY` | `false` | Set to `true` if behind reverse proxy |

#### Qwen API Authentication (REQUIRED)

| Variable | Required | Description |
|----------|----------|-------------|
| `QWEN_TOKEN` | **Yes** | The `bx-umidtoken` header value from browser |
| `QWEN_COOKIES` | **Yes** | Complete Cookie header from browser |

**How to get credentials:**

1. Open https://chat.qwen.ai in Chrome/Firefox
2. Log in to your account
3. Open DevTools (F12) → Network tab
4. Send a message in the chat
5. Find the `/chat/completions` request
6. Copy the `bx-umidtoken` header → `QWEN_TOKEN`
7. Copy the entire `Cookie` header → `QWEN_COOKIES`

#### Security Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ENABLED` | `false` | Enable CORS middleware |
| `CORS_ORIGIN` | `*` | Allowed origins (comma-separated) |
| `CORS_CREDENTIALS` | `false` | Allow credentials in CORS requests |

#### Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level: `error`, `warn`, `info`, `debug` |
| `LOG_PRETTY` | `false` | Pretty print logs (use `false` in production) |

#### Session Management

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_TIMEOUT` | `1800000` | Session timeout (ms) - 30 minutes |
| `SESSION_CLEANUP_INTERVAL` | `600000` | Cleanup interval (ms) - 10 minutes |

#### Retry Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RETRY_MAX_ATTEMPTS` | `3` | Maximum retry attempts |
| `RETRY_INITIAL_DELAY` | `1000` | Initial retry delay (ms) |
| `RETRY_MAX_DELAY` | `10000` | Maximum retry delay (ms) |
| `RETRY_BACKOFF_MULTIPLIER` | `2` | Exponential backoff multiplier |

#### Cache Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MODELS_CACHE_DURATION` | `3600000` | Models cache duration (ms) - 1 hour |

---

## Deployment Options

### Docker Deployment

**Recommended for production** - Provides isolation, consistency, and easy scaling.

#### Single Container

```bash
# Build image
docker build -t qwen-proxy .

# Run container
docker run -d \
  --name qwen-proxy \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  qwen-proxy

# View logs
docker logs -f qwen-proxy

# Stop container
docker stop qwen-proxy
```

#### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f qwen-proxy

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

#### Docker with Monitoring Stack

Edit `docker-compose.yml` to uncomment Prometheus and Grafana services:

```bash
docker-compose up -d
```

Access:
- Proxy: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

---

### PM2 Deployment

**Best for Node.js clustering** - Provides load balancing across CPU cores.

#### Install PM2

```bash
npm install -g pm2
```

#### Start Application

```bash
# Load production environment
export $(cat .env.production | xargs)

# Start with PM2
pm2 start ecosystem.config.js --env production

# Or start directly
pm2 start src/index.js --name qwen-proxy -i max --env production
```

#### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs qwen-proxy

# Monitor resources
pm2 monit

# Restart
pm2 restart qwen-proxy

# Reload (zero-downtime)
pm2 reload qwen-proxy

# Stop
pm2 stop qwen-proxy

# Delete from PM2
pm2 delete qwen-proxy

# Save PM2 process list
pm2 save

# Auto-start on system boot
pm2 startup
# Follow the instructions shown
```

#### PM2 with Nginx

```bash
# Start multiple instances on different ports
pm2 start ecosystem.config.js --env production

# Configure nginx to load balance
sudo cp nginx.conf /etc/nginx/sites-available/qwen-proxy
sudo ln -s /etc/nginx/sites-available/qwen-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Systemd Service

**Best for traditional server deployments** - Integrates with system init.

#### 1. Create Service User

```bash
sudo useradd -r -s /bin/false qwen
```

#### 2. Deploy Application

```bash
# Copy application to /opt
sudo mkdir -p /opt/qwen-proxy
sudo cp -r . /opt/qwen-proxy/
cd /opt/qwen-proxy

# Install dependencies
sudo -u qwen npm ci --only=production

# Create logs directory
sudo mkdir -p /opt/qwen-proxy/logs
sudo chown -R qwen:qwen /opt/qwen-proxy
```

#### 3. Install Service

```bash
# Copy service file
sudo cp qwen-proxy.service /etc/systemd/system/

# Copy environment file
sudo cp .env.production /opt/qwen-proxy/.env.production
sudo chown qwen:qwen /opt/qwen-proxy/.env.production
sudo chmod 600 /opt/qwen-proxy/.env.production

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable qwen-proxy

# Start service
sudo systemctl start qwen-proxy
```

#### 4. Manage Service

```bash
# Check status
sudo systemctl status qwen-proxy

# View logs
sudo journalctl -u qwen-proxy -f

# Restart
sudo systemctl restart qwen-proxy

# Stop
sudo systemctl stop qwen-proxy

# Disable auto-start
sudo systemctl disable qwen-proxy
```

---

### Manual Deployment

For development or simple production setups.

```bash
# Set environment
export NODE_ENV=production
export $(cat .env.production | xargs)

# Start server
node src/index.js

# Or with process manager
nohup node src/index.js > logs/output.log 2>&1 &

# Or with screen/tmux
screen -S qwen-proxy
node src/index.js
# Ctrl+A, D to detach
```

---

## Reverse Proxy Setup

### Nginx (Recommended)

#### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. Configure Nginx

```bash
# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/qwen-proxy

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/qwen-proxy /etc/nginx/sites-enabled/

# Edit configuration
sudo nano /etc/nginx/sites-available/qwen-proxy

# Update:
# - server_name: your-domain.com
# - SSL certificate paths
# - Upstream servers

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### 3. Enable Nginx

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Caddy (Alternative)

Caddy provides automatic HTTPS with Let's Encrypt.

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddyfile
cat > /etc/caddy/Caddyfile << EOF
your-domain.com {
    reverse_proxy localhost:3000
}
EOF

# Reload Caddy
sudo systemctl reload caddy
```

---

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Free)

#### With Certbot (Nginx)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

#### With Certbot (Standalone)

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com

# Start nginx
sudo systemctl start nginx

# Update nginx.conf with certificate paths:
# ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
sudo mkdir -p /etc/ssl/qwen-proxy
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/qwen-proxy/selfsigned.key \
  -out /etc/ssl/qwen-proxy/selfsigned.crt

# Update nginx.conf
# ssl_certificate /etc/ssl/qwen-proxy/selfsigned.crt;
# ssl_certificate_key /etc/ssl/qwen-proxy/selfsigned.key;
```

### Option 3: Commercial Certificate

1. Purchase SSL certificate from provider
2. Download certificate files (`.crt`, `.key`, `.ca-bundle`)
3. Copy to `/etc/ssl/certs/` and `/etc/ssl/private/`
4. Update nginx configuration with paths
5. Reload nginx

---

## Monitoring Setup

### Prometheus + Grafana

#### 1. Install Prometheus

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Create prometheus.yml
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'qwen-proxy'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
EOF

# Start Prometheus
./prometheus --config.file=prometheus.yml
```

#### 2. Install Grafana

```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

#### 3. Configure Grafana

1. Access Grafana: http://localhost:3000
2. Login: admin/admin (change password)
3. Add Data Source → Prometheus → http://localhost:9090
4. Import dashboard or create custom dashboard

**Recommended Metrics to Monitor:**

- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Request count
- `qwen_api_calls_total` - Qwen API calls
- `qwen_api_errors_total` - API errors
- `active_sessions` - Active sessions
- `process_cpu_seconds_total` - CPU usage
- `nodejs_heap_size_used_bytes` - Memory usage

### Health Check Monitoring

#### Using curl

```bash
# Check health
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-29T...","uptime":3600,...}

# Create monitoring script
cat > /usr/local/bin/check-qwen-proxy.sh << 'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $response -eq 200 ]; then
  echo "OK: Qwen Proxy is healthy"
  exit 0
else
  echo "CRITICAL: Qwen Proxy is unhealthy (HTTP $response)"
  exit 2
fi
EOF

chmod +x /usr/local/bin/check-qwen-proxy.sh
```

#### Using systemd timer

```bash
# Create health check service
sudo cat > /etc/systemd/system/qwen-proxy-healthcheck.service << EOF
[Unit]
Description=Qwen Proxy Health Check

[Service]
Type=oneshot
ExecStart=/usr/local/bin/check-qwen-proxy.sh
EOF

# Create timer
sudo cat > /etc/systemd/system/qwen-proxy-healthcheck.timer << EOF
[Unit]
Description=Qwen Proxy Health Check Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

# Enable timer
sudo systemctl daemon-reload
sudo systemctl enable qwen-proxy-healthcheck.timer
sudo systemctl start qwen-proxy-healthcheck.timer
```

---

## Performance Tuning

### Node.js Tuning

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable HTTP keep-alive
# (Already enabled in axios configuration)

# Use cluster mode with PM2
pm2 start ecosystem.config.js -i max
```

### System Tuning

```bash
# Increase file descriptors
ulimit -n 65536

# Edit /etc/security/limits.conf
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Increase network buffers
sudo sysctl -w net.core.rmem_max=16777216
sudo sysctl -w net.core.wmem_max=16777216
sudo sysctl -w net.ipv4.tcp_rmem='4096 87380 16777216'
sudo sysctl -w net.ipv4.tcp_wmem='4096 65536 16777216'

# Make permanent in /etc/sysctl.conf
```

### Nginx Tuning

```nginx
# In nginx.conf http block
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 4096;
    use epoll;
}

http {
    # Keep-alive
    keepalive_timeout 65;
    keepalive_requests 100;

    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 10m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## Security Best Practices

### 1. Credential Protection

```bash
# Secure .env file permissions
chmod 600 .env.production
chown qwen:qwen .env.production

# Never commit credentials to git
echo ".env*" >> .gitignore
```

### 2. Firewall Configuration

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct access to backend
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. Rate Limiting

Add to nginx configuration:

```nginx
# Define rate limit zone
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_status 429;
}

# Apply to location
location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ... other proxy settings
}
```

### 4. Security Headers

Already configured in nginx.conf:

- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-XSS-Protection` - XSS protection

### 5. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
npm audit
npm audit fix

# Update PM2
npm install -g pm2@latest
pm2 update
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
# PM2
pm2 logs qwen-proxy --lines 100

# Systemd
sudo journalctl -u qwen-proxy -n 100 -f

# Docker
docker logs qwen-proxy
```

**Common issues:**

1. **Missing credentials**
   ```
   Error: QWEN_TOKEN is required
   ```
   → Check `.env.production` file exists and contains valid credentials

2. **Port already in use**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   → Change PORT in .env or kill process using port 3000

3. **Permission denied**
   ```
   Error: EACCES: permission denied
   ```
   → Fix file permissions: `sudo chown -R qwen:qwen /opt/qwen-proxy`

### API Errors

**Check Qwen API connectivity:**
```bash
curl -v https://chat.qwen.ai/api/models \
  -H "Cookie: YOUR_COOKIES"
```

**Verify credentials:**
1. Credentials may expire - re-extract from browser
2. Check token format (should be long string)
3. Check cookies include all required values

### Performance Issues

**Check resource usage:**
```bash
# CPU and memory
top
htop

# Node.js specific
pm2 monit

# Network
netstat -an | grep 3000
```

**Check metrics:**
```bash
curl http://localhost:3000/metrics
```

### Memory Leaks

**Monitor memory:**
```bash
# View heap usage
pm2 monit

# Or check metrics
curl http://localhost:3000/metrics | grep nodejs_heap
```

**Fix:**
- Increase memory limit: `--max-old-space-size=2048`
- Restart service regularly
- Check session cleanup is working

### Connection Timeouts

**Increase timeouts:**
```bash
# In .env.production
REQUEST_TIMEOUT=60000  # 60 seconds

# In nginx.conf
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

## Maintenance

### Regular Tasks

#### Daily

- Check service status
- Review error logs
- Monitor metrics

```bash
# Health check
curl http://localhost:3000/health

# Error logs
sudo journalctl -u qwen-proxy --since "1 day ago" | grep ERROR
```

#### Weekly

- Review API usage
- Check disk space
- Rotate logs

```bash
# Disk space
df -h

# Log rotation (if using logrotate)
sudo logrotate -f /etc/logrotate.d/qwen-proxy
```

#### Monthly

- Update dependencies
- Review security advisories
- Performance analysis

```bash
# Update dependencies
npm audit
npm update

# Check for outdated packages
npm outdated
```

### Backup and Recovery

**Backup configuration:**
```bash
# Backup .env file
sudo cp /opt/qwen-proxy/.env.production /backup/qwen-proxy-env-$(date +%Y%m%d).bak

# Backup entire application
sudo tar -czf /backup/qwen-proxy-$(date +%Y%m%d).tar.gz /opt/qwen-proxy
```

**Restore:**
```bash
# Restore from backup
sudo tar -xzf /backup/qwen-proxy-20251029.tar.gz -C /
sudo systemctl restart qwen-proxy
```

### Upgrading

```bash
# Backup current version
sudo cp -r /opt/qwen-proxy /opt/qwen-proxy.backup

# Pull new version
cd /opt/qwen-proxy
git pull origin main

# Install dependencies
npm ci --only=production

# Restart service
sudo systemctl restart qwen-proxy

# Verify
curl http://localhost:3000/health
```

---

## Additional Resources

- [Project README](README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Testing Checklist](TESTING_CHECKLIST.md)

---

## Support

For issues and questions:

- GitHub Issues: https://github.com/your-repo/qwen-proxy/issues
- Documentation: https://github.com/your-repo/qwen-proxy/wiki
- Email: support@your-domain.com
