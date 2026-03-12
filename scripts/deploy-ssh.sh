#!/bin/bash
# Tailscale/SSH 배포: 서버에서 git pull → 빌드 → pm2 재시작
# 사용: 서버에 SSH 접속 후 /home/webmaster/my-app 에서
#   git pull && bash scripts/deploy-ssh.sh
set -e
APP_DIR="${APP_DIR:-/home/webmaster/my-app}"
cd "$APP_DIR"

echo "==> Server 빌드..."
cd server && npm ci && npm run build && cd ..

echo "==> Client 빌드..."
cd client && npm ci && npm run build && cd ..

echo "==> PM2 재시작..."
pm2 restart all --update-env

echo "==> 배포 완료."
pm2 list
