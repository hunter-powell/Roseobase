# Deployment Guide: Roseobase to Remote Server

This guide walks you through deploying the Roseobase application to a remote hosting server.

## Prerequisites

### Local Machine
- Node.js and npm installed
- SSH access to your remote server
- Files ready to transfer

### Remote Server Requirements
- RHEL 8 (Red Hat Enterprise Linux 8) server
- Node.js (v16+) installed
- BLAST+ tools installed and in PATH
- Apache (for web server)
- PM2 or systemd (for process management)

## Step 1: Prepare Local Build

### 1.1 Install Missing Backend Dependencies

First, add Express and CORS to your `package.json`:

```bash
cd /Users/hunterpowell/Desktop/Roseobase
npm install express cors
```

### 1.2 Build the Frontend

```bash
npm run build
```

This creates a `dist/` directory with the production-ready frontend.

### 1.3 Verify Build Output

```bash
ls -la dist/
```

You should see `index.html` and an `assets/` directory.

## Step 2: Prepare Files for Transfer

Create a list of what needs to be transferred:

**Required files/directories:**
- `dist/` - Built frontend
- `src/server/` - Backend server code
- `package.json` - Dependencies
- `package-lock.json` - Locked dependency versions
- `blastdb/` - BLAST databases (may be large)
- `public/` - Public assets (if any)

## Step 3: Set Up Remote Server

### 3.1 SSH into Your Server

```bash
ssh username@your-server-ip
```

### 3.2 Create Application Directory

```bash
sudo mkdir -p /opt/roseobase
sudo chown $USER:$USER /opt/roseobase
cd /opt/roseobase
```

### 3.3 Install Node.js (if not installed)

**RHEL 8:**
```bash
# Install Node.js from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Or use dnf (RHEL 8 default)
sudo dnf install -y nodejs npm
```

**Verify:**
```bash
node --version
npm --version
```

### 3.4 Install BLAST+ Tools

```bash
# Download BLAST+
cd /tmp
wget https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/LATEST/ncbi-blast-*-x64-linux.tar.gz

# Extract
tar -xzf ncbi-blast-*-x64-linux.tar.gz

# Move to /usr/local
sudo mv ncbi-blast-*/bin/* /usr/local/bin/

# Verify
blastn -version
```

### 3.5 Install Apache

```bash
# Install Apache (httpd on RHEL)
sudo yum install -y httpd
# Or use dnf
sudo dnf install -y httpd

# Start and enable Apache
sudo systemctl start httpd
sudo systemctl enable httpd
```

### 3.6 Enable Required Apache Modules

```bash
# Enable proxy and rewrite modules for API proxying and React Router
# On RHEL, modules are enabled by editing /etc/httpd/conf.modules.d/00-base.conf
# or by creating a config file

# Create module configuration
sudo bash -c 'cat > /etc/httpd/conf.modules.d/00-proxy.conf << EOF
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
EOF'

# Verify modules are loaded
sudo httpd -M | grep -E 'proxy|rewrite|headers'

# Restart Apache
sudo systemctl restart httpd
```

### 3.7 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 4: Transfer Files to Server

### Option A: Using SCP (Simple)

From your local machine:

```bash
# Transfer built frontend
scp -r dist username@your-server-ip:/opt/roseobase/

# Transfer backend code
scp -r src/server username@your-server-ip:/opt/roseobase/src/

# Transfer package files
scp package.json package-lock.json username@your-server-ip:/opt/roseobase/

# Transfer BLAST databases (may take time - they're large)
scp -r blastdb username@your-server-ip:/opt/roseobase/

# Transfer public directory if it exists
scp -r public username@your-server-ip:/opt/roseobase/ 2>/dev/null || true
```

### Option B: Using rsync (Recommended - Faster)

From your local machine:

```bash
rsync -avz --progress \
  --include='dist/' \
  --include='src/server/' \
  --include='package.json' \
  --include='package-lock.json' \
  --include='blastdb/' \
  --include='public/' \
  --exclude='*' \
  /Users/hunterpowell/Desktop/Roseobase/ \
  username@your-server-ip:/opt/roseobase/
```

### Option C: Using Tarball (For Large Deployments)

From your local machine:

```bash
# Create tarball
tar -czf roseobase-deploy.tar.gz dist/ src/server/ package.json package-lock.json blastdb/ public/

# Transfer
scp roseobase-deploy.tar.gz username@your-server-ip:/tmp/

# Extract on server
ssh username@your-server-ip "cd /opt/roseobase && tar -xzf /tmp/roseobase-deploy.tar.gz && rm /tmp/roseobase-deploy.tar.gz"
```

## Step 5: Set Up Backend on Server

### 5.1 SSH into Server and Navigate to App

```bash
ssh username@your-server-ip
cd /opt/roseobase
```

### 5.2 Install Node.js Dependencies

```bash
npm install --production
```

This installs only production dependencies (not devDependencies).

### 5.3 Verify Backend Structure

