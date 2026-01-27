# PM2 관리 가이드

## 📋 PM2란?

PM2는 Node.js 프로세스 관리자로, 애플리케이션을 백그라운드에서 실행하고 자동 재시작, 로그 관리 등을 제공합니다.

## ⚠️ 주의사항

**PM2로 실행 중인 경우:**
- ❌ `npm run start:dev` 직접 실행 → 포트 충돌 발생!
- ✅ `pm2 restart backend` 사용

## 🔧 PM2 명령어

### 프로세스 상태 확인

```bash
# 실행 중인 프로세스 목록
pm2 list

# 특정 프로세스 상세 정보
pm2 describe backend

# 프로세스 모니터링 (실시간)
pm2 monit
```

### 프로세스 재시작

```bash
# 환경변수 업데이트와 함께 재시작 (권장)
pm2 restart backend --update-env

# 일반 재시작
pm2 restart backend

# 모든 프로세스 재시작
pm2 restart all
```

### 프로세스 중지/시작

```bash
# 프로세스 중지
pm2 stop backend

# 프로세스 시작
pm2 start backend

# 프로세스 삭제 (PM2에서 제거)
pm2 delete backend
```

### 로그 확인

```bash
# 실시간 로그 확인
pm2 logs backend

# 최근 50줄 로그
pm2 logs backend --lines 50

# 모든 프로세스 로그
pm2 logs

# 로그 지우기
pm2 flush
```

### 환경변수 관리

```bash
# 환경변수 확인
pm2 env 0  # 0은 프로세스 ID

# 환경변수 업데이트 후 재시작
pm2 restart backend --update-env

# .env 파일 변경 후
pm2 restart backend --update-env
```

## 🔄 환경변수 변경 시 재시작 방법

### 방법 1: .env 파일 수정 후 재시작 (권장)

```bash
# 1. .env 파일 수정
cd /home/webmaster/my-app/server
nano .env
# SMS_VERIFICATION_ENABLED=false 추가/수정

# 2. PM2로 재시작 (환경변수 업데이트)
pm2 restart backend --update-env

# 3. 확인
pm2 logs backend --lines 20
```

### 방법 2: PM2 설정 파일 사용

```bash
# ecosystem.config.js 파일 생성
pm2 ecosystem

# 설정 파일로 시작
pm2 start ecosystem.config.js

# 재시작
pm2 restart ecosystem.config.js
```

## 🚨 문제 해결

### 포트 충돌 에러

**증상:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**원인:**
- PM2로 실행 중인데 `npm run start:dev`를 직접 실행
- 또는 다른 프로세스가 포트 사용 중

**해결:**
```bash
# 1. PM2 프로세스 확인
pm2 list

# 2. PM2로 실행 중이면 PM2로 재시작
pm2 restart backend --update-env

# 3. PM2가 아닌 경우 포트 사용 프로세스 확인
lsof -i :3000
# 또는
netstat -tulpn | grep 3000

# 4. 프로세스 종료
kill -9 <PID>
```

### 환경변수 변경이 적용 안 됨

**원인:**
- PM2가 환경변수를 캐시하고 있음

**해결:**
```bash
# --update-env 플래그 사용
pm2 restart backend --update-env

# 또는 완전히 재시작
pm2 delete backend
pm2 start npm --name backend --cwd /home/webmaster/my-app/server -- run start:dev
```

## 📝 PM2 프로세스 관리

### 프로세스 시작

```bash
# 처음 시작
pm2 start npm --name backend --cwd /home/webmaster/my-app/server -- run start:dev

# 또는 ecosystem.config.js 사용
pm2 start ecosystem.config.js
```

### 자동 시작 설정 (서버 재부팅 시)

```bash
# 현재 PM2 프로세스 목록 저장
pm2 save

# 시스템 부팅 시 자동 시작 설정
pm2 startup
# 출력된 명령어 실행 (sudo 권한 필요)
```

### 프로세스 삭제

```bash
# 프로세스 중지 및 삭제
pm2 delete backend

# 모든 프로세스 삭제
pm2 delete all
```

## 🎯 현재 상황에서 재시작 방법

**서버에서 환경변수 변경 후:**

```bash
# 1. .env 파일 확인/수정
cd /home/webmaster/my-app/server
cat .env | grep SMS_VERIFICATION_ENABLED

# 2. 없으면 추가
echo "SMS_VERIFICATION_ENABLED=false" >> .env
echo "NODE_ENV=development" >> .env

# 3. PM2로 재시작 (환경변수 업데이트)
pm2 restart backend --update-env

# 4. 로그 확인
pm2 logs backend --lines 30
```

## ✅ 체크리스트

- [ ] PM2로 실행 중인지 확인: `pm2 list`
- [ ] .env 파일 수정 완료
- [ ] `pm2 restart backend --update-env` 실행
- [ ] 로그에서 환경변수 적용 확인
- [ ] 애플리케이션 정상 작동 확인
