# 서버 상태 확인 및 문제 해결

## 현재 문제
`ERR_CONNECTION_REFUSED` - 포트 3000에 연결할 수 없음

## 확인 사항

### 1. 서버 프로세스 확인
```powershell
netstat -ano | findstr :3000
```
결과가 없으면 서버가 실행되지 않은 것입니다.

### 2. PostgreSQL 서비스 확인
```powershell
Get-Service | Where-Object { $_.Name -like "*postgres*" }
```
서비스가 "Running" 상태여야 합니다.

### 3. 데이터베이스 연결 테스트
```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

### 4. 서버 실행 및 오류 확인
```powershell
cd server
npm run start:dev
```

## 일반적인 오류 및 해결

### 오류 1: "connect ECONNREFUSED 127.0.0.1:5432"
**원인**: PostgreSQL 서비스가 실행되지 않음
**해결**:
```powershell
# PostgreSQL 서비스 시작
Start-Service postgresql-x64-17
# 또는 서비스 관리자에서 시작
```

### 오류 2: "password authentication failed"
**원인**: .env 파일의 DB_PASSWORD가 잘못됨
**해결**: .env 파일의 DB_PASSWORD를 올바른 값으로 수정

### 오류 3: "database 'ohun' does not exist"
**원인**: 데이터베이스가 생성되지 않음
**해결**:
```sql
psql -U postgres
CREATE DATABASE ohun;
```

### 오류 4: "EADDRINUSE: address already in use :::3000"
**원인**: 포트 3000이 이미 사용 중
**해결**:
```powershell
# 포트 3000 사용 프로세스 종료
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

## 서버 정상 실행 확인

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO  [NestApplication] Nest application successfully started on http://[::1]:3000
```

## 빠른 해결 체크리스트

- [ ] PostgreSQL 서비스 실행 중
- [ ] .env 파일 존재 및 올바른 설정
- [ ] 데이터베이스 'ohun' 존재
- [ ] node_modules 설치됨
- [ ] 포트 3000 사용 가능
- [ ] 서버 실행 중 (npm run start:dev)

