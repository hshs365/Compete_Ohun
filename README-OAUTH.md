# OAuth 연동 가이드

## 백엔드 환경 변수 설정

`server/.env` 파일에 다음 환경 변수를 설정해주세요:

```env
# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL (Callback URL 설정 시 필요)
FRONTEND_URL=http://localhost:5173
```

## 카카오 OAuth 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 등록
3. 플랫폼 설정: Web 플랫폼 추가
   - 사이트 도메인: `http://localhost:5173` (개발 환경)
4. 카카오 로그인 활성화
5. Redirect URI 등록:
   - `http://localhost:5173/auth/oauth/callback?provider=kakao`
6. 동의 항목 설정:
   - 필수: 닉네임, 프로필 사진
   - 선택: 카카오계정(이메일)
7. REST API 키와 Client Secret 확인 후 `.env`에 설정

## 구글 OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. API 및 서비스 > 사용자 인증 정보
4. OAuth 2.0 클라이언트 ID 만들기
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `http://localhost:5173/auth/oauth/callback?provider=google`
5. 클라이언트 ID와 클라이언트 보안 비밀번호 확인 후 `.env`에 설정

## OAuth 플로우

1. 사용자가 소셜 로그인 버튼 클릭
2. 프론트엔드에서 `/api/auth/social/auth-url?provider=kakao` 또는 `provider=google` 호출
3. 백엔드에서 OAuth 인증 URL과 state 반환
4. 프론트엔드에서 해당 URL로 리다이렉트
5. 사용자가 OAuth provider에서 로그인
6. OAuth provider가 `/auth/oauth/callback?provider=xxx&code=xxx&state=xxx`로 리다이렉트
7. 프론트엔드 OAuthCallbackPage에서 백엔드 `/api/auth/social/callback` 호출
8. 백엔드에서 code를 access token으로 교환하고 사용자 정보 조회
9. 사용자 정보를 기반으로 로그인 처리 (신규 사용자면 추가 정보 입력 페이지로)

## 테스트

1. 백엔드 서버 실행: `cd server && npm run start:dev`
2. 프론트엔드 실행: `cd client && npm run dev`
3. 로그인 페이지에서 카카오 또는 구글 로그인 버튼 클릭
4. OAuth provider에서 로그인
5. 추가 정보 입력 페이지로 이동 (신규 사용자의 경우)
6. 추가 정보 입력 후 메인 페이지로 이동


