# 환경별 설정 가이드 (Dev/Prod)

## 📋 개요

환경변수 기반으로 개발(Development)과 운영(Production) 환경을 분리합니다.

## 🔧 환경변수 설정

### 개발 환경 (로컬 개발)

**server/.env:**
```env
NODE_ENV=development
SMS_VERIFICATION_ENABLED=false
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**client/.env:**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SMS_VERIFICATION_ENABLED=false
```

### 운영 환경 (서버)

**서버 .env 파일 (웹서버1):**
```env
NODE_ENV=production
SMS_VERIFICATION_ENABLED=true
DB_HOST=192.168.132.81
DB_PORT=5432
DB_USERNAME=ohun_admin
DB_PASSWORD=강력한_비밀번호
DB_NAME=ohun
PORT=3000
FRONTEND_URL=https://ohun.kr,https://www.ohun.kr
UPLOAD_DIR=/mnt/shared/uploads

# SMS 인증 (NCP SENS)
NCP_ACCESS_KEY=실제_액세스_키
NCP_SECRET_KEY=실제_시크릿_키
NCP_SMS_SERVICE_ID=실제_서비스_ID
NCP_SMS_SENDER=01012345678
```

**클라이언트 환경변수는 빌드 시점에 결정되므로:**
- 개발: `VITE_SMS_VERIFICATION_ENABLED=false`
- 운영: `VITE_SMS_VERIFICATION_ENABLED=true`

## 🚀 Jenkins 배포 시 환경 선택

### Jenkins 파이프라인 사용법

1. Jenkins 웹 UI에서 "파라미터와 함께 빌드" 클릭
2. **ENVIRONMENT** 파라미터 선택:
   - `development`: 개발 환경 (SMS 인증 비활성화)
   - `production`: 운영 환경 (SMS 인증 활성화)
3. 빌드 실행

### 자동 설정

Jenkins가 선택한 환경에 따라 자동으로 설정:
- `NODE_ENV`: 선택한 환경
- `SMS_VERIFICATION_ENABLED`: production일 때만 `true`

## 📝 환경별 동작

### 개발 환경 (development)

**특징:**
- ✅ SMS 인증 없이 회원가입 가능
- ✅ 모든 192.168.x.x origin 허용
- ✅ 상세한 로그 출력
- ✅ 빠른 개발 및 테스트

**SMS 인증:**
- 인증번호 요청 시 콘솔에 출력 (실제 SMS 발송 안 함)
- 회원가입 시 인증 완료 체크 생략

### 운영 환경 (production)

**특징:**
- ✅ SMS 인증 필수
- ✅ 특정 도메인만 허용 (ohun.kr, www.ohun.kr)
- ✅ 최소한의 로그 출력
- ✅ 보안 강화

**SMS 인증:**
- 실제 NCP SENS API로 SMS 발송
- 회원가입 시 인증 완료 필수

## 🔄 환경 전환 방법

### 로컬에서 개발 환경으로 실행

```bash
# 서버
cd server
# .env 파일에 NODE_ENV=development, SMS_VERIFICATION_ENABLED=false 설정
npm run start:dev

# 클라이언트
cd client
# .env 파일에 VITE_SMS_VERIFICATION_ENABLED=false 설정
npm run dev
```

### 서버에서 운영 환경으로 배포

**Jenkins에서:**
1. ENVIRONMENT: `production` 선택
2. 빌드 실행

**또는 수동으로:**
```bash
# 서버에서
cd /home/webmaster/my-app/server
# .env 파일 수정
nano .env
# NODE_ENV=production
# SMS_VERIFICATION_ENABLED=true
pm2 restart backend --update-env
```

## ✅ 확인 방법

### 개발 환경 확인

**서버 로그에서:**
```
[DEV MODE] SMS 인증번호 발송 (실제 발송 안 함): 010-1234-5678 - 123456
```

**회원가입:**
- SMS 인증 없이 바로 회원가입 가능

### 운영 환경 확인

**서버 로그에서:**
- SMS 발송 API 호출 로그 확인

**회원가입:**
- SMS 인증 필수
- 인증 완료 후에만 회원가입 가능

## 🎯 요약

| 항목 | 개발 환경 | 운영 환경 |
|------|----------|----------|
| **NODE_ENV** | `development` | `production` |
| **SMS 인증** | 비활성화 | 활성화 |
| **CORS** | 모든 192.168.x.x 허용 | 특정 도메인만 허용 |
| **로그** | 상세 | 최소 |
| **회원가입** | SMS 인증 없이 가능 | SMS 인증 필수 |