```bash
ls -la src/server/
# Should show: index.js and blast-api.js
```

### 5.4 Test Backend Manually (Optional)

```bash
node src/server/index.js
```

You should see: `BLAST API server running on port 3001`

Press `Ctrl+C` to stop it.

### 5.5 Start Backend with PM2

```bash
# Start the backend server
pm2 start src/server/index.js --name roseobase-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the command output to run the suggested command
```

### 5.6 Verify Backend is Running

```bash
pm2 status
pm2 logs roseobase-api
```

Test the API:
```bash
curl http://localhost:3001/api/blast/blastdbs
```

## Step 6: Configure Apache

### 6.1 Create Apache Virtual Host Configuration

```bash
sudo nano /etc/httpd/conf.d/roseobase.conf
```

Add this configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com  # Replace with your domain or IP address
    DocumentRoot /opt/roseobase/dist

    # Explicit access for JBrowse genome/GFF files (avoids 403 on RHEL)
    <Directory /opt/roseobase/dist/genomes>
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>

    # Serve frontend static files
    <Directory /opt/roseobase/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router - serve index.html for all routes
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyRequests Off

    <Location /api>
        ProxyPass http://localhost:3001/api
        ProxyPassReverse http://localhost:3001/api

        # Headers for proper proxying
        ProxySet Host $host
        RequestHeader set X-Real-IP $remote_addr
        RequestHeader set X-Forwarded-For $proxy_add_x_forwarded_for
        RequestHeader set X-Forwarded-Proto $scheme

        # Increase timeout for BLAST queries (they can take time)
        ProxyTimeout 300
    </Location>

    # Cache static assets
    <DirectoryMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </DirectoryMatch>

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # Error and access logs
    ErrorLog /var/log/httpd/roseobase_error.log
    CustomLog /var/log/httpd/roseobase_access.log combined
</VirtualHost>
```

### 6.2 Test and Enable Apache Configuration

```bash
# Test Apache configuration
sudo httpd -t

# If test passes, restart Apache
sudo systemctl restart httpd

# Check Apache status
sudo systemctl status httpd
```

### 6.3 Set Proper Permissions

```bash
# Ensure Apache can read the files
# Apache runs as apache user on RHEL
sudo chown -R apache:apache /opt/roseobase/dist
sudo chmod -R 755 /opt/roseobase/dist

# Or if you want to keep your user ownership, add apache to your group
sudo usermod -a -G $USER apache
sudo chmod -R 775 /opt/roseobase/dist
```

### 6.4 Configure SELinux (RHEL 8)

RHEL 8 uses SELinux which may block Apache from accessing files or proxying. Configure SELinux:

```bash
# Check SELinux status
getenforce

# If SELinux is enforcing, set proper contexts
# Allow Apache to read files in /opt/roseobase
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/roseobase(/.*)?"
sudo restorecon -Rv /opt/roseobase

# Allow Apache to connect to backend on port 3001
sudo setsebool -P httpd_can_network_connect 1

# If you need to allow Apache to write (for logs, etc.)
sudo setsebool -P httpd_unified 1

# Verify contexts
ls -Z /opt/roseobase/dist/
```

**Note:** If SELinux is causing issues and you need a quick test, you can temporarily set it to permissive:
```bash
sudo setenforce 0  # Temporary - resets on reboot
# For permanent change (not recommended for production):
# sudo sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

### 6.5 Fix 403 Forbidden for `/genomes/` (JBrowse GFF/FASTA)

If `curl -I http://your-server/genomes/Assembly.gff` returns **403 Forbidden**, Apache is denying access. On RHEL this is usually SELinux or permissions.

**1. Set SELinux context** (do this first):

```bash
# Allow httpd to read everything under /opt/roseobase
sudo semanage fcontext -a -t httpd_sys_content_t "/opt/roseobase(/.*)?"
sudo restorecon -Rv /opt/roseobase

# Confirm genomes directory has the right context
ls -Z /opt/roseobase/dist/genomes/
# You should see httpd_sys_content_t on the files
```

If you get "already exists" for the semanage command, the context is already defined; just run `sudo restorecon -Rv /opt/roseobase`.

**2. Fix ownership and permissions:**

```bash
sudo chown -R apache:apache /opt/roseobase/dist
sudo chmod -R 755 /opt/roseobase/dist
```

**3. Explicit Apache access for `genomes`** (optional, if 403 persists): in your vhost, inside `<VirtualHost>`, add *before* the main `<Directory /opt/roseobase/dist>` block:

```apache
    <Directory /opt/roseobase/dist/genomes>
        Options -Indexes +FollowSymLinks
        Require all granted
    </Directory>
```

Then reload Apache: `sudo systemctl reload httpd` and test again with `curl -I http://172.22.162.45/genomes/Yoonia_vestfoldensis_SKA53.gff`.

**4. Check Apache error log** if it still fails:

```bash
sudo tail -20 /var/log/httpd/error_log
```

