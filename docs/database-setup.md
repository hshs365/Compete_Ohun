# PostgreSQL 데이터베이스 설정

## 1. 설치 및 서비스 확인

### Windows
```powershell
psql --version
```
- 미설치 시: https://www.postgresql.org/download/windows/ 또는 `choco install postgresql`
- 서비스: `Win+R` → `services.msc` → "postgresql" 실행 중 확인  
  또는 `Start-Service postgresql-x64-*`

## 2. 데이터베이스 생성

```bash
psql -U postgres -h localhost
```

```sql
CREATE DATABASE ohun;
\l
\q
```

(선택) 전용 사용자: `CREATE USER ohun_user WITH PASSWORD '비밀번호';` 후 `GRANT ALL PRIVILEGES ON DATABASE ohun TO ohun_user;`

pgAdmin 사용 시: Databases 우클릭 → Create → Database → Name: `ohun`

## 3. server/.env 설정

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=설치시_설정한_비밀번호
DB_NAME=ohun

JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## 4. 연결 테스트

```bash
cd server
npm run start:dev
```

- "Nest application successfully started" 및 TypeORM 테이블 생성 확인
- 테이블 확인: `psql -U postgres -d ohun` → `\dt`

## 5. 문제 해결

- **connection refused**: PostgreSQL 서비스 실행 여부, 5432 포트 확인
- **password authentication failed**: `.env`의 `DB_PASSWORD` 확인
- **database does not exist**: 위 2번에서 DB 이름 `ohun` 생성 여부 확인
- **psql 없음**: PostgreSQL `bin` 경로를 PATH에 추가하거나 pgAdmin 사용

---

## 6. 데이터 초기화

**전체 데이터만 삭제 (테이블 유지):**

`server/scripts/reset-data.sql` 실행 (FK 순서대로 DELETE).

```bash
psql -U postgres -d ohun -f server/scripts/reset-data.sql
```

**TypeORM 인덱스 충돌(42P07) 시:**

해당 인덱스만 제거 후 서버 재시작:

```sql
psql -U postgres -d ohun
DROP INDEX IF EXISTS "IDX_9a8a82462cab47c73d25f49261";
```

**DB 완전 초기화 (모든 데이터·스키마 삭제):**

```sql
DROP DATABASE IF EXISTS ohun;
CREATE DATABASE ohun;
```

이후 서버 재시작 시 TypeORM `synchronize: true`로 테이블 재생성.

---

## 7. 원격 DB 서버 접속

로컬이 아닌 **원격 PostgreSQL 서버**(예: 웹서버에서 DB 서버로 접속)를 쓸 때 참고합니다.

### 문제 상황
- `psql -U postgres -h localhost`: 패스워드 인증 실패
- `psql -U postgres`: Peer 인증 실패 (OS 사용자 ≠ DB 사용자 `postgres`)

### 방법 1: postgres OS 사용자로 접속 (가장 간단)

```bash
# DB 서버에서 실행
sudo -u postgres psql
```

접속 후 `\l` → `CREATE DATABASE ohun;` 필요 시 생성 → `\q`

### 방법 2: 패스워드 재설정 후 접속

```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD '새로운_비밀번호';
\q
# 이후
psql -U postgres -h localhost
# 또는 PGPASSWORD=비밀번호 psql -U postgres -h localhost
```

### 방법 3: pg_hba.conf로 원격 접속 허용

웹서버에서 DB 서버로 접속하려면 DB 서버에서:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

파일 끝에 추가:
```
host    all    all    192.168.132.185/32    md5
host    all    all    127.0.0.1/32          md5
```

적용: `sudo systemctl restart postgresql`

### 웹서버에서 연결 테스트

```bash
psql -h 192.168.132.81 -U postgres -d ohun
```

⚠️ **운영 환경**: 강한 패스워드, 특정 IP만 허용, 전용 DB 사용자 사용 권장.

---

운영 환경에서는 `synchronize: false`로 두고 마이그레이션 사용 권장.  
스키마 참고: `docs/database-schema-reference.md`  
덤프/복원·서버 마이그레이션: `docs/db-migration-guide.md`
