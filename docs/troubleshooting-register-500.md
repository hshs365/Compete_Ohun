# 회원가입 500 Internal Server Error 원인 파악 가이드

Jenkins 빌드·배포 후 회원가입 시 **500 Internal server error**가 나는 경우, **배포 서버에 직접 접속할 수 없는 개발 PC**에서도 원인을 찾을 수 있도록, **서버에서 실행할 명령과 확인 절차**를 단계별로 정리했습니다.

서버(또는 서버에 접속 가능한 분)에서 아래 순서대로 실행한 뒤, **각 단계의 출력 결과를 그대로 복사해 개발 PC로 가져와 분석**하면 됩니다.

---

## ⚠️ 진행 방식

- **실행 위치**: 배포된 백엔드가 돌아가는 **웹 서버** (예: ohun.kr 백엔드 호스트). Jenkins로 배포했다면 보통 `/home/webmaster/my-app/server` 같은 경로입니다.
- **방법**: 각 단계의 "실행할 명령"을 서버에서 실행 → 터미널 출력을 **그대로 복사** → 개발 PC에서 채팅/문서로 공유하면, 로그·결과를 보고 원인을 좁혀 갈 수 있습니다.
- **가능하면 Step 0을 가장 먼저** 진행해 주세요. 회원가입 실패 시점의 서버 로그에 실제 에러 메시지가 찍혀 있습니다.

---

## 🔍 로그에서 자주 발견되는 원인과 조치 (요약)

`pm2 logs backend --lines 150 --nostream` 실행 후 아래 메시지가 보이면, 해당 조치를 진행하세요.

| 로그에 보이는 내용 | 원인 | 서버에서 할 조치 |
|-------------------|------|------------------|
| **`500 CORS 정책에 의해 차단되었습니다`** | `https://ohun.kr` origin이 CORS에서 거부되어 에러가 500으로 응답됨. 또는 `NODE_ENV`가 production이 아니어서 운영 도메인이 허용되지 않음. | (1) **코드 반영**: 이 저장소의 `server/src/main.ts` CORS 수정본을 배포(ohun.kr 항상 허용, 거부 시 500 대신 CORS 실패로 처리). (2) **환경 확인**: 서버 `.env`에 `NODE_ENV=production` 설정 후 `pm2 restart backend --update-env`. |
| **`MODULE_NOT_FOUND` / `../notifications/notifications.service`** | 빌드·배포 시 `notifications` 모듈이 `dist`에 없거나, 오래된 배포본만 있어서 모듈을 찾지 못함. | (1) **전체 재빌드·배포**: `cd /home/webmaster/my-app/server` → `rm -rf dist node_modules` → `npm ci` → `npm run build` → `ls dist/notifications` 로 파일 존재 확인. (2) Jenkins라면 빌드 산출물에 `dist/notifications/*.js` 가 포함되도록 풀 배포 후 `pm2 restart backend --update-env`. |
| **`ENETUNREACH 192.168.132.81:5432`** (GroupsSchedulerService 등) | **웹 서버**에서 **DB 서버**(192.168.132.81:5432)로 네트워크 연결 불가. | (1) **웹 서버**에서 연결 테스트: `nc -zv 192.168.132.81 5432` 또는 `telnet 192.168.132.81 5432`. (2) DB 서버 방화벽에서 웹 서버 IP 허용, PostgreSQL `listen_addresses`·`pg_hba.conf` 확인. (3) DB 서버(192.168.132.81)에서 PostgreSQL 실행 여부 확인. 자세한 DB 점검은 [db-connection-checklist.md](db-connection-checklist.md) 참고. |
| **`TypeOrmModule Called end on pool more than once`** | DB 연결 실패가 반복되면서 연결 풀 상태가 꼬인 경우. | 위 **ENETUNREACH** 조치로 DB 연결을 먼저 복구한 뒤 `pm2 restart backend --update-env`. |

---

## Step 0. 회원가입 실패 시점의 백엔드 로그 확인 (최우선)

500이 나면 NestJS는 화면에는 "Internal server error"만 보여주고, **실제 원인은 서버 로그**에만 출력됩니다.  
`auth.controller.ts`에서 `[POST /api/auth/register] 회원가입 실패:` 뒤에 **에러 메시지와 스택**이 찍히므로, 이 로그를 보면 원인 파악이 빠릅니다.

### 0-1. 실행할 명령 (웹 서버에서)

```bash
# PM2로 백엔드 실행 중인 경우 (일반적)
pm2 logs backend --lines 150 --nostream
```

