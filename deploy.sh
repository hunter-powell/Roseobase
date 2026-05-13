#!/bin/bash
# Roseobase Deployment Script
# Usage: ./deploy.sh [remote-user] [remote-host] [remote-path]

set -e  # Exit on error

# Configuration - edit these or pass as arguments
REMOTE_USER="${1:-your-username}"
REMOTE_HOST="${2:-your-server-ip}"
REMOTE_PATH="${3:-/opt/roseobase}"

echo "=========================================="
echo "Roseobase Deployment Script"
echo "=========================================="
echo "Remote: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
echo ""

# Step 1: Build
echo "📦 Step 1: Building frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build complete"
echo ""

# Step 2: Transfer files
echo "📤 Step 2: Transferring files to server..."
rsync -avz --progress \
  --include='dist/' \
  --include='src/server/' \
  --include='package.json' \
  --include='package-lock.json' \
  --exclude='*' \
  ./ \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "✅ Files transferred"
echo ""

# Step 3: Install dependencies and restart services
echo "🔧 Step 3: Setting up on remote server..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
  set -e
  cd ${REMOTE_PATH}

  echo "Installing dependencies..."
  npm install --production

  echo "Restarting backend server..."
  pm2 restart roseobase-api 2>/dev/null || pm2 start src/server/index.js --name roseobase-api --update-env

  echo "Reloading Apache..."
  sudo systemctl reload httpd

  echo "✅ Server updated"
EOF

echo ""
echo "=========================================="
echo "✅ Deployment complete!"
echo "Visit: http://${REMOTE_HOST}"
echo "=========================================="
