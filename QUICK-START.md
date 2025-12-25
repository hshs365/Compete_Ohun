# 빠른 시작 가이드

## 백엔드 서버 실행

프로젝트 루트에서:

```bash
cd server
npm run start:dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 프론트엔드 실행

새 터미널에서:

```bash
cd client
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 카카오 OAuth 설정 (카카오 로그인 사용 시)

1. `server/.env` 파일에 다음 추가:
   ```env
   KAKAO_CLIENT_ID=your_rest_api_key
   KAKAO_CLIENT_SECRET=your_client_secret
   FRONTEND_URL=http://localhost:5173
   ```

2. 카카오 개발자 콘솔에서 Redirect URI 등록:
   - `http://localhost:5173/auth/oauth/callback?provider=kakao`

3. 서버 재시작

## 문제 해결

### "ERR_CONNECTION_REFUSED" 오류
- 백엔드 서버가 실행 중인지 확인
- 터미널에서 `npm run start:dev` 실행
- 서버가 정상적으로 시작되었는지 확인 (에러 메시지 확인)

### 포트 충돌
- 3000번 포트가 이미 사용 중이면 다른 프로세스를 종료하거나
- `.env` 파일에서 `PORT` 환경 변수 변경


