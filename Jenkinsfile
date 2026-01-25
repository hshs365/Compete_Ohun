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
        sshagent(credentials: ['web1-ssh']) {
          sh '''
            set -euo pipefail
            ssh -o StrictHostKeyChecking=no ${WEB_USER}@${WEB1_HOST} '
              set -euo pipefail
              cd ${APP_DIR}
              git checkout ${DEPLOY_BRANCH}
              git pull --ff-only origin ${DEPLOY_BRANCH}
              cd ${BACKEND_DIR}
              npm ci
              pm2 describe backend >/dev/null 2>&1 || pm2 start npm --name backend --cwd ${BACKEND_DIR} -- run start:dev
              pm2 restart backend --update-env
              if [ "${DEPLOY_CLIENT}" = "true" ]; then
                cd ${CLIENT_DIR}
                npm ci
                pm2 describe frontend >/dev/null 2>&1 || pm2 start npm --name frontend --cwd ${CLIENT_DIR} -- run dev -- --host 0.0.0.0 --port 5173
                pm2 restart frontend --update-env
              fi
            '
          '''
        }
      }
    }
  }
}
