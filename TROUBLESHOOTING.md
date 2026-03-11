# 문제 해결 가이드

## 🔴 ERR_CONNECTION_REFUSED 에러 해결

### 증상
브라우저 콘솔에 다음과 같은 에러가 표시됨:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:3000/api/auth/me:1
```

### 원인
백엔드 서버가 실행되지 않았거나, 연결할 수 없는 상태입니다.

### 해결 방법

#### 1단계: 서버 실행 확인
```powershell
# 서버 디렉토리로 이동
cd C:\Compete_Ohun\server

# 서버 실행
npm run start:dev
```

**정상 실행 시 다음과 같은 메시지가 표시됩니다:**
```
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] AppModule dependencies initialized
[Nest] INFO  [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO  [NestApplication] Nest application successfully started
```

#### 2단계: 포트 충돌 확인
만약 "포트가 이미 사용 중"이라는 에러가 나오면:

```powershell
# 포트 3000을 사용하는 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
Stop-Process -Id <PID> -Force

# 서버 재시작
npm run start:dev
```

#### 3단계: 데이터베이스 연결 확인
서버가 시작되지만 데이터베이스 연결 에러가 나오면:

1. PostgreSQL이 실행 중인지 확인
2. `server/.env` 파일 확인:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_NAME=ohun
   ```

#### 4단계: CORS 설정 확인
서버는 실행되지만 브라우저에서 연결이 안 되면:

`server/src/main.ts`에서 CORS 설정 확인:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

`server/.env` 파일에 다음이 있는지 확인:
```env
FRONTEND_URL=http://localhost:5173
```

### 빠른 체크리스트

- [ ] 서버가 실행 중인가? (`npm run start:dev`)
- [ ] 포트 3000이 사용 가능한가? (`netstat -ano | findstr :3000`)
- [ ] 데이터베이스가 실행 중인가? (PostgreSQL)
- [ ] `.env` 파일이 올바르게 설정되어 있는가?
- [ ] 클라이언트가 `http://localhost:5173`에서 실행 중인가?

### 추가 디버깅

#### 서버 로그 확인
서버 터미널에서 에러 메시지 확인:
- 데이터베이스 연결 에러
- 포트 충돌 에러
- 모듈 로딩 에러

#### 브라우저 개발자 도구 확인
1. F12로 개발자 도구 열기
2. Network 탭에서 실패한 요청 확인
3. Console 탭에서 JavaScript 에러 확인

#### API 직접 테스트
브라우저에서 직접 접속:
```
http://localhost:3000
```
"Hello World" 같은 응답이 나오면 서버는 정상입니다.

### 일반적인 문제들

#### 문제 1: 서버가 시작되지 않음
**해결**: 
- `node_modules` 재설치: `npm install --legacy-peer-deps`
- TypeScript 컴파일 에러 확인
- 환경 변수 파일 확인

#### 문제 2: 데이터베이스 연결 실패
**해결**:
- PostgreSQL 서비스가 실행 중인지 확인
- 데이터베이스가 생성되어 있는지 확인
- `.env` 파일의 데이터베이스 정보 확인

#### 문제 3: CORS 에러
**해결**:
- `server/src/main.ts`의 CORS 설정 확인
- `FRONTEND_URL` 환경 변수 확인
- 브라우저 캐시 클리어

---

## 🔴 회원가입 시 500 Internal Server Error (배포 서버)

### 증상
- Jenkins로 빌드·배포한 뒤 회원가입(5/5 단계 제출) 시 **"Internal server error"** 팝업
- 브라우저 콘솔: `api/auth/register` 요청이 **500** 응답

### 원인 파악 방법 (서버에 직접 접속이 어려울 때)
개발 PC에서 배포 서버 루트에 접근할 수 없어도, **서버에서 명령을 실행한 결과만 공유**해 주면 원인 분석이 가능합니다.

**단계별 점검 가이드**: [docs/troubleshooting-register-500.md](docs/troubleshooting-register-500.md)

1. **가장 먼저**: 배포 서버에서 `pm2 logs backend --lines 150` 실행 후, **`[POST /api/auth/register] 회원가입 실패:`** 뒤에 나오는 **에러 메시지·스택**을 복사해 공유
2. 이어서: DB 연결(.env, `psql` 테스트), 테이블 존재 여부(`\dt`), 환경 변수 등은 가이드의 Step 1~7 순서대로 실행한 결과를 공유

가이드에 따라 서버 측 출력을 가져오시면, 그 결과를 바탕으로 원인과 수정 방법을 안내할 수 있습니다.

---

## 🔴 세션 유지 안 됨 / 새로고침 시 "로그인이 필요합니다" / 사용자 정보 로드 실패

### 증상
- 로그인 후 새로고침하면 다시 로그인 화면으로 돌아감
- 내 정보 페이지에서 "사용자 정보를 불러오는 중..."에서 멈추거나 "로그인이 필요합니다" 모달만 뜸

### 원인
앱은 로그인 시 **JWT 토큰**을 `localStorage` 또는 `sessionStorage`에 저장하고, 매 페이지 로드 시 `GET /api/auth/me`로 사용자 정보를 가져옵니다. 이 요청이 **401**을 반환하면 토큰을 지우고 로그인 화면으로 처리합니다.

가능한 원인:
1. **서버에서 /api/auth/me가 401 반환**  
   - JWT 서명 시 사용한 `JWT_SECRET`과 서버 `.env`의 `JWT_SECRET`이 다름 (배포 서버 vs 로컬)  
   - 토큰 만료 (`JWT_EXPIRES_IN` 확인)
2. **Nginx가 Authorization 헤더를 전달하지 않음**  
   - `/api`를 백엔드로 프록시할 때 `Authorization` 헤더가 빠지면 백엔드가 토큰을 못 받아 401 발생
3. **CORS / 쿠키**  
   - 프론트는 `Authorization: Bearer <token>`으로 보내므로, 같은 도메인(allcourtplay.com)이면 CORS보다는 **프록시·헤더 전달** 문제일 가능성이 큼

### 해결 방법

1. **서버 로그 확인**  
   배포 서버에서:  
   `pm2 logs backend --lines 200`  
   `/api/auth/me` 요청 시 401이 나오는지, 에러 메시지가 있는지 확인.

2. **서버 .env 확인**  
   배포 서버의 `server/.env`에 `JWT_SECRET`이 로컬과 동일한 값으로 설정되어 있는지 확인. (값이 다르면 로그인 시 발급한 토큰이 서버에서 검증 실패.)

3. **Nginx 프록시 설정**  
   `/api`를 백엔드로 보낼 때 반드시 다음 헤더를 전달해야 합니다:
   ```nginx
   location /api {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header Authorization $http_authorization;   # ← 토큰 전달에 필요
       proxy_pass_request_headers on;
   }
   ```
   `Authorization $http_authorization` 또는 `proxy_pass_request_headers on;`으로 요청 헤더가 백엔드까지 전달되는지 확인.

4. **소셜 로그인 후 세션**  
   카카오/구글 등 로그인 직후에는 `remember_me`가 false라 토큰이 `sessionStorage`에도 들어갑니다. 새로고침 시 `checkAuth()`가 `/api/auth/me`를 호출하고, 위 조건(서버 JWT_SECRET, Nginx 헤더)이 맞아야 세션이 유지됩니다.

---

## 📁 서버 이미지 저장 경로 (프로필·업로드)

### 어떻게 확인하나요?
- **서버 기동 시 로그**에 다음이 한 줄 출력됩니다:  
  `📁 업로드 경로: /home/webmaster/my-app/server/uploads` (또는 `UPLOAD_DIR` 값)  
  → 이 경로가 **실제로 사용 중인 업로드 루트**입니다.
- **UPLOAD_DIR 설정 여부**: 서버가 사용하는 `server/.env`에 `UPLOAD_DIR=...`가 **있는지** 보면 됩니다.  
  - 없으면: `process.cwd() + '/uploads'` 사용 (pm2/node가 기동된 디렉터리 기준).  
  - 있으면: 그 값이 루트 (예: `/mnt/shared/uploads`).

### 실제 저장 위치
- **UPLOAD_DIR 미설정**: `process.cwd() + '/uploads'`  
  - 예: 앱을 `~/my-app/server`에서 실행하면 **`~/my-app/server/uploads`**
- **UPLOAD_DIR 설정 시**: 그 값 아래에 용도별 폴더  
  - 예: `UPLOAD_DIR=/mnt/shared/uploads` → 프로필 이미지 **`/mnt/shared/uploads/profile`**

### 용도별 하위 경로
| 용도       | 경로 (UPLOAD_DIR 미설정 시) | 경로 (UPLOAD_DIR 설정 시)   |
|-----------|-----------------------------|-----------------------------|
| 프로필 사진 | `uploads/profile`            | `{UPLOAD_DIR}/profile`      |
| 모임 이미지 | `uploads/groups`            | (코드상 `uploadConfig`는 cwd 기준) |
| 시설 이미지 | `uploads/facility`           | (동일)                      |
| 상품 이미지 | `uploads/product`           | (동일)                      |

프로필 이미지 업로드는 `server/src/auth/auth.service.ts`의 `uploadProfileImage()`에서 **`UPLOAD_DIR`이 있으면 `{UPLOAD_DIR}/profile`**, 없으면 **`{process.cwd()}/uploads/profile`**을 사용합니다.

### 브라우저에서 이미지가 안 보일 때
- API는 이미지 URL을 **`/uploads/profile/파일명`** 형태로 반환합니다.
- 배포 환경에서 프론트가 `allcourtplay.com`이면, `img src="/uploads/profile/xxx"` 요청은 **`https://allcourtplay.com/uploads/profile/xxx`**로 갑니다.
- **Nginx에서 `/uploads`를 백엔드로 프록시**해야 Nest가 제공하는 정적 파일(uploads 디렉터리)이 노출됩니다.
  - 예시 설정: `docs/nginx-uploads-example.conf` 참고
  ```nginx
  location /uploads {
      proxy_pass http://127.0.0.1:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```
- 서버에서 실제 파일 존재 여부 확인:  
  `ls -la ~/my-app/server/uploads/profile` (또는 `$UPLOAD_DIR/profile`)

---

## 📞 추가 도움

문제가 계속되면:
1. 서버 터미널의 전체 에러 메시지 확인
2. 브라우저 개발자 도구의 Network 탭 확인
3. `PROJECT-PROGRESS.md` 파일의 설정 확인




