# 프로젝트 이동 완료

## 이동 정보

- **원본 위치**: `C:\Users\hshs3\Documents\GitHub\Ohun`
- **새 위치**: `C:\Compete_Ohun`
- **이동 일시**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 이동 설정

- ✅ Git 히스토리 보존됨
- ✅ 모든 소스 파일 복사됨
- ⚠️ node_modules 제외됨 (용량 절약)

## 다음 단계

### 1. 의존성 설치

**클라이언트:**
```powershell
cd C:\Compete_Ohun\client
npm install
```

**서버:**
```powershell
cd C:\Compete_Ohun\server
npm install
```

### 2. 환경 변수 확인

`server\.env` 파일이 올바르게 복사되었는지 확인:
- DB_HOST=localhost
- DB_PORT=5432
- DB_USERNAME=postgres
- DB_PASSWORD=postgres123
- DB_NAME=ohun
- JWT_SECRET=your-secret-key-change-in-production-12345
- PORT=3000
- FRONTEND_URL=http://localhost:5173

### 3. Git 원격 저장소 확인

현재 원격 저장소:
```
origin  git@github.com:hshs365/ohun.git
```

새 저장소로 변경하려면:
```powershell
cd C:\Compete_Ohun
git remote set-url origin <새_저장소_URL>
```

### 4. 프로젝트 실행 테스트

**서버 실행:**
```powershell
cd C:\Compete_Ohun\server
npm run start:dev
```

**클라이언트 실행 (새 터미널):**
```powershell
cd C:\Compete_Ohun\client
npm run dev
```

## 확인 사항

- [x] 모든 소스 파일 복사됨
- [x] Git 히스토리 보존됨
- [x] .git 폴더 복사됨
- [ ] node_modules 설치 필요 (npm install)
- [ ] .env 파일 확인 필요
- [ ] 프로젝트 실행 테스트 필요

## 원본 폴더 정리

새 위치에서 모든 것이 정상 작동하는 것을 확인한 후, 원본 폴더(`C:\Users\hshs3\Documents\GitHub\Ohun`)를 삭제할 수 있습니다.

**주의**: 원본 폴더를 삭제하기 전에 새 위치에서 모든 것이 정상 작동하는지 반드시 확인하세요!


