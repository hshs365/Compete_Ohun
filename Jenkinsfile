pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
  }

  parameters {
    string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Deploy branch name')
    choice(name: 'ENVIRONMENT', choices: ['development', 'production'], description: 'Deploy environment')
    booleanParam(name: 'DEPLOY_WEB1', defaultValue: true, description: 'Deploy to web1')
    booleanParam(name: 'DEPLOY_CLIENT', defaultValue: false, description: 'Restart client dev server')
  }

  environment {
    WEB_USER = 'webmaster'
    WEB1_HOST = '192.168.132.185'
    APP_DIR = '/home/webmaster/my-app'
    BACKEND_DIR = "${APP_DIR}/server"
    CLIENT_DIR = "${APP_DIR}/client"
    DEPLOY_CLIENT = "${params.DEPLOY_CLIENT}"
    NODE_ENV = "${params.ENVIRONMENT}"
    SMS_VERIFICATION_ENABLED = "${params.ENVIRONMENT == 'production' ? 'true' : 'false'}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Deploy Web1') {
      when {
        expression { return params.DEPLOY_WEB1 }
      }
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: 'web1-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
          script {
            def deployClientValue = params.DEPLOY_CLIENT ? 'true' : 'false'
            sh """
            set -euo pipefail
            chmod 600 "\$SSH_KEY"
            ssh -i "\$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 "\$SSH_USER@\$WEB1_HOST" "APP_DIR='${APP_DIR}' BACKEND_DIR='${BACKEND_DIR}' CLIENT_DIR='${CLIENT_DIR}' DEPLOY_BRANCH='${params.DEPLOY_BRANCH}' DEPLOY_CLIENT='${deployClientValue}' NODE_ENV='${params.ENVIRONMENT}' SMS_VERIFICATION_ENABLED='${SMS_VERIFICATION_ENABLED}' bash -s" <<'REMOTE'
              set -euo pipefail
              trap 'echo \"REMOTE ERROR at line \$LINENO\"; exit 1' ERR
              set +x
              # Try to load nvm if present (non-login shells don't load it)
              if [ -s "\$HOME/.nvm/nvm.sh" ]; then
                . "\$HOME/.nvm/nvm.sh"
              fi
              NPM_PREFIX=""
              if command -v npm >/dev/null 2>&1; then
                NPM_PREFIX="\$(npm prefix -g 2>/dev/null || true)"
              fi
              NPM_BIN_DIR=""
              if [ -n "\$NPM_PREFIX" ]; then
                NPM_BIN_DIR="\${NPM_PREFIX}/bin"
              fi
              export PATH="\${NPM_BIN_DIR}:\$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:\$PATH"
              echo "[INFO] npm=\$(command -v npm || echo notfound)"
              PM2_BIN="\$(command -v pm2 || true)"
              if [ -z "\$PM2_BIN" ]; then
                for candidate in \
                  "/usr/bin/pm2" \
                  "/usr/local/bin/pm2" \
                  "\${NPM_BIN_DIR}/pm2" \
                  "/usr/lib/node_modules/pm2/bin/pm2" \
                  "\$HOME/.npm-global/bin/pm2" \
                  "\$HOME/.nvm/versions/node"/*/bin/pm2; do
                  if [ -x "\$candidate" ]; then
                    PM2_BIN="\$candidate"
                    break
                  fi
                done
              fi
              if [ -z "\$PM2_BIN" ] || [ ! -x "\$PM2_BIN" ]; then
                echo "[ERROR] pm2 not found in PATH or npm global bin"
                exit 1
              fi
              cd "\$APP_DIR"
              echo "[INFO] Checking out branch: \$DEPLOY_BRANCH"
              git checkout "\$DEPLOY_BRANCH"
              echo "[INFO] Discarding local changes to match remote..."
              git reset --hard HEAD
              git clean -fd
              echo "[INFO] Pulling latest changes..."
              git pull --ff-only origin "\$DEPLOY_BRANCH"
              cd "\$BACKEND_DIR"
              echo "[INFO] Installing backend dependencies..."
              npm ci --silent
              echo "[INFO] Updating environment variables..."
              # .env 파일에 환경변수 추가/업데이트
              if [ -f .env ]; then
                # 기존 NODE_ENV, SMS_VERIFICATION_ENABLED 제거
                sed -i '/^NODE_ENV=/d' .env
                sed -i '/^SMS_VERIFICATION_ENABLED=/d' .env
              fi
              echo "NODE_ENV=\$NODE_ENV" >> .env
              echo "SMS_VERIFICATION_ENABLED=\$SMS_VERIFICATION_ENABLED" >> .env
              echo "[INFO] Environment: \$NODE_ENV, SMS Verification: \$SMS_VERIFICATION_ENABLED"
              echo "[INFO] Restarting backend..."
              "\$PM2_BIN" describe backend >/dev/null 2>&1 || "\$PM2_BIN" start npm --name backend --cwd "\$BACKEND_DIR" -- run start:dev
              "\$PM2_BIN" restart backend --update-env
              if [ "\$DEPLOY_CLIENT" = "true" ]; then
                echo "[INFO] Deploying client..."
                cd "\$CLIENT_DIR"
                npm ci --silent
                "\$PM2_BIN" describe frontend >/dev/null 2>&1 || "\$PM2_BIN" start npm --name frontend --cwd "\$CLIENT_DIR" -- run dev -- --host 0.0.0.0 --port 5173
                "\$PM2_BIN" restart frontend --update-env
              fi
              echo "[INFO] Deployment completed successfully"
REMOTE
            """
          }
        }
      }
    }
  }
}
