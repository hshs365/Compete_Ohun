# SMS 인증 비활성화 설정 가이드

## 🎯 목적

개발 환경에서 SMS 인증 없이 회원가입을 가능하게 합니다.

## ✅ 완료된 수정 사항

### 서버
- ✅ `auth.service.ts`: SMS 인증 활성화 여부에 따라 검증 분기
- ✅ `phone-verification.service.ts`: 개발 환경에서 콘솔 출력만 (실제 SMS 발송 안 함)
- ✅ `register.dto.ts`: `verificationCode`를 선택적 필드로 변경

### 클라이언트
- ✅ `RegisterPage.tsx`: 환경변수로 SMS 인증 활성화 여부 제어
- ✅ `MultiStepRegister.tsx`: SMS 인증 비활성화 시 인증 체크 생략
- ✅ `Step4PhoneVerification.tsx`: SMS 인증 비활성화 시 자동 인증 완료 처리

## 🔧 서버 환경변수 설정

### 서버에서 실행할 명령어

**웹서버1(192.168.132.185)에서:**

```bash
# 1. 백엔드 디렉토리로 이동
cd /home/webmaster/my-app/server

# 2. .env 파일 확인
cat .env | grep SMS_VERIFICATION_ENABLED

# 3. .env 파일에 환경변수 추가 (없으면)
echo "SMS_VERIFICATION_ENABLED=false" >> .env
echo "NODE_ENV=development" >> .env

# 4. .env 파일 확인
cat .env | grep -E "SMS_VERIFICATION_ENABLED|NODE_ENV"

# 5. PM2 재시작 (환경변수 업데이트)
pm2 restart backend --update-env

# 6. 환경변수 확인
pm2 env 0 | grep SMS_VERIFICATION_ENABLED

# 7. 로그 확인
pm2 logs backend --lines 20
```

**예상 출력:**
```
SMS_VERIFICATION_ENABLED=false
NODE_ENV=development
```

## 🔧 클라이언트 환경변수 설정

### 로컬 개발 환경

**client/.env 파일:**
```env
VITE_SMS_VERIFICATION_ENABLED=false
```

**클라이언트 재시작:**
```powershell
# 로컬에서
cd client
npm run dev
```

### 서버 환경 (운영)

**서버에서 클라이언트 빌드 시:**
- 빌드 시점에 환경변수가 결정됨
- `.env` 파일을 빌드 전에 설정해야 함

## 🧪 테스트 방법

### 1. 서버 환경변수 확인

**서버에서:**
```bash
pm2 env 0 | grep SMS_VERIFICATION_ENABLED
# 출력: SMS_VERIFICATION_ENABLED=false
```

### 2. 클라이언트 환경변수 확인

**브라우저 콘솔에서:**
```javascript
console.log(import.meta.env.VITE_SMS_VERIFICATION_ENABLED)
// 출력: "false"
```

### 3. 회원가입 테스트

1. `http://ohun.kr/register` 또는 `http://192.168.132.185:5173/register` 접속
2. 회원가입 진행
3. 전화번호 입력 단계에서:
   - SMS 인증이 비활성화된 경우: 전화번호만 입력하면 자동으로 인증 완료
   - "SMS 인증이 비활성화되어 있습니다" 메시지 표시
4. 다음 단계로 진행 가능

## 🐛 문제 해결

### 문제 1: 여전히 SMS 인증 요구

**원인:**
- 서버의 .env 파일에 `SMS_VERIFICATION_ENABLED=false`가 없음
- PM2가 환경변수를 업데이트하지 않음

**해결:**
```bash
# 서버에서
cd /home/webmaster/my-app/server
echo "SMS_VERIFICATION_ENABLED=false" >> .env
pm2 restart backend --update-env
pm2 logs backend --lines 10
```

### 문제 2: 클라이언트에서 환경변수 읽지 못함

**원인:**
- 클라이언트가 재시작되지 않음
- .env 파일이 잘못된 위치에 있음

**해결:**
```powershell
# 로컬에서
cd client
# .env 파일 확인
cat .env
# 클라이언트 재시작
npm run dev
```

### 문제 3: "Failed to fetch" 에러

**원인:**
- 서버가 실행되지 않음
- CORS 문제
- 네트워크 연결 문제

**해결:**
```bash
# 서버 상태 확인
pm2 list
pm2 logs backend --lines 20

# 서버 재시작
pm2 restart backend --update-env
```

## ✅ 최종 확인 체크리스트

- [ ] 서버 .env에 `SMS_VERIFICATION_ENABLED=false` 설정
- [ ] 서버 .env에 `NODE_ENV=development` 설정
- [ ] 클라이언트 .env에 `VITE_SMS_VERIFICATION_ENABLED=false` 설정
- [ ] PM2 재시작 완료 (`pm2 restart backend --update-env`)
- [ ] 클라이언트 재시작 완료
- [ ] 회원가입 테스트 성공

## 📝 요약

**서버 설정:**
```bash
cd /home/webmaster/my-app/server
echo "SMS_VERIFICATION_ENABLED=false" >> .env
echo "NODE_ENV=development" >> .env
pm2 restart backend --update-env
```

**클라이언트 설정:**
```env
# client/.env
VITE_SMS_VERIFICATION_ENABLED=false
```

**테스트:**
- 회원가입 페이지에서 전화번호만 입력하면 자동으로 인증 완료
- SMS 인증 없이 회원가입 가능
