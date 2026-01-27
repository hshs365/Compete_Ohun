# 데이터베이스 마이그레이션 가이드

## 방법 1: TypeORM 자동 생성 (권장)

서버에서 백엔드를 실행하면 TypeORM이 자동으로 스키마를 생성합니다.

### 서버에서 실행할 명령어

```bash
# 1. DB 서버에 데이터베이스 생성
psql -h 192.168.132.81 -U postgres
CREATE DATABASE ohun;
\q

# 2. 서버의 .env 파일 설정
cd /home/webmaster/my-app/server
# .env 파일에 DB 정보 입력

# 3. 백엔드 실행 (자동 스키마 생성)
cd /home/webmaster/my-app/server
npm ci
npm run start:dev
```

## 방법 2: SQL 덤프 생성 후 복원

### 2-1. 로컬에서 덤프 생성

**PowerShell에서 실행:**

```powershell
# 스키마만 덤프 (데이터 없이)
pg_dump -h localhost -U postgres -d ohun --schema-only -f schema.sql

# 스키마 + 데이터 덤프
pg_dump -h localhost -U postgres -d ohun -f full_dump.sql

# 특정 테이블만 덤프
pg_dump -h localhost -U postgres -d ohun -t users -t groups -f tables.sql
```

### 2-2. 서버로 파일 전송

```powershell
# SCP로 파일 전송 (서버에 SSH 키가 설정되어 있다면)
scp schema.sql webmaster@192.168.132.185:/home/webmaster/

# 또는 WinSCP, FileZilla 같은 GUI 도구 사용
```

### 2-3. 서버에서 복원

```bash
# 서버에 SSH 접속
ssh webmaster@192.168.132.185

# DB 서버에 데이터베이스 생성 (아직 안 했다면)
psql -h 192.168.132.81 -U postgres -c "CREATE DATABASE ohun;"

# 덤프 파일 복원
psql -h 192.168.132.81 -U postgres -d ohun -f /home/webmaster/schema.sql
```

## 방법 3: pgAdmin 사용 (GUI)

1. 로컬 pgAdmin에서 데이터베이스 백업
   - 데이터베이스 우클릭 → Backup
   - Format: Plain 또는 Custom 선택
   - 파일 저장

2. 서버 pgAdmin에서 복원
   - 데이터베이스 우클릭 → Restore
   - 백업 파일 선택
   - 복원 실행

## 방법 4: Jenkins 파이프라인에 DB 초기화 추가

Jenkinsfile에 DB 초기화 단계를 추가할 수 있습니다.

```groovy
stage('Initialize Database') {
  steps {
    withCredentials([sshUserPrivateKey(...)]) {
      sh '''
        ssh ... "psql -h 192.168.132.81 -U postgres -d ohun -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
      '''
    }
  }
}
```

## 주의사항

⚠️ **운영 환경에서는 `synchronize: true`를 `false`로 변경하세요!**

`server/src/app.module.ts`:
```typescript
synchronize: false, // 운영 환경에서는 false로 설정
```

운영 환경에서는 TypeORM 마이그레이션을 사용하는 것이 안전합니다.

## 확인 명령어

```bash
# 서버에서 테이블 목록 확인
psql -h 192.168.132.81 -U postgres -d ohun -c "\dt"

# 특정 테이블 구조 확인
psql -h 192.168.132.81 -U postgres -d ohun -c "\d users"
```