- `backend` 대신 실제 프로세스 이름이 다르면 `pm2 list`로 확인 후 해당 이름을 넣습니다.
- 최근 150줄만 보려면 `--lines 150`, 실시간으로 보려면 `pm2 logs backend` (회원가입 한 번 시도한 뒤 Ctrl+C).

### 0-2. 확인할 내용

- **`[POST /api/auth/register] 회원가입 실패:`** 또는 **`[HttpExceptionLoggerFilter] [POST] /api/auth/register 500`** 다음에 나오는 메시지를 확인하세요.
- **`500 CORS 정책에 의해 차단되었습니다`** → 위 "로그에서 자주 발견되는 원인과 조치"의 CORS 항목 적용.
- **`MODULE_NOT_FOUND` / `notifications.service`** → notifications 모듈이 dist에 없음. 위 표의 MODULE_NOT_FOUND 조치 적용.
- **`ENETUNREACH 192.168.132.81:5432`** → 웹 서버에서 DB 서버로 연결 불가. 위 표의 ENETUNREACH 조치 적용.
- 기타 예시:
  - `ECONNREFUSED` → DB/Redis 연결 거부
  - `password authentication failed for user` → DB 비밀번호/계정 오류
  - `23505` (unique violation) → 이메일/닉네임 중복
  - `23502` (not null violation) → 필수 컬럼 누락
  - `relation "users" does not exist` → 테이블/마이그레이션 미적용

### 0-3. 결과 공유

- 위 로그 출력 **전체**(특히 `회원가입 실패:` 이후 부분)를 복사해 개발 PC로 가져와 주세요.
- **이 단계 결과만 있어도** 대부분의 500 원인을 바로 좁힐 수 있습니다.

---

## Step 1. 백엔드 프로세스·디렉터리 확인

### 1-1. 실행할 명령

```bash
# 프로세스 목록 (이름 확인)
pm2 list

# 백엔드 작업 디렉터리 (경로 확인, 예시는 webmaster)
pwd
ls -la /home/webmaster/my-app/server 2>/dev/null || ls -la ~/my-app/server 2>/dev/null || echo "경로를 알려주세요"
```

### 1-2. 결과 공유

- `pm2 list` 출력 전체
- `server` 폴더가 있는 실제 경로 (예: `/home/webmaster/my-app/server`)

---

## Step 2. DB 연결 정보(.env) 확인

회원가입은 반드시 DB에 `users` 등에 INSERT를 하므로, DB 설정 오류가 있으면 500이 납니다.

### 2-1. 실행할 명령 (웹 서버, server 디렉터리에서)

```bash
cd /home/webmaster/my-app/server   # 실제 server 경로로 변경
grep -E '^DB_|^JWT_SECRET' .env 2>/dev/null | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***/' | sed 's/JWT_SECRET=.*/JWT_SECRET=***/'
```

- 비밀번호·JWT 시크릿은 `***`로 가려서 공유해도 됩니다. **변수 이름과 값 존재 여부**만 보면 됩니다.

