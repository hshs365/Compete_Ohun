# DB 서버 PostgreSQL 접속 가이드

## 문제 상황
- `psql -U postgres -h localhost`: 패스워드 인증 실패
- `psql -U postgres`: Peer 인증 실패 (OS 사용자 `dbmaster` ≠ DB 사용자 `postgres`)

## 해결 방법

### 방법 1: postgres OS 사용자로 접속 (가장 간단)

```bash
# DB 서버에서 실행
sudo -u postgres psql
```

이렇게 하면 postgres OS 사용자로 전환되어 peer 인증으로 접속됩니다.

접속 후:
```sql
-- 데이터베이스 목록 확인
\l

-- ohun 데이터베이스가 없으면 생성
CREATE DATABASE ohun;

-- 확인
\l

-- 종료
\q
```

### 방법 2: 패스워드 재설정 후 접속

```bash
# 1. postgres 사용자로 접속
sudo -u postgres psql

# 2. 패스워드 설정
ALTER USER postgres WITH PASSWORD '새로운_비밀번호';

# 3. 종료
\q

# 4. 이제 패스워드로 접속 가능
psql -U postgres -h localhost
# 또는
PGPASSWORD=새로운_비밀번호 psql -U postgres -h localhost
```

### 방법 3: pg_hba.conf 설정 변경 (원격 접속 허용)

웹서버에서 DB 서버로 접속하려면 원격 접속을 허용해야 합니다.

```bash
# DB 서버에서
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

다음 줄 추가 (파일 끝부분):
```
# 원격 접속 허용 (웹서버에서)
host    all             all             192.168.132.185/32         md5
host    all             all             192.168.132.126/32         md5

# 로컬 접속 허용
host    all             all             127.0.0.1/32               md5
host    all             all             ::1/128                     md5
```

설정 적용:
```bash
sudo systemctl restart postgresql
```

## 데이터베이스 생성 확인

```bash
# postgres 사용자로 접속
sudo -u postgres psql

# 데이터베이스 목록 확인
\l

# ohun 데이터베이스가 있는지 확인
# 없으면 생성
CREATE DATABASE ohun;

# ohun 데이터베이스에 접속
\c ohun

# 테이블 목록 확인 (아직 없을 수 있음)
\dt

# 종료
\q
```

## 웹서버에서 연결 테스트

웹서버(192.168.132.185)에서:
```bash
# PostgreSQL 클라이언트가 설치되어 있다면
psql -h 192.168.132.81 -U postgres -d ohun

# 또는 Node.js로 테스트
cd /home/webmaster/my-app/server
node -e "const { Client } = require('pg'); const client = new Client({host: '192.168.132.81', user: 'postgres', password: '비밀번호', database: 'ohun'}); client.connect().then(() => {console.log('연결 성공!'); client.end();}).catch(err => console.error('연결 실패:', err));"
```

## 주의사항

⚠️ **운영 환경에서는:**
- 강력한 패스워드 사용
- 특정 IP만 접속 허용
- 전용 DB 사용자 생성 (postgres 사용자 직접 사용 지양)
