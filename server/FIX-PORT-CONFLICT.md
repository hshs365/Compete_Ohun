# 포트 충돌 문제 해결

## 문제
`EADDRINUSE: address already in use :::3000` 에러는 포트 3000이 이미 사용 중일 때 발생합니다.

## 해결 방법

### 방법 1: 기존 프로세스 종료 (권장)

Windows PowerShell에서:

```powershell
# 포트 3000을 사용하는 프로세스 찾기
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# 프로세스 ID 확인 후 종료
Stop-Process -Id <프로세스ID> -Force
```

또는 한 줄로:

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### 방법 2: 다른 포트 사용

`.env` 파일에 다른 포트 설정:

```env
PORT=3001
```

### 방법 3: 모든 Node 프로세스 종료 (주의)

```powershell
Get-Process -Name node | Stop-Process -Force
```

## 확인

포트가 비어있는지 확인:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

결과가 없다면 포트가 비어있습니다.

## 이후

프로세스를 종료한 후 서버를 다시 실행:

```bash
cd server
npm run start:dev
```


