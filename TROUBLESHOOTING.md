# 문제 해결 가이드

## 🔴 ERR_CONNECTION_REFUSED 에러 해결

### 증상
브라우저 콘솔에 다음과 같은 에러가 표시됨:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:3000/api/auth/me:1
```

### 원인
백엔드 서버가 실행되지 않았거나, 연결할 수 없는 상태입니다.

### 해결 방법

#### 1단계: 서버 실행 확인
```powershell
# 서버 디렉토리로 이동
cd C:\Compete_Ohun\server

# 서버 실행
npm run start:dev
```

**정상 실행 시 다음과 같은 메시지가 표시됩니다:**
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] AppModule dependencies initialized
[Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO  [NestApplication] Nest application successfully started
```

#### 2단계: 포트 충돌 확인
만약 "포트가 이미 사용 중"이라는 에러가 나오면:

```powershell
# 포트 3000을 사용하는 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
Stop-Process -Id <PID> -Force

# 서버 재시작
npm run start:dev
```

#### 3단계: 데이터베이스 연결 확인
서버가 시작되지만 데이터베이스 연결 에러가 나오면:

1. PostgreSQL이 실행 중인지 확인
2. `server/.env` 파일 확인:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_NAME=ohun
   ```

#### 4단계: CORS 설정 확인
서버는 실행되지만 브라우저에서 연결이 안 되면:

`server/src/main.ts`에서 CORS 설정 확인:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

`server/.env` 파일에 다음이 있는지 확인:
```env
FRONTEND_URL=http://localhost:5173
```

### 빠른 체크리스트

- [ ] 서버가 실행 중인가? (`npm run start:dev`)
- [ ] 포트 3000이 사용 가능한가? (`netstat -ano | findstr :3000`)
- [ ] 데이터베이스가 실행 중인가? (PostgreSQL)
- [ ] `.env` 파일이 올바르게 설정되어 있는가?
- [ ] 클라이언트가 `http://localhost:5173`에서 실행 중인가?

### 추가 디버깅

#### 서버 로그 확인
서버 터미널에서 에러 메시지 확인:
- 데이터베이스 연결 에러
- 포트 충돌 에러
- 모듈 로딩 에러

#### 브라우저 개발자 도구 확인
1. F12로 개발자 도구 열기
2. Network 탭에서 실패한 요청 확인
3. Console 탭에서 JavaScript 에러 확인

#### API 직접 테스트
브라우저에서 직접 접속:
```
http://localhost:3000
```
"Hello World" 같은 응답이 나오면 서버는 정상입니다.

### 일반적인 문제들

#### 문제 1: 서버가 시작되지 않음
**해결**: 
- `node_modules` 재설치: `npm install --legacy-peer-deps`
- TypeScript 컴파일 에러 확인
- 환경 변수 파일 확인

#### 문제 2: 데이터베이스 연결 실패
**해결**:
- PostgreSQL 서비스가 실행 중인지 확인
- 데이터베이스가 생성되어 있는지 확인
- `.env` 파일의 데이터베이스 정보 확인

#### 문제 3: CORS 에러
**해결**:
- `server/src/main.ts`의 CORS 설정 확인
- `FRONTEND_URL` 환경 변수 확인
- 브라우저 캐시 클리어

---

## 🔴 회원가입 시 500 Internal Server Error (배포 서버)

### 증상
- Jenkins로 빌드·배포한 뒤 회원가입(5/5 단계 제출) 시 **"Internal server error"** 팝업
- 브라우저 콘솔: `api/auth/register` 요청이 **500** 응답

### 원인 파악 방법 (서버에 직접 접속이 어려울 때)
개발 PC에서 배포 서버 루트에 접근할 수 없어도, **서버에서 명령을 실행한 결과만 공유**해 주면 원인 분석이 가능합니다.

**단계별 점검 가이드**: [docs/troubleshooting-register-500.md](docs/troubleshooting-register-500.md)

1. **가장 먼저**: 배포 서버에서 `pm2 logs backend --lines 150` 실행 후, **`[POST /api/auth/register] 회원가입 실패:`** 뒤에 나오는 **에러 메시지·스택**을 복사해 공유
2. 이어서: DB 연결(.env, `psql` 테스트), 테이블 존재 여부(`\dt`), 환경 변수 등은 가이드의 Step 1~7 순서대로 실행한 결과를 공유

가이드에 따라 서버 측 출력을 가져오시면, 그 결과를 바탕으로 원인과 수정 방법을 안내할 수 있습니다.

---

## 📞 추가 도움

문제가 계속되면:
1. 서버 터미널의 전체 에러 메시지 확인
2. 브라우저 개발자 도구의 Network 탭 확인
3. `PROJECT-PROGRESS.md` 파일의 설정 확인




