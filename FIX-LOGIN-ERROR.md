# 로그인 오류 해결 방법

## 문제 상황

로그인 시도 시 `ERR_CONNECTION_REFUSED` 오류가 발생합니다.
이는 백엔드 서버가 실행되지 않았거나, 올바르게 실행되지 않았기 때문입니다.

## 해결 방법

### 1. 기존 프로세스 종료

포트 3000을 사용 중인 프로세스가 있다면 종료:

```powershell
# 포트 3000을 사용하는 프로세스 종료
Stop-Process -Id 12636 -Force

# 또는 모든 Node 프로세스 종료 (주의!)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2. 서버 실행

새 터미널 창을 열고:

```bash
cd server
npm run start:dev
```

서버가 정상적으로 시작되면 다음 메시지가 표시됩니다:
```
[Nest] INFO  [NestApplication] Nest application successfully started on http://[::1]:3000
```

### 3. 클라이언트 실행 확인

클라이언트가 실행 중인지 확인:

```bash
cd client
npm run dev
```

### 4. 브라우저에서 확인

- 클라이언트: http://localhost:5173
- 서버 API: http://localhost:3000

## 문제가 계속되면

1. **서버 터미널에 오류 메시지가 있는지 확인**
2. **데이터베이스 연결 오류인지 확인** (PostgreSQL이 실행 중인지)
3. **.env 파일이 올바른지 확인**

## 빠른 확인

두 개의 터미널 창이 필요합니다:

**터미널 1 (서버):**
```bash
cd C:\Users\hshs3\Documents\GitHub\Ohun\server
npm run start:dev
```

**터미널 2 (클라이언트):**
```bash
cd C:\Users\hshs3\Documents\GitHub\Ohun\client
npm run dev
```

두 서버가 모두 실행되어야 로그인이 작동합니다!

