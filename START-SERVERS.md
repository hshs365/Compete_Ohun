# 서버 실행 가이드

## 현재 문제

로그인 시도 시 `ERR_CONNECTION_REFUSED` 오류가 발생합니다. 이는 백엔드 서버가 실행되고 있지 않기 때문입니다.

## 해결 방법

### 1. 서버 디렉토리로 이동

```bash
cd server
```

### 2. 의존성 설치 (처음 한 번만)

```bash
npm install
```

### 3. .env 파일 확인

`server/.env` 파일이 존재하고 다음 내용이 포함되어 있는지 확인:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun

JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. 서버 실행

```bash
npm run start:dev
```

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO  [NestApplication] Nest application successfully started on http://[::1]:3000
```

### 5. 클라이언트 실행 (별도 터미널)

새 터미널 창에서:

```bash
cd client
npm install  # 처음 한 번만
npm run dev
```

## 문제 해결

### 포트 3000이 이미 사용 중인 경우

```bash
# Windows에서 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID를 확인 후)
taskkill /PID <PID번호> /F
```

### 데이터베이스 연결 오류

- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 정보가 올바른지 확인
- 데이터베이스 `ohun`이 존재하는지 확인

### node_modules가 없는 경우

```bash
cd server
npm install

cd ../client
npm install
```

