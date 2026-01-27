# Jenkins 배포 자동화 가이드

이 문서는 `Jenkinsfile`을 이용해 웹서버1/웹서버2에 자동 배포하는 절차를 정리합니다.

## 전제 조건
- Jenkins 에이전트에서 `ssh`와 `git` 사용 가능
- 웹서버1/웹서버2에서 `git`, `node`, `npm`, `pm2` 사용 가능
- 서버 코드 위치: `/home/webmaster/my-app`

## Jenkins 자격 증명 등록
Jenkins > **Credentials**에 아래 두 개를 등록합니다.
- `web1-ssh`: 웹서버1 SSH 키
- `web2-ssh`: 웹서버2 SSH 키

## 파이프라인 생성
1. Jenkins에서 새로운 **Pipeline** 생성
2. SCM에서 이 레포를 연결
3. 스크립트 경로는 레포 루트의 `Jenkinsfile` 사용

## 파라미터 설명
- `DEPLOY_BRANCH`: 배포할 브랜치 (기본 `main`)
- `DEPLOY_WEB1`: 웹서버1 배포 여부
- `DEPLOY_WEB2`: 웹서버2 배포 여부
- `DEPLOY_CLIENT`: 프론트 dev 서버 재시작 여부

## 동작 요약
- 대상 서버에서 `git checkout` → `git pull --ff-only`
- `server` 폴더에서 `npm ci` 후 `pm2 restart backend1/2 --update-env`
- 옵션으로 `client` 폴더에서 `npm ci` 후 `pm2 restart frontend1/2 --update-env`

## 주의 사항
- 서버에 미커밋 변경이 있으면 `git pull`이 실패합니다.
- 운영에서는 dev 서버 대신 정적 빌드/서빙 구조로 전환을 권장합니다.
- 웹서버 사용자명과 경로가 다르면 `Jenkinsfile`의 `WEB_USER`, `APP_DIR`를 수정하세요.
