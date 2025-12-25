# 빠른 데이터베이스 설정

## 현재 상태
✅ PostgreSQL 서비스 실행 중 (postgresql-x64-17)
✅ pg 패키지 설치됨
✅ TypeORM 설정 완료

## 다음 단계

### 1. 데이터베이스 생성

PowerShell 또는 명령 프롬프트에서:

```bash
# PostgreSQL에 접속 (비밀번호 입력 요청됨)
psql -U postgres
```

접속 후 SQL 실행:

```sql
-- 데이터베이스 생성
CREATE DATABASE ohun_db;

-- 확인
\l

-- 종료
\q
```

### 2. .env 파일 설정

`server/.env` 파일 생성 또는 수정:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=여기에_설치시_설정한_postgresql_비밀번호_입력
DB_NAME=ohun_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Kakao OAuth (카카오 로그인 사용 시)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Google OAuth (구글 로그인 사용 시)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**중요**: `DB_PASSWORD`를 PostgreSQL 설치 시 설정한 비밀번호로 변경하세요.

### 3. 서버 실행

```bash
cd server
npm run start:dev
```

서버가 정상적으로 시작되면:
- TypeORM이 자동으로 `users`와 `social_accounts` 테이블을 생성합니다
- "Nest application successfully started" 메시지가 표시됩니다

### 4. 테이블 확인 (선택사항)

```bash
psql -U postgres -d ohun_db
```

```sql
-- 테이블 목록 확인
\dt

-- users 테이블 구조 확인
\d users

-- 종료
\q
```

## 문제 해결

### psql 명령어를 찾을 수 없는 경우

PostgreSQL이 PATH에 추가되지 않았을 수 있습니다. 다음 경로를 확인하세요:

```
C:\Program Files\PostgreSQL\17\bin
```

또는 pgAdmin을 사용하여 데이터베이스를 생성할 수 있습니다.

### 비밀번호를 잊어버린 경우

1. Windows 서비스 관리자에서 PostgreSQL 서비스 중지
2. `pg_hba.conf` 파일에서 인증 방식을 `trust`로 변경 (임시)
3. 서비스 재시작
4. 비밀번호 재설정
5. `pg_hba.conf` 원래대로 복원

### 연결 오류가 발생하는 경우

- PostgreSQL 서비스가 실행 중인지 확인
- `.env`의 비밀번호가 올바른지 확인
- 방화벽이 5432 포트를 차단하지 않는지 확인


