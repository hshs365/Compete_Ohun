# Ohun 프로젝트

운동 모임 플랫폼 프로젝트입니다.

## 프로젝트 위치

**새 위치**: `C:\Compete_Ohun`

## 빠른 시작

### 1. 의존성 설치

**서버:**
```powershell
cd C:\Compete_Ohun\server
npm install --legacy-peer-deps
```

**클라이언트:**
```powershell
cd C:\Compete_Ohun\client
npm install --legacy-peer-deps
```

### 2. 서버 실행

```powershell
cd C:\Compete_Ohun\server
npm run start:dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

### 3. 클라이언트 실행

새 터미널에서:

```powershell
cd C:\Compete_Ohun\client
npm run dev
```

클라이언트는 `http://localhost:5173`에서 실행됩니다.

## 프로젝트 구조

```
C:\Compete_Ohun\
├── client/          # 프론트엔드 (React + Vite)
├── server/          # 백엔드 (NestJS + TypeORM)
├── docs/            # 문서
└── .git/            # Git 저장소
```

## 기술 스택

### 프론트엔드
- React 19
- Vite 7
- TypeScript
- Tailwind CSS 4
- React Router DOM 7
- React Leaflet (지도)

### 백엔드
- NestJS 11
- TypeScript
- TypeORM 0.3
- PostgreSQL
- JWT 인증
- Passport

## 환경 변수

`server/.env` 파일이 필요합니다:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun

JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Git 저장소

원격 저장소: `git@github.com:hshs365/ohun.git`

새 저장소로 변경하려면:
```powershell
git remote set-url origin <새_저장소_URL>
```

## 문제 해결

- **ERR_CONNECTION_REFUSED**: 백엔드 먼저 실행 (`cd server` → `npm run start:dev`), 로그에 "Nest application successfully started" 확인
- **의존성 충돌**: `npm install --legacy-peer-deps`
- **포트 충돌**: `netstat -ano | findstr :3000` → `Stop-Process -Id <PID> -Force` 또는 `.env`에서 `PORT` 변경

자세한 내용은 **TROUBLESHOOTING.md** 참고.

## 👥 팀원 협업

**새로 참여하는 팀원은 반드시 확인하세요!**

- **TEAM-SETUP-GUIDE.md** - 팀원 협업 설정 가이드 (데이터베이스, 환경 변수, 카카오맵 설정)

## 📚 문서

- **TEAM-SETUP-GUIDE.md** - 팀원 협업 설정 체크리스트 (상세는 각 문서 링크)
- **PROJECT-PROGRESS.md** - 진행 상황 및 완료 기능
- **TROUBLESHOOTING.md** - 문제 해결 (ERR_CONNECTION_REFUSED, CORS, DB 등)
- **docs/** - 상세 가이드:
  - **docs/database-setup.md** - DB 설치·생성·초기화·원격 접속
  - **docs/environment-setup-guide.md** - Dev/Prod 환경변수
  - **docs/kakao-oauth-setup.md** - 카카오 로그인
  - **docs/kakao-map-api-setup.md** - 카카오맵(지도·지오코딩)
  - **docs/naver-map-api-setup-guide.md** - 네이버 지도
  - **docs/troubleshooting-bcrypt-error.md** - bcrypt 오류
  - **docs/database-schema-reference.md** - 스키마 참고
  - **docs/auth-system-design.md** - 인증 설계  
  - 배포·NFS·마이그레이션 등: **docs/** 폴더 내 해당 가이드 참고


