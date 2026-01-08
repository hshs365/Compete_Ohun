# 팀원 협업 설정 가이드

이 가이드는 프로젝트에 새로 참여하는 팀원을 위한 설정 가이드입니다.

## 📋 목차
1. [프로젝트 클론 및 설치](#1-프로젝트-클론-및-설치)
2. [데이터베이스 설정](#2-데이터베이스-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [카카오맵 API 설정](#4-카카오맵-api-설정)
5. [서버 및 클라이언트 실행](#5-서버-및-클라이언트-실행)

---

## 1. 프로젝트 클론 및 설치

### 1-1. 프로젝트 클론
```powershell
git clone <저장소_URL>
cd Compete_Ohun
```

### 1-2. 의존성 설치

**서버:**
```powershell
cd server
npm install --legacy-peer-deps
```

**클라이언트:**
```powershell
cd client
npm install --legacy-peer-deps
```

---

## 2. 데이터베이스 설정

### 방법 1: 각자 로컬 데이터베이스 사용 (권장)

각 팀원이 자신의 컴퓨터에 PostgreSQL을 설치하고 로컬 데이터베이스를 사용합니다.

#### 2-1. PostgreSQL 설치

**Windows:**
- https://www.postgresql.org/download/windows/ 에서 다운로드
- 또는 Chocolatey: `choco install postgresql`

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 2-2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ohun;

# 종료
\q
```

#### 2-3. 서버 환경 변수 설정

`server/.env` 파일 생성 (아래 3번 섹션 참고)

### 방법 2: 공유 데이터베이스 서버 사용

팀에서 공유하는 데이터베이스 서버를 사용하는 경우:

1. 팀 리더 또는 DBA에게 데이터베이스 접속 정보 요청
2. `server/.env` 파일에 공유 서버 정보 입력:
   ```env
   DB_HOST=공유_서버_주소
   DB_PORT=5432
   DB_USERNAME=공유_사용자명
   DB_PASSWORD=공유_비밀번호
   DB_NAME=ohun
   ```

**주의사항:**
- 공유 데이터베이스는 모든 팀원이 같은 데이터를 사용합니다
- 개발 중 데이터가 덮어씌워질 수 있으므로 주의하세요
- 가능하면 각자 로컬 DB를 사용하는 것을 권장합니다

### 방법 3: Docker 사용 (선택사항)

Docker를 사용하면 데이터베이스 설정이 더 간단합니다:

```bash
# docker-compose.yml 파일이 있다면
docker-compose up -d

# 또는 직접 PostgreSQL 컨테이너 실행
docker run --name ohun-postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=ohun \
  -p 5432:5432 \
  -d postgres:15
```

---

## 3. 환경 변수 설정

### 3-1. 서버 환경 변수

`server/.env` 파일 생성:

```powershell
cd server
Copy-Item env-template.txt .env
```

`.env` 파일을 열어서 다음 내용을 실제 값으로 수정:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=여기에_설치시_설정한_postgresql_비밀번호
DB_NAME=ohun

# JWT 설정
JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=3000
FRONTEND_URL=http://localhost:5173

# 카카오 OAuth (카카오 로그인 사용 시)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 구글 OAuth (구글 로그인 사용 시)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**중요:**
- `DB_PASSWORD`는 PostgreSQL 설치 시 설정한 비밀번호로 변경
- `.env` 파일은 Git에 커밋하지 않습니다 (이미 `.gitignore`에 포함됨)

### 3-2. 클라이언트 환경 변수

`client/.env` 파일 생성:

```powershell
cd client
```

`.env` 파일 생성 및 내용 입력:

```env
# API 베이스 URL
VITE_API_BASE_URL=http://localhost:3000

# 카카오맵 API 키 (아래 4번 섹션 참고)
VITE_KAKAO_JAVASCRIPT_KEY=your_javascript_key_here
VITE_KAKAO_REST_API_KEY=your_rest_api_key_here
```

---

## 4. 카카오맵 API 설정

카카오 지도가 보이도록 하려면 카카오맵 API 키가 필요합니다.

### 4-1. 카카오 개발자 콘솔 접속

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인

### 4-2. 애플리케이션 생성 (처음인 경우)

1. "내 애플리케이션" → "애플리케이션 추가하기"
2. 앱 이름 입력 (예: "Ohun")
3. 저장

### 4-3. API 키 확인

1. 생성한 애플리케이션 선택
2. "앱 키" 탭에서 다음 키 확인:
   - **JavaScript 키** (지도 표시용)
   - **REST API 키** (주소 변환용)

### 4-4. 플랫폼 설정

1. "앱 설정" → "플랫폼" → "Web 플랫폼 등록"
2. 사이트 도메인 입력: `http://localhost:5173`
3. 저장

### 4-5. 카카오맵 활성화

1. "제품 설정" → "카카오맵"
2. "사용 설정" → "상태"를 **ON**으로 변경
3. "추가 기능 신청"에서 카카오맵 승인 확인

### 4-6. JavaScript SDK 도메인 등록

1. "앱 설정" → "앱" → "플랫폼 키"
2. "JavaScript 키" 섹션에서 "JavaScript SDK 도메인" 등록
3. `http://localhost:5173` 입력
4. 저장

### 4-7. 환경 변수에 추가

`client/.env` 파일에 추가:

```env
VITE_KAKAO_JAVASCRIPT_KEY=여기에_JavaScript_키_붙여넣기
VITE_KAKAO_REST_API_KEY=여기에_REST_API_키_붙여넣기
```

### 4-8. 클라이언트 재시작

```powershell
cd client
npm run dev
```

**참고:**
- API 키가 없어도 OpenStreetMap API로 동작하지만, 카카오 지도는 표시되지 않습니다
- 팀원 모두 같은 API 키를 사용하거나, 각자 발급받을 수 있습니다
- 같은 앱의 키를 공유하면 사용량이 합산됩니다

---

## 5. 서버 및 클라이언트 실행

### 5-1. 서버 실행

```powershell
cd server
npm run start:dev
```

서버가 정상적으로 시작되면:
- `http://localhost:3000`에서 실행
- TypeORM이 자동으로 테이블 생성
- "Nest application successfully started" 메시지 확인

### 5-2. 클라이언트 실행

새 터미널에서:

```powershell
cd client
npm run dev
```

클라이언트가 정상적으로 시작되면:
- `http://localhost:5173`에서 실행
- 브라우저에서 자동으로 열림

---

## ✅ 설정 확인 체크리스트

- [ ] 프로젝트 클론 완료
- [ ] 서버 의존성 설치 완료 (`npm install`)
- [ ] 클라이언트 의존성 설치 완료 (`npm install`)
- [ ] PostgreSQL 설치 및 실행 중
- [ ] 데이터베이스 `ohun` 생성 완료
- [ ] `server/.env` 파일 생성 및 설정 완료
- [ ] `client/.env` 파일 생성 및 설정 완료
- [ ] 카카오맵 API 키 발급 및 설정 완료
- [ ] 서버 실행 성공 (`http://localhost:3000`)
- [ ] 클라이언트 실행 성공 (`http://localhost:5173`)
- [ ] 홈 화면에서 카카오 지도 표시 확인

---

## 🆘 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL 서비스가 실행 중인지 확인
- `server/.env`의 데이터베이스 정보 확인
- 데이터베이스가 생성되었는지 확인

### 카카오 지도가 보이지 않음
- `client/.env` 파일에 API 키가 설정되었는지 확인
- 클라이언트를 재시작했는지 확인
- 브라우저 개발자 도구 콘솔에서 에러 확인
- 카카오 개발자 콘솔에서 JavaScript SDK 도메인 등록 확인

### 포트 충돌
- 포트 3000 또는 5173이 이미 사용 중이면:
  ```powershell
  # 포트 사용 중인 프로세스 확인
  netstat -ano | findstr :3000
  
  # 프로세스 종료
  Stop-Process -Id <PID> -Force
  ```

자세한 문제 해결은 **TROUBLESHOOTING.md** 참고

---

## 📚 추가 문서

- **README.md** - 프로젝트 개요 및 빠른 시작
- **QUICK-START.md** - 빠른 시작 가이드
- **TROUBLESHOOTING.md** - 문제 해결 가이드
- **KAKAO-MAP-API-SETUP.md** - 카카오맵 API 상세 설정
- **server/DATABASE-SETUP.md** - 데이터베이스 상세 설정
- **server/KAKAO-SETUP-GUIDE.md** - 카카오 OAuth 설정

---

## 💡 팀 협업 팁

### 데이터베이스 공유 방법

1. **각자 로컬 DB 사용 (권장)**
   - 각자 컴퓨터에 PostgreSQL 설치
   - 개발 중 데이터 충돌 없음
   - 독립적인 개발 환경

2. **공유 DB 서버**
   - 팀 전용 데이터베이스 서버 사용
   - 모든 팀원이 같은 데이터 공유
   - 주의: 데이터 덮어쓰기 가능

3. **Docker 사용**
   - `docker-compose.yml`로 통일된 환경
   - 설정이 간단함 

### API 키 공유

- **옵션 1**: 팀 리더가 발급한 키를 공유 (같은 앱 사용)
- **옵션 2**: 각자 발급 (각자 앱 사용, 사용량 분산)

### Git 워크플로우

- `main` 브랜치는 안정 버전 유지
- 기능 개발은 별도 브랜치에서
- Pull Request로 코드 리뷰 후 병합

---

**마지막 업데이트**: 2024년
**질문이나 문제가 있으면 팀 리더에게 문의하세요!**


