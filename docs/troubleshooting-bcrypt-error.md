# bcrypt 모듈 오류 해결 가이드

## 🚨 문제

```
Error: Cannot find module 'bcrypt/bcrypt.js'
```

## 원인

`bcrypt`는 네이티브 모듈로, 플랫폼별로 컴파일이 필요합니다. 서버에서 `node_modules`가 제대로 설치되지 않았거나, 빌드가 필요한 경우 발생합니다.

## ✅ 해결 방법

### 서버에서 실행할 명령어 (권장)

**웹서버1(192.168.132.185)에서:**

```bash
# 1. 백엔드 디렉토리로 이동
cd /home/webmaster/my-app/server

# 2. PM2 프로세스 중지
pm2 stop backend

# 3. bcrypt 네이티브 모듈 재빌드
npm rebuild bcrypt

# 4. 빌드 확인
ls -la node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node

# 5. PM2 재시작
pm2 start backend --update-env

# 6. 로그 확인
pm2 logs backend --lines 30
```

### 방법 2: 완전 재설치 (방법 1이 실패할 경우)

```bash
# 1. PM2 프로세스 중지
pm2 stop backend

# 2. node_modules 삭제
cd /home/webmaster/my-app/server
rm -rf node_modules

# 3. 의존성 재설치
npm ci

# 4. bcrypt 네이티브 모듈 확인
ls -la node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node

# 5. PM2 재시작
pm2 start backend --update-env

# 6. 로그 확인
pm2 logs backend --lines 30
```

### bcrypt 네이티브 빌드 문제 해결

**만약 npm install이 실패한다면:**

```bash
# 빌드 도구 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install -y build-essential python3

# 다시 설치
npm install bcrypt --save

# 또는 전체 재설치
npm ci
```

### Node.js 버전 확인

```bash
# Node.js 버전 확인
node --version

# npm 버전 확인
npm --version

# bcrypt는 Node.js 14+ 필요
# 권장: Node.js 18 이상
```

## 🔍 추가 확인 사항

### 1. node_modules 확인

```bash
cd /home/webmaster/my-app/server
ls -la node_modules/bcrypt/
```

**정상 출력:**
```
drwxr-xr-x ... bcrypt
-rw-r--r-- ... package.json
drwxr-xr-x ... lib
-rw-r--r-- ... binding.gyp
```

### 2. 빌드된 파일 확인

```bash
# dist 폴더 확인 (빌드된 파일)
ls -la dist/src/users/users.service.js

# 파일이 있으면 bcrypt import 확인
grep -n "bcrypt" dist/src/users/users.service.js
```

### 3. PM2 프로세스 확인

```bash
# PM2 프로세스 상태
pm2 describe backend

# 환경변수 확인
pm2 env 0
```

## 🛠️ 완전 재설치 (최후의 수단)

```bash
# 1. PM2 프로세스 중지
pm2 stop backend
pm2 delete backend

# 2. node_modules 및 빌드 파일 삭제
cd /home/webmaster/my-app/server
rm -rf node_modules dist

# 3. 의존성 재설치
npm ci

# 4. 빌드 (필요한 경우)
npm run build

# 5. PM2로 다시 시작
pm2 start npm --name backend --cwd /home/webmaster/my-app/server -- run start:dev
pm2 save
```

## 📝 Jenkins 파이프라인 확인

Jenkinsfile에서 `npm ci`가 실행되는지 확인:

```groovy
cd "$BACKEND_DIR"
echo "[INFO] Installing backend dependencies..."
npm ci --silent
```

**문제가 있다면:**
- `npm ci` 대신 `npm install` 사용
- 또는 `npm rebuild bcrypt` 추가

## ✅ 예상 결과

정상 작동 시:
- `bcrypt` 모듈 로드 성공
- 서버 정상 시작
- 회원가입/로그인 기능 작동
