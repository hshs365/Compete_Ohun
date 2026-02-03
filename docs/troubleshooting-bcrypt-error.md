# bcrypt 모듈 오류 해결 가이드

## 🚨 증상

- `Error: Cannot find module 'bcrypt/bcrypt.js'`
- Node.js v24 등 최신 버전에서 bcrypt를 찾을 수 없음

## 원인

`bcrypt`는 네이티브 모듈로, 플랫폼·Node 버전별로 컴파일이 필요합니다. `node_modules` 미설치/미빌드 또는 Node 버전 비호환 시 발생합니다.

---

## ✅ 해결 방법

### 1. 재빌드 (우선 시도)

```bash
cd server   # 또는 /home/webmaster/my-app/server
pm2 stop backend   # PM2 사용 시
npm rebuild bcrypt
pm2 start backend --update-env
```

### 2. bcrypt 최신 버전 + 재빌드

```bash
cd server
npm install bcrypt@latest
npm rebuild bcrypt
pm2 restart backend --update-env
```

### 3. node_modules 재설치

```bash
cd server
pm2 stop backend
rm -rf node_modules
npm ci
ls -la node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node  # 확인
pm2 start backend --update-env
```

### 4. dist 삭제 후 재시작 (캐시 문제 시)

```bash
cd server
pm2 stop backend
rm -rf dist
npm ci
pm2 start backend --update-env
```

### 5. Node.js 20 LTS 사용 (v24 호환 문제 시)

```bash
nvm install 20
nvm use 20
cd server
rm -rf node_modules dist
npm ci
pm2 restart backend --update-env
```

### 6. 완전 재설치 (위 방법으로 해결 안 될 때)

```bash
cd server
pm2 stop backend
rm -rf node_modules dist
npm ci
npm run build   # 필요 시
pm2 start backend --update-env
```

---

## 🔍 확인 사항

- `node --version` (권장: Node 18+)
- `ls node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node` (파일 존재 여부)
- Linux 서버: `build-essential`, `python3` 설치 후 `npm ci`

## Jenkins

파이프라인에서 `npm ci` 후 `npm rebuild bcrypt`를 한 줄 추가해 두면 유용합니다.
