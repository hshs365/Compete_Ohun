pipeline {
  agent any

  options {
    timestamps()
  }

  parameters {
    string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Deploy branch name')
    booleanParam(name: 'DEPLOY_WEB1', defaultValue: true, description: 'Deploy to web1')
    booleanParam(name: 'DEPLOY_CLIENT', defaultValue: false, description: 'Restart client dev server')
  }

  environment {
    WEB_USER = 'webmaster'
    WEB1_HOST = '192.168.132.185'
    APP_DIR = '/home/webmaster/my-app'
    BACKEND_DIR = "${APP_DIR}/server"
    CLIENT_DIR = "${APP_DIR}/client"
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
          sh '''
            set -euo pipefail
            chmod 600 "$SSH_KEY"
            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$WEB1_HOST" "APP_DIR='${APP_DIR}' BACKEND_DIR='${BACKEND_DIR}' CLIENT_DIR='${CLIENT_DIR}' DEPLOY_BRANCH='${DEPLOY_BRANCH}' DEPLOY_CLIENT='${DEPLOY_CLIENT}' bash -s" <<'REMOTE'
              set -euo pipefail
              NPM_BIN_DIR=""
              if command -v npm >/dev/null 2>&1; then
                NPM_BIN_DIR="$(npm bin -g 2>/dev/null || true)"
              fi
              export PATH="${NPM_BIN_DIR}:/usr/local/bin:/usr/bin:/bin:$PATH"
              echo "PATH=$PATH"
              echo "npm=$(command -v npm || echo notfound)"
              echo "npm bin -g=${NPM_BIN_DIR}"
              PM2_BIN="$(command -v pm2 || true)"
              if [ -z "$PM2_BIN" ] && [ -n "$NPM_BIN_DIR" ]; then
                PM2_BIN="${NPM_BIN_DIR}/pm2"
              fi
              if [ -z "$PM2_BIN" ] && [ -x /usr/bin/pm2 ]; then
                PM2_BIN=/usr/bin/pm2
              fi
              if [ -z "$PM2_BIN" ] || [ ! -x "$PM2_BIN" ]; then
                echo "pm2 not found in PATH or npm global bin"
                exit 1
              fi
              cd "$APP_DIR"
              git checkout "$DEPLOY_BRANCH"
              git pull --ff-only origin "$DEPLOY_BRANCH"
              cd "$BACKEND_DIR"
              npm ci
              "$PM2_BIN" describe backend >/dev/null 2>&1 || "$PM2_BIN" start npm --name backend --cwd "$BACKEND_DIR" -- run start:dev
              "$PM2_BIN" restart backend --update-env
              if [ "$DEPLOY_CLIENT" = "true" ]; then
                cd "$CLIENT_DIR"
                npm ci
                "$PM2_BIN" describe frontend >/dev/null 2>&1 || "$PM2_BIN" start npm --name frontend --cwd "$CLIENT_DIR" -- run dev -- --host 0.0.0.0 --port 5173
                "$PM2_BIN" restart frontend --update-env
              fi
REMOTE
          '''
        }
      }
    }
  }
}
