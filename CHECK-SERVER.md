# 서버 상태 확인 및 재시작 가이드

## 🚨 ERR_CONNECTION_REFUSED 에러 해결

### 현재 상황
브라우저에서 `http://localhost:3000`에 연결할 수 없습니다.

### 즉시 해결 방법

#### 방법 1: 서버 수동 실행 (권장)

1. **새 터미널 창 열기**
2. **서버 디렉토리로 이동**:
   ```powershell
   cd C:\Compete_Ohun\server
   ```
3. **서버 실행**:
   ```powershell
   npm run start:dev
   ```

4. **서버가 정상 시작되면 다음과 같은 메시지가 표시됩니다**:
   ```
   [Nest] INFO  [NestFactory] Starting Nest application...
   [Nest] INFO  [InstanceLoader] AppModule dependencies initialized
   [Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
   [Nest] INFO  [InstanceLoader] AuthModule dependencies initialized
   [Nest] INFO  [InstanceLoader] UsersModule dependencies initialized
   [Nest] INFO  [InstanceLoader] GroupsModule dependencies initialized
   [Nest] INFO  [NestApplication] Nest application successfully started
   ```

5. **서버가 실행 중인 상태로 유지** (이 터미널 창을 닫지 마세요!)

#### 방법 2: 포트 충돌 해결

만약 "포트가 이미 사용 중"이라는 에러가 나오면:

```powershell
# 포트 3000을 사용하는 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
# 예: Stop-Process -Id 3224 -Force

# 서버 재시작
npm run start:dev
```

### 서버 실행 확인

서버가 정상 실행되면:
- 브라우저에서 `http://localhost:3000` 접속 시 응답이 있어야 합니다
- 프론트엔드에서 API 호출이 정상 작동합니다

### 데이터베이스 연결 문제

서버가 시작되지만 데이터베이스 연결 에러가 나오면:

1. **PostgreSQL이 실행 중인지 확인**
2. **`server/.env` 파일 확인**:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_NAME=ohun
   ```

### 다음 단계

서버가 정상 실행되면:
1. 브라우저에서 페이지 새로고침 (F5)
2. 로그인 페이지에서 다시 시도
3. 브라우저 개발자 도구 (F12) → Network 탭에서 요청 상태 확인

---

**중요**: 서버는 별도 터미널에서 계속 실행 중이어야 합니다!



