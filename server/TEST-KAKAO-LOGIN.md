# 카카오 로그인 테스트 가이드

## 현재 상태 확인

✅ 서버 정상 실행 중 (포트 3000)
✅ 데이터베이스 연결 성공
✅ 모든 API 엔드포인트 매핑 완료:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/social/auth-url
- POST /api/auth/social/callback
- POST /api/auth/complete-profile
- GET /api/auth/check-nickname
- GET /api/auth/me

## 카카오 로그인 테스트를 위한 준비

### 1. .env 파일 확인

`server/.env`에 다음이 설정되어 있어야 합니다:

```env
KAKAO_CLIENT_ID=your_rest_api_key_here
KAKAO_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=http://localhost:5173
```

### 2. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 선택
3. 제품 설정 > 카카오 로그인 > Redirect URI 등록:
   - `http://localhost:5173/auth/oauth/callback?provider=kakao`
4. 앱 설정 > 앱 키에서 REST API 키 확인 → `KAKAO_CLIENT_ID`
5. 제품 설정 > 카카오 로그인 > 보안에서 Client Secret 생성 → `KAKAO_CLIENT_SECRET`

### 3. 테스트 방법

1. 프론트엔드 실행:
   ```bash
   cd client
   npm run dev
   ```

2. 브라우저에서 `http://localhost:5173/login` 접속

3. "카카오톡으로 로그인" 버튼 클릭

4. 예상 동작:
   - 카카오 로그인 페이지로 리다이렉트
   - 카카오 계정으로 로그인 및 동의
   - `/auth/oauth/callback?provider=kakao&code=...`로 리다이렉트
   - 추가 정보 입력 페이지로 이동 (신규 사용자)
   - 또는 메인 페이지로 이동 (기존 사용자)

## 문제 해결

### "KAKAO_CLIENT_ID가 설정되지 않았습니다"
- `.env` 파일에 `KAKAO_CLIENT_ID` 값이 있는지 확인
- 서버 재시작

### Redirect URI 오류
- 카카오 개발자 콘솔의 Redirect URI가 정확히 일치하는지 확인
- `http://localhost:5173/auth/oauth/callback?provider=kakao` (쿼리 파라미터 포함)

### 데이터베이스 테이블 확인

서버가 정상 시작되면 테이블이 자동 생성됩니다:

```bash
psql -U postgres -d ohun
\dt  -- 테이블 목록 확인
\d users  -- users 테이블 구조 확인
\d social_accounts  -- social_accounts 테이블 구조 확인
```

## 성공 확인

카카오 로그인 성공 시:
- `users` 테이블에 새 레코드 생성
- `social_accounts` 테이블에 카카오 계정 정보 저장
- JWT 토큰 발급
- 추가 정보 입력 페이지로 이동

테스트 결과를 알려주세요!


