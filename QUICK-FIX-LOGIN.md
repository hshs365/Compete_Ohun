# 로그인 오류 빠른 해결

## 문제
`ERR_CONNECTION_REFUSED` - 백엔드 서버가 실행되지 않음

## 해결 방법 (2단계)

### 1단계: 서버 실행 (새 터미널)

```powershell
cd C:\Users\hshs3\Documents\GitHub\Ohun\server
npm run start:dev
```

**서버가 정상적으로 시작되면 다음과 같은 메시지가 보입니다:**
```
[Nest] INFO  [NestApplication] Nest application successfully started on http://[::1]:3000
```

### 2단계: 클라이언트 확인

클라이언트가 실행 중인지 확인 (별도 터미널에서):
```powershell
cd C:\Users\hshs3\Documents\GitHub\Ohun\client
npm run dev
```

## 중요!

**서버와 클라이언트가 모두 실행되어야 로그인이 작동합니다.**

- ✅ 서버: http://localhost:3000 (백엔드 API)
- ✅ 클라이언트: http://localhost:5173 (프론트엔드)

## 서버가 시작되지 않으면?

1. **데이터베이스 연결 오류 확인**
   - PostgreSQL 서비스가 실행 중인지 확인
   - `.env` 파일의 DB 정보 확인

2. **포트 충돌**
   - 다른 프로세스가 3000 포트 사용 중인지 확인
   - 필요시 해당 프로세스 종료

3. **의존성 설치**
   ```bash
   cd server
   npm install
   ```

## 확인 방법

브라우저에서 직접 API 테스트:
- http://localhost:3000 (서버가 실행 중이면 응답이 있어야 함)

