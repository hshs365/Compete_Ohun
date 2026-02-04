# DB 연결·권한 확인 체크리스트

회원가입 500 등 DB 관련 오류 시 아래 순서대로 확인하세요.

---

## 1. 웹 서버(배포 서버) — 백엔드가 쓰는 DB 설정

**위치:** 웹 서버(예: 192.168.132.185)에서 백엔드가 돌아가는 디렉터리

- 경로: `/home/webmaster/my-app/server/.env`
- Jenkins로 배포했다면 이 서버의 `my-app/server` 아래에 있습니다.

**확인할 변수:**

| 변수 | 예시 | 설명 |
|------|------|------|
| `DB_HOST` | `192.168.132.81` | DB 서버 IP (웹서버와 다르면 원격 접속) |
| `DB_PORT` | `5432` | PostgreSQL 포트 |
| `DB_USERNAME` | `postgres` 또는 `ohun_admin` | DB 로그인 사용자 |
| `DB_PASSWORD` | (실제 비밀번호) | 위 사용자의 비밀번호 (오타 없이) |
| `DB_NAME` | `ohun` | 접속할 DB 이름 |

**확인 방법:**

```bash
# 웹 서버에 SSH 접속 후
cd /home/webmaster/my-app/server
grep -E '^DB_' .env
```

- `DB_HOST`가 `localhost`이면 **같은 서버에만** DB 접속을 시도합니다. DB가 다른 서버(192.168.132.81)에 있으면 `DB_HOST=192.168.132.81` 로 바꿔야 합니다.
- 비밀번호에 `#`, 공백, 따옴표가 있으면 따옴표로 감싸거나 이스케이프 필요할 수 있습니다.

---

## 2. DB 서버 — 사용자 존재·비밀번호·권한

**위치:** DB 서버(예: 192.168.132.81)에서 PostgreSQL

**2-1. 사용자 존재 여부**

```bash
# DB 서버에 SSH 접속 후
sudo -u postgres psql -c "\du"
```

- `.env`의 `DB_USERNAME`(예: `postgres`, `ohun_admin`)이 목록에 있는지 확인.

**2-2. 해당 사용자로 로그인 테스트**

```bash
# postgres 사용자
sudo -u postgres psql -d ohun -c "SELECT 1;"

# 전용 사용자(예: ohun_admin)인 경우
PGPASSWORD='여기에_실제_비밀번호' psql -h localhost -U ohun_admin -d ohun -c "SELECT 1;"
```

- 실패하면: 비밀번호 불일치이거나 사용자/DB 이름 오타.

**2-3. 테이블 권한 (INSERT 가능 여부)**

```bash
sudo -u postgres psql -d ohun -c "\dt"
```

- `users` 테이블이 보여야 합니다.
- 전용 사용자(ohun_admin)를 쓴다면, 해당 사용자에게 권한이 있어야 합니다:

```sql
-- postgres로 접속한 뒤
\c ohun
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ohun_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ohun_admin;
```

---

## 3. DB 서버 — 원격 접속 허용 (웹↔DB가 다른 서버일 때)

**3-1. pg_hba.conf — 어떤 IP에서 어떤 사용자 접속을 허용할지**

```bash
# DB 서버(192.168.132.81)에서
sudo nano /etc/postgresql/16/main/pg_hba.conf
# 버전이 다르면: ls /etc/postgresql/
```

파일 **끝**에 다음이 있거나, 웹 서버 IP가 허용되어 있어야 합니다:

```
# 웹 서버 IP에서 모든 DB 사용자 접속 허용 (md5 = 비밀번호 인증)
host    all    all    192.168.132.185/32    md5
# 로컬
host    all    all    127.0.0.1/32          md5
```

- `192.168.132.185`를 **실제 웹 서버 IP**로 바꿔서 사용하세요.
- 수정 후 반드시 재시작:

```bash
sudo systemctl restart postgresql
```

**3-2. listen_addresses — 외부에서 5432 접속 허용**

```bash
# DB 서버에서
sudo nano /etc/postgresql/16/main/postgresql.conf
```

다음이 있어야 합니다 (주석이면 `#` 제거):

```
listen_addresses = 'localhost'
# 원격 접속 허용 시:
# listen_addresses = '*'
# 또는
# listen_addresses = 'localhost,192.168.132.81'
```

- `'*'`로 두면 모든 인터페이스에서 접속 가능. 보안상 필요 최소 IP만 쓰려면 `pg_hba.conf`로 제한합니다.
- 수정 후: `sudo systemctl restart postgresql`

---

## 4. 웹 서버 → DB 서버 연결 테스트

**웹 서버**에 SSH 접속한 뒤, 백엔드와 **같은 DB 정보**로 접속해 봅니다:

```bash
# 웹 서버(192.168.132.185)에서
# psql이 없다면: sudo apt install postgresql-client

psql -h 192.168.132.81 -p 5432 -U postgres -d ohun -c "SELECT 1;"
# 비밀번호 입력하라고 나오면 .env의 DB_PASSWORD 입력
```

- **connection refused** → DB 서버 방화벽(5432), 또는 PostgreSQL이 5432에서 listen 중인지 확인.
- **password authentication failed** → `.env`의 `DB_PASSWORD`와 DB 사용자 비밀번호가 일치하는지, `pg_hba.conf`에 웹 서버 IP가 있고 `md5`(또는 scram-sha-256)인지 확인.
- **no pg_hba.conf entry** → `pg_hba.conf`에 웹 서버 IP(예: 192.168.132.185/32) 추가 후 `sudo systemctl restart postgresql`.

---

## 5. 요약 — 어디를 보면 되는지

| 확인 항목 | 보는 곳 |
|-----------|---------|
| DB 호스트/포트/계정/비밀번호/DB명 | **웹 서버** `~/my-app/server/.env` (`DB_*`) |
| DB 사용자 존재·비밀번호·테이블 권한 | **DB 서버** `psql -U postgres -d ohun`, `\du`, `\dt`, `GRANT` |
| 원격 접속 허용 IP | **DB 서버** `/etc/postgresql/*/main/pg_hba.conf` |
| PostgreSQL listen 주소 | **DB 서버** `/etc/postgresql/*/main/postgresql.conf` (`listen_addresses`) |
| 실제 연결 가능 여부 | **웹 서버**에서 `psql -h DB_HOST -U DB_USERNAME -d ohun` |

위 순서대로 확인하면 DB 연결·권한 문제 여부를 짚을 수 있습니다.
