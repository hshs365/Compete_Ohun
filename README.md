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

### 의존성 충돌
`--legacy-peer-deps` 플래그를 사용하여 설치:
```powershell
npm install --legacy-peer-deps
```

### 포트 충돌
포트가 이미 사용 중이면 기존 프로세스 종료:
```powershell
netstat -ano | findstr :3000
Stop-Process -Id <PID> -Force
```

## 👥 팀원 협업

**새로 참여하는 팀원은 반드시 확인하세요!**

- **TEAM-SETUP-GUIDE.md** - 팀원 협업 설정 가이드 (데이터베이스, 환경 변수, 카카오맵 설정)

## 📚 문서

### 주요 문서
- **PROJECT-PROGRESS.md** - 프로젝트 전체 진행 상황 및 완료된 기능
- **QUICK-START.md** - 빠른 시작 가이드
- **TROUBLESHOOTING.md** - 문제 해결 가이드
- **KAKAO-MAP-API-SETUP.md** - 카카오맵 API 설정 가이드

### 서버 문서
- **server/README.md** - 서버 설정 및 실행 가이드
- **server/DATABASE-SETUP.md** - 데이터베이스 설정 가이드
- **server/KAKAO-SETUP-GUIDE.md** - 카카오 OAuth 설정 가이드
- **server/README-OAUTH-SETUP.md** - OAuth 상세 설정

### 디자인 문서
- **docs/auth-system-design.md** - 인증 시스템 설계 문서

## 🗺️ 카카오맵 API 설정 (선택사항)

카카오맵 API를 사용하면 더 정확한 주소 변환이 가능합니다.

**빠른 설정**:
1. `client/.env` 파일 생성
2. 카카오 개발자 콘솔에서 REST API 키 발급
3. `.env` 파일에 추가:
   ```env
   VITE_KAKAO_JAVASCRIPT_KEY=your_javascript_key_here
   VITE_KAKAO_REST_API_KEY=your_rest_api_key_here
   ```
4. 클라이언트 재시작

**자세한 방법**: `KAKAO-MAP-API-SETUP.md` 참고

**참고**: API 키가 없어도 OpenStreetMap API로 동작합니다.