Look for an SELinux AVC denial (e.g. "avc: denied ... httpd_t ...") or "Permission denied".

## Step 7: Configure Firewall

### 7.1 Allow HTTP/HTTPS Traffic (RHEL 8 uses firewalld)

```bash
# Check firewall status
sudo systemctl status firewalld

# If firewalld is not running, start it
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-services
```

## Step 8: Test the Deployment

### 8.1 Test Frontend

Open your browser and visit:
- `http://your-server-ip` or `http://your-domain.com`

You should see the Roseobase homepage.

### 8.2 Test Backend API

```bash
# From server
curl http://localhost:3001/api/blast/blastdbs

# From your local machine
curl http://your-server-ip/api/blast/blastdbs
```

### 8.3 Test BLAST Search

Try a BLAST search from the web interface to ensure everything works.

## Step 9: Set Up HTTPS (Optional but Recommended)

### 9.1 Install Certbot (RHEL 8)

```bash
# Install EPEL repository first (if not already installed)
sudo yum install -y epel-release

# Install certbot
sudo yum install -y certbot python3-certbot-apache

# Or use dnf
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-apache
```

### 9.2 Obtain SSL Certificate

```bash
sudo certbot --apache -d your-domain.com
```

Follow the prompts. Certbot will automatically configure Apache for HTTPS.

### 9.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

## Step 10: Monitoring and Maintenance

### 10.1 Check Backend Status

```bash
pm2 status
pm2 logs roseobase-api
```

### 10.2 Check Apache Status

```bash
sudo systemctl status httpd
sudo tail -f /var/log/httpd/roseobase_error.log
sudo tail -f /var/log/httpd/roseobase_access.log
# Or general Apache logs
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/httpd/access_log
```

### 10.3 Restart Services

```bash
# Restart backend
pm2 restart roseobase-api

# Restart Apache
sudo systemctl restart httpd
```

## Updating the Application

When you make changes:

### 1. Build Locally

```bash
npm run build
```

### 2. Transfer Updated Files

```bash
# Transfer only changed files
rsync -avz --delete dist/ username@your-server-ip:/opt/roseobase/dist/

# If backend changed
rsync -avz src/server/ username@your-server-ip:/opt/roseobase/src/server/
```

### 3. Restart Services

```bash
ssh username@your-server-ip
pm2 restart roseobase-api
sudo systemctl reload httpd
```

## Troubleshooting

### Backend Won't Start

```bash
# Check PM2 logs
pm2 logs roseobase-api

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Verify BLAST is installed
which blastn
blastn -version

# Check BLAST databases
ls -la /opt/roseobase/blastdb/
```

### Frontend Not Loading

```bash
# Check Apache error logs
sudo tail -f /var/log/httpd/roseobase_error.log
sudo tail -f /var/log/httpd/error_log

# Verify file permissions
ls -la /opt/roseobase/dist/

# Test Apache configuration
sudo httpd -t

# Check if Apache is running
sudo systemctl status httpd
```

### API Requests Failing

```bash
# Test backend directly
curl http://localhost:3001/api/blast/blastdbs

# Check Apache proxy configuration
sudo cat /etc/httpd/conf.d/roseobase.conf

# Verify proxy modules are loaded
sudo httpd -M | grep proxy

# Check CORS (should be enabled in backend)
```

### BLAST Queries Failing

```bash
# Verify BLAST databases exist
ls -la /opt/roseobase/blastdb/*.nin

# Test BLAST manually
cd /opt/roseobase
echo ">test\nATGC" > /tmp/test.fasta
blastn -query /tmp/test.fasta -db blastdb/testdb -outfmt 6
```

## Quick Deployment Script

Create a deployment script on your local machine:

```bash
#!/bin/bash
# deploy.sh

REMOTE_USER="your-username"
REMOTE_HOST="your-server-ip"
REMOTE_PATH="/opt/roseobase"

echo "Building application..."
npm run build

echo "Transferring files..."
rsync -avz --progress \
  --include='dist/' \
  --include='src/server/' \
  --include='package.json' \
  --include='package-lock.json' \
  --exclude='*' \
  ./ \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "Installing dependencies and restarting services..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
  cd ${REMOTE_PATH}
  npm install --production
  pm2 restart roseobase-api || pm2 start src/server/index.js --name roseobase-api
  sudo systemctl reload httpd
EOF

echo "Deployment complete!"
echo "Visit: http://${REMOTE_HOST}"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Summary Checklist

- [ ] Built frontend locally (`npm run build`)
- [ ] Installed Express and CORS dependencies
- [ ] Set up remote server (Node.js, BLAST+, Apache, PM2)
- [ ] Transferred all files to server
- [ ] Installed Node.js dependencies on server
- [ ] Started backend with PM2
- [ ] Configured Apache
- [ ] Opened firewall ports
- [ ] Tested frontend and backend
- [ ] Set up HTTPS (optional)
- [ ] Verified BLAST functionality

Your application should now be live and accessible!
