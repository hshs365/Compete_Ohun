# PostgreSQL 데이터베이스 설정 가이드

## 1. PostgreSQL 설치 확인

PostgreSQL이 설치되어 있는지 확인:

### Windows
```powershell
# PowerShell에서 확인
psql --version
```

설치되어 있지 않다면:
- https://www.postgresql.org/download/windows/ 에서 다운로드
- 또는 Chocolatey 사용: `choco install postgresql`

## 2. PostgreSQL 서비스 시작

### Windows (서비스 관리자)
1. `Win + R` → `services.msc`
2. "postgresql" 서비스 찾기
3. 상태가 "실행 중"인지 확인, 아니면 시작

### 또는 명령어로:
```powershell
# 관리자 권한 PowerShell에서
Start-Service postgresql-x64-*  # 버전에 따라 이름이 다를 수 있음
```

## 3. PostgreSQL에 접속하여 데이터베이스 생성

### 방법 1: psql 명령어 사용

```bash
# PostgreSQL 기본 사용자로 접속 (설치 시 설정한 비밀번호 입력)
psql -U postgres

# 또는 비밀번호 없이 접속 (trust 인증인 경우)
psql -U postgres -h localhost
```

접속 후:

```sql
-- 데이터베이스 생성
CREATE DATABASE ohun_db;

-- 사용자 생성 (선택사항, 또는 기존 postgres 사용자 사용 가능)
CREATE USER ohun_user WITH PASSWORD 'your_password';
ALTER USER ohun_user CREATEDB;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE ohun_db TO ohun_user;

-- 확인
\l  -- 데이터베이스 목록 보기
\q  -- 종료
```

### 방법 2: pgAdmin 사용
1. pgAdmin 실행
2. 서버 연결 (설치 시 설정한 비밀번호)
3. Databases 우클릭 → Create → Database
4. Name: `ohun_db`
5. Save

## 4. .env 파일 설정

`server/.env` 파일 생성 또는 수정:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
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

**중요**: `DB_PASSWORD`를 실제 PostgreSQL 설치 시 설정한 비밀번호로 변경하세요.

## 5. 데이터베이스 연결 테스트

서버 실행:

```bash
cd server
npm run start:dev
```

서버가 정상적으로 시작되고 다음과 같은 로그가 보이면 성공:
- "Nest application successfully started"
- TypeORM이 자동으로 테이블을 생성함 (synchronize: true)

## 6. 연결 문제 해결

### "connection refused" 오류
- PostgreSQL 서비스가 실행 중인지 확인
- 포트 5432가 다른 프로세스에 의해 사용 중인지 확인

### "password authentication failed" 오류
- `.env`의 `DB_PASSWORD`가 올바른지 확인
- PostgreSQL 사용자 비밀번호 확인

### "database does not exist" 오류
- 위 3번 단계에서 데이터베이스를 생성했는지 확인
- 데이터베이스 이름이 `.env`의 `DB_NAME`과 일치하는지 확인

### Windows에서 "psql: command not found" 오류
- PostgreSQL이 PATH에 추가되지 않았을 수 있음
- PostgreSQL 설치 경로를 PATH에 추가하거나
- pgAdmin을 사용하여 데이터베이스 생성

## 7. 테이블 확인

데이터베이스가 정상적으로 생성되었는지 확인:

```bash
psql -U postgres -d ohun_db
```

```sql
-- 테이블 목록 확인
\dt

-- users 테이블 구조 확인
\d users

-- social_accounts 테이블 구조 확인
\d social_accounts
```

## 8. TypeORM Synchronize 옵션

현재 `synchronize: true`로 설정되어 있어서:
- 서버 시작 시 자동으로 테이블 생성
- 엔티티 변경 시 자동으로 스키마 업데이트

**주의**: 프로덕션 환경에서는 `synchronize: false`로 설정하고 마이그레이션을 사용하세요.


