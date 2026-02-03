# 테스트 실행 가이드

## 현재 테스트 구성

### 서버 (NestJS)

| 종류 | 위치 | 실행 명령 | 비고 |
|------|------|-----------|------|
| **단위 테스트** | `server/src/**/*.spec.ts` | `cd server && npm test` | Jest, `app.controller.spec.ts` 1개 |
| **E2E 테스트** | `server/test/*.e2e-spec.ts` | `cd server && npm run test:e2e` | `AppModule` 전체 로드 → DB/Redis 필요할 수 있음 |

### 클라이언트 (Vite + React)

- **테스트 스크립트/파일 없음**  
  - `client/package.json`에 `test` 스크립트 없음  
  - `*.test.tsx`, `*.spec.tsx` 파일 없음  
  - 필요 시 Vitest 등 도입 후 `npm run test` 추가 가능

---

## 수정해 둔 내용

1. **`server/src/app.controller.spec.ts`**  
   - 기대값을 실제 컨트롤러 응답에 맞춤  
   - `getHello()`가 `{ message: 'Ohun API Server', status: 'running', api: '/api' }` 를 반환하므로, 이 객체와 일치하도록 `expect` 수정

2. **`server/test/app.e2e-spec.ts`**  
   - `GET /` 응답을 `'Hello World!'` 문자열이 아니라 JSON 객체로 검증하도록 수정  
   - `message`, `status`, `api` 필드가 위와 같음을 `toMatchObject`로 검증

---

## 실행 방법

### 서버 단위 테스트

```powershell
cd c:\Compete_Ohun\server
npm test
```

- DB/Redis 없이 실행 가능  
- `spawn EPERM` 등으로 실패하면: 터미널을 관리자 권한으로 열거나, 다른 터미널(CMD/PowerShell 새 창)에서 동일 명령 실행

### 서버 E2E 테스트

```powershell
cd c:\Compete_Ohun\server
npm run test:e2e
```

- `AppModule`을 로드하므로 **DB 연결 필요** (TypeORM)  
- `.env`에 `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` 등 설정 후 실행  
- Redis는 `REDIS_ENABLED`/`REDIS_HOST`에 따라 선택 사용이므로, 개발 환경이면 없어도 됨

### 클라이언트 테스트

- 현재 **실행할 테스트 없음**  
- 나중에 Vitest + React Testing Library 등을 추가한 뒤 `client/package.json`에 예를 들어  
  `"test": "vitest"`, `"test:run": "vitest run"` 등을 넣고 `npm run test` 로 실행 가능

---

## 지나쳤을 수 있는 포인트

1. **서버 단위/ E2E 기대값**  
   - 초기 Nest 템플릿은 `getHello()` → `'Hello World!'` 인데, 현재 앱은 JSON 객체를 반환  
   - 위와 같이 spec / e2e를 실제 응답에 맞춰 수정해 두었음

2. **E2E는 DB 필요**  
   - `test:e2e`는 `AppModule` 전체를 띄우므로 로컬 PostgreSQL 등 DB가 떠 있어야 할 수 있음  
   - DB 없이 실행하면 TypeORM 연결 오류로 실패할 수 있음

3. **클라이언트 테스트 부재**  
   - 프론트는 테스트 스크립트/파일이 없어서 `npm test` 같은 건 없음  
   - 원하면 Vitest 등으로 추가하는 단계가 필요함

4. **CORS 오류 (이미지 기준)**  
   - “CORS 정책에 의해 차단되었습니다” 는 **요청 Origin**이 허용 목록에 없을 때 발생  
   - 개발 시: `http://localhost:5173` 또는 `http://127.0.0.1:5173` 으로 접속해야 함  
   - 다른 포트(예: 5174)나 `https` 로 접속하면 CORS에 걸릴 수 있음  
   - 필요하면 `server/.env`에 `FRONTEND_URL=http://localhost:5174` 처럼 사용 중인 주소를 추가

---

## 한 번에 확인하려면

```powershell
# 1. 서버 단위 테스트
cd c:\Compete_Ohun\server
npm test

# 2. (DB 켜져 있을 때) 서버 E2E
npm run test:e2e
```

클라이언트는 위와 같이 “실행해볼 테스트”가 아직 없으므로, 서버 두 가지만 실행해 보면 됩니다.
