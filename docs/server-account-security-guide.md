# 서버 계정 관리 및 보안 가이드

## 📋 개요

각 서버마다 전용 관리 계정을 사용하고, sudo는 필요한 경우에만 사용하는 것이 보안상 안전합니다.

## 🎯 현재 서버 구성

| 서버 | IP | 전용 계정 | 역할 |
|------|-----|---------|------|
| 웹서버1 | 192.168.132.185 | `webmaster` | 애플리케이션 실행 |
| 웹서버2 | 192.168.132.126 | `webmaster` | 애플리케이션 실행 |
| DB 서버 | 192.168.132.81 | `dbmaster` | 데이터베이스 관리 |
| LB 서버 | 192.168.132.147 | `lbadmin` (권장) | 로드밸런서 관리 |
| Jenkins 서버 | 192.168.132.191 | `jenkins` (기본) | CI/CD 파이프라인 |

## ✅ 권장 사항

### 1. 각 서버별 전용 계정 사용 (이미 적용됨)

**현재 상태:**
- ✅ 웹서버: `webmaster` 계정 사용 중
- ✅ DB 서버: `dbmaster` 계정 사용 중

**장점:**
- 각 서버의 역할이 명확함
- 보안 이벤트 추적이 쉬움
- 권한 분리로 보안 강화

### 2. sudo 사용 원칙

**✅ sudo를 사용해야 하는 경우:**
- 시스템 서비스 관리 (systemctl)
- 시스템 설정 파일 수정 (/etc/*)
- 패키지 설치/업데이트
- 네트워크 설정
- 로그 파일 접근 (일부)

**❌ sudo 없이 해야 하는 경우:**
- 애플리케이션 코드 실행
- 애플리케이션 로그 확인
- 일반 파일 편집
- Git 작업

### 3. PostgreSQL 접속 개선 방법

#### 현재 문제점
- `dbmaster` 사용자가 PostgreSQL에 직접 접속하려면 `sudo -u postgres` 필요
- 이는 보안상 권장되지 않음

#### 개선 방법: 전용 DB 사용자 생성

**DB 서버(192.168.132.81)에서 실행:**

```bash
# 1. postgres 사용자로 접속
sudo -u postgres psql

# 2. 전용 DB 사용자 생성
CREATE USER ohun_admin WITH PASSWORD '강력한_비밀번호';
ALTER USER ohun_admin CREATEDB;

# 3. ohun 데이터베이스에 권한 부여
GRANT ALL PRIVILEGES ON DATABASE ohun TO ohun_admin;

# 4. 기존 데이터베이스에 연결해서 스키마 권한 부여
\c ohun
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ohun_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ohun_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ohun_admin;

# 5. 종료
\q
```

**이제 `dbmaster` 사용자로 패스워드 인증으로 접속 가능:**

```bash
# DB 서버에서
psql -h localhost -U ohun_admin -d ohun
# 또는
PGPASSWORD=강력한_비밀번호 psql -h localhost -U ohun_admin -d ohun
```

**웹서버의 .env 파일 수정:**

```env
DB_HOST=192.168.132.81
DB_PORT=5432
DB_USERNAME=ohun_admin  # postgres 대신 전용 사용자
DB_PASSWORD=강력한_비밀번호
DB_NAME=ohun
```

### 4. sudo 권한 설정 (선택사항)

필요한 경우 특정 명령어만 sudo로 실행 가능하도록 설정:

```bash
# sudoers 파일 편집 (주의: 문법 오류 시 시스템 접근 불가)
sudo visudo

# 특정 사용자에게 특정 명령어만 허용
dbmaster ALL=(postgres) NOPASSWD: /usr/bin/psql
webmaster ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart pm2-*, /usr/bin/systemctl status pm2-*
```

**⚠️ 주의:** visudo는 문법 검사를 하므로 안전하지만, 잘못된 설정은 시스템 접근을 막을 수 있습니다.

## 🔒 보안 모범 사례

### 1. 계정별 역할 분리

```
webmaster (웹서버)
├── 애플리케이션 실행 (pm2)
├── 코드 배포 (git pull)
├── 로그 확인
└── sudo 필요: systemctl (pm2 서비스 관리)

dbmaster (DB 서버)
├── 데이터베이스 모니터링
├── 백업/복원
├── 로그 확인
└── sudo 필요: PostgreSQL 설정 변경

lbadmin (LB 서버)
├── Nginx 설정
├── 로드밸런서 모니터링
└── sudo 필요: Nginx 재시작, 방화벽 설정
```

### 2. SSH 키 기반 인증

```bash
# 각 서버에서 SSH 키 생성
ssh-keygen -t ed25519 -C "webmaster@web1"

# 공개키를 다른 서버에 복사
ssh-copy-id webmaster@192.168.132.185
```

### 3. 방화벽 설정

```bash
# 필요한 포트만 열기
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # 백엔드 (웹서버만)
sudo ufw allow 5173/tcp  # 프론트엔드 (웹서버만)
sudo ufw allow 5432/tcp  # PostgreSQL (DB 서버만, 특정 IP만)
sudo ufw enable
```

### 4. 정기적인 보안 업데이트

```bash
# 각 서버에서 정기적으로 실행
sudo apt update
sudo apt upgrade -y
```

## 📝 실무 가이드

### 웹서버에서 일반 작업 (sudo 불필요)

```bash
# webmaster 계정으로
cd /home/webmaster/my-app
git pull origin main
pm2 restart backend
pm2 logs backend --lines 50
```

### 웹서버에서 시스템 작업 (sudo 필요)

```bash
# PM2를 시스템 서비스로 등록한 경우
sudo systemctl restart pm2-webmaster
sudo systemctl status pm2-webmaster
```

### DB 서버에서 일반 작업

```bash
# dbmaster 계정으로 (전용 사용자 생성 후)
psql -h localhost -U ohun_admin -d ohun
```

### DB 서버에서 시스템 작업 (sudo 필요)

```bash
# PostgreSQL 설정 변경
sudo nano /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql
```

## ⚠️ 주의사항

1. **root 계정 직접 사용 금지**
   - 항상 전용 계정 사용
   - sudo로 필요한 권한만 사용

2. **패스워드 정책**
   - 강력한 패스워드 사용
   - 정기적인 패스워드 변경
   - SSH 키 인증 권장

3. **로그 모니터링**
   - sudo 사용 로그 확인: `sudo grep sudo /var/log/auth.log`
   - 실패한 로그인 시도 모니터링

4. **최소 권한 원칙**
   - 필요한 권한만 부여
   - 정기적인 권한 검토

## 🔄 마이그레이션 계획

현재 구조는 이미 좋습니다:
- ✅ 각 서버에 전용 계정 존재
- ✅ sudo는 필요한 경우에만 사용

**개선할 점:**
1. PostgreSQL 전용 사용자 생성 (위 참고)
2. SSH 키 기반 인증 설정
3. 방화벽 규칙 정리
