# 데이터베이스 연결 확인 방법

## 서버 실행 및 연결 확인

터미널에서 다음 명령어를 실행하세요:

```bash
cd server
npm run start:dev
```

## 정상 연결 시 나타나는 메시지

✅ 성공:
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO  [InstanceLoader] AppModule dependencies initialized
[Nest] INFO  [NestApplication] Nest application successfully started on http://[::1]:3000
```

또는

```
QueryRunner has been released and cannot be used anymore.
[Nest] 12345  - 01/01/2024, 12:00:00 AM     LOG [TypeORM] synchronizing database schema...
[Nest] 12345  - 01/01/2024, 12:00:00 AM     LOG [TypeORM] database schema has been synchronized
```

## 연결 실패 시 나타나는 오류

❌ 실패 예시:

1. **인증 실패**:
   ```
   error: password authentication failed for user "postgres"
   ```
   → `.env`의 `DB_PASSWORD` 확인

2. **데이터베이스 없음**:
   ```
   error: database "ohun" does not exist
   ```
   → 데이터베이스 생성 필요

3. **연결 거부**:
   ```
   connect ECONNREFUSED 127.0.0.1:5432
   ```
   → PostgreSQL 서비스가 실행 중인지 확인

4. **타임아웃**:
   ```
   connect ETIMEDOUT
   ```
   → 방화벽 또는 네트워크 설정 확인

## 현재 설정 확인

`.env` 파일의 다음 값들이 올바른지 확인:
- DB_HOST=localhost
- DB_PORT=5432
- DB_USERNAME=postgres
- DB_PASSWORD=postgres123
- DB_NAME=ohun

## 문제 해결

연결이 안 되면 터미널에 나타나는 정확한 오류 메시지를 알려주세요!


