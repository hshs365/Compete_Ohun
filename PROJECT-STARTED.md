# 프로젝트 실행 완료

## 실행 상태

### 서버 (Backend)
- **포트**: 3000
- **상태**: 실행 중
- **URL**: http://localhost:3000

### 클라이언트 (Frontend)
- **포트**: 5173
- **상태**: 실행 중
- **URL**: http://localhost:5173

## 접속 방법

1. **프론트엔드**: 브라우저에서 http://localhost:5173 접속
2. **백엔드 API**: http://localhost:3000

## 서버 중지 방법

백그라운드로 실행 중인 서버를 중지하려면:

```powershell
# 포트 3000 사용 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료
Stop-Process -Id <PID번호> -Force
```

또는 모든 Node 프로세스 종료:
```powershell
Get-Process -Name node | Stop-Process -Force
```

## 클라이언트 중지 방법

```powershell
# 포트 5173 사용 프로세스 확인
netstat -ano | findstr :5173

# 프로세스 종료
Stop-Process -Id <PID번호> -Force
```

## 다음 실행 방법

**서버:**
```powershell
cd C:\Compete_Ohun\server
npm run start:dev
```

**클라이언트 (새 터미널):**
```powershell
cd C:\Compete_Ohun\client
npm run dev
```

## 문제 해결

### 서버가 시작되지 않으면
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- 데이터베이스 `ohun`이 존재하는지 확인

### 클라이언트가 시작되지 않으면
- 포트 5173이 이미 사용 중인지 확인
- `npm install`이 완료되었는지 확인