### 2-2. 확인할 내용

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` 이 모두 있는지
- `JWT_SECRET` 이 있는지 (없으면 로그인/회원가입 후 토큰 발급에서 문제될 수 있음)

### 2-3. 결과 공유

- 위 명령 **출력 전체** (비밀번호는 가려진 상태로)

---

## Step 3. DB 서버 접속 테스트 (웹 서버에서)

.env에 있는 값으로 **웹 서버에서** DB에 접속되는지 확인합니다.

### 3-1. 실행할 명령 (웹 서버에서)

```bash
# psql이 없으면: sudo apt install -y postgresql-client
# 아래 호스트/포트/사용자/DB명은 .env의 DB_* 값으로 바꿔서 실행
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USERNAME> -d <DB_NAME> -c "SELECT 1 AS ok;" 2>&1
```

- 예: `psql -h 192.168.132.81 -p 5432 -U postgres -d ohun -c "SELECT 1 AS ok;" 2>&1`
- 비밀번호는 프롬프트에 입력하거나 `PGPASSWORD='비밀번호' psql ...` 형태로 넣습니다.

### 3-2. 결과 공유

- 성공 시: `ok` / `1` 이 보이는 출력
- 실패 시: `connection refused`, `password authentication failed`, `no pg_hba.conf entry` 등 **에러 메시지 전체**

---

## Step 4. 테이블 존재 여부 (DB 서버 또는 웹 서버에서)

`users`, `phone_verification` 등이 없으면 회원가입 중 INSERT에서 500이 납니다.

### 4-1. 실행할 명령

```bash
# 위와 동일하게 DB 접속 정보로
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USERNAME> -d <DB_NAME> -c "\dt" 2>&1
```

### 4-2. 결과 공유

- `users`, `phone_verification` 테이블이 목록에 있는지
- 없다면: 마이그레이션/스키마 적용이 안 된 상태이므로, `docs/db-migration-guide.md` 등에 따라 마이그레이션 실행이 필요하다고 알려 주시면 됩니다.

---

## Step 5. 환경 변수 (SMS·Redis·업로드 등)

회원가입 플로우에서 사용하는 설정입니다. 잘못되면 특정 조건에서만 500이 날 수 있습니다.

### 5-1. 실행할 명령 (웹 서버, server 디렉터리에서)

```bash
cd /home/webmaster/my-app/server
grep -E '^SMS_VERIFICATION_ENABLED|^REDIS_ENABLED|^REDIS_HOST|^NODE_ENV|^UPLOAD_DIR' .env 2>/dev/null || echo "해당 변수 없음"
```

### 5-2. 참고

- **SMS_VERIFICATION_ENABLED**: `true`이면 전화번호 입력 시 SMS 인증 완료 여부를 DB(`phone_verification`)에서 확인합니다. DB/테이블 문제가 있으면 여기서 실패할 수 있습니다.
- **REDIS_ENABLED / REDIS_HOST**: 이 프로젝트 회원가입은 Redis를 직접 쓰지 않고, 전화번호 인증은 DB 테이블을 사용합니다. 다른 기능에서 Redis를 쓰면 기동 실패는 가능합니다.
- **UPLOAD_DIR**: 회원가입 단계에서는 사용하지 않지만, 프로필 이미지 등에서 사용합니다. 없으면 기본값으로 동작합니다.

### 5-3. 결과 공유

- 위 명령 출력 전체

---

## Step 6. bcrypt/bcryptjs 모듈 (선택)

이 프로젝트는 **bcryptjs**(순수 JS)를 사용하므로, 네이티브 모듈인 `bcrypt`와 달리 빌드 환경에 덜 민감합니다.  
다만 Step 0 로그에 `bcrypt` 관련 에러가 보이면 아래를 확인합니다.

### 6-1. 실행할 명령

```bash
cd /home/webmaster/my-app/server
ls -la node_modules/bcryptjs/package.json 2>/dev/null && echo "bcryptjs 있음" || echo "bcryptjs 없음"
# 혹시 bcrypt 네이티브를 쓰는 구버전 코드가 있다면
ls node_modules/bcrypt 2>/dev/null && echo "bcrypt 있음" || echo "bcrypt 없음"
```

### 6-2. 결과 공유

- `bcryptjs 있음` / `bcrypt 없음` 등 출력 내용

---

## Step 7. 회원가입 한 번 더 시도 후 로그 재확인

Step 0에서 로그를 못 찾았거나, 설정을 수정한 뒤 다시 확인하고 싶을 때입니다.

### 7-1. 절차

1. 서버에서 실시간 로그 보기: `pm2 logs backend` (또는 해당 프로세스 이름)
2. 개발 PC 브라우저에서 회원가입(5단계까지) 제출
3. 500 발생 직후 서버 터미널에 찍힌 **`[POST /api/auth/register] 회원가입 실패:`** 부근 로그** 전체**를 복사

### 7-2. 결과 공유

- 해당 로그 블록 전체

---

## 요약: 무엇을 공유하면 좋은지

| 우선순위 | 공유할 내용 |
|----------|-------------|
| 1 | **Step 0** – `pm2 logs backend --lines 150` 출력, 특히 `회원가입 실패:` 뒤 에러 메시지·스택 |
| 2 | **Step 2** – `.env`의 `DB_*`, `JWT_SECRET` 존재 여부 (비밀번호는 가려도 됨) |
| 3 | **Step 3** – `psql ... -c "SELECT 1"` 실행 결과 (성공/실패 메시지) |
| 4 | **Step 4** – `\dt` 결과 (users 등 테이블 존재 여부) |
| 5 | **Step 1** – `pm2 list` 및 server 실제 경로 |

Step 0 로그만 있어도 대부분 원인이 특정되므로, **가능하면 Step 0 결과를 먼저** 가져와 주시면, 그다음에 필요한 단계만 골라서 진행할 수 있습니다.
