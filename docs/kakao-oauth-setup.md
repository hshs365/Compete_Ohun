# 카카오 OAuth 설정 (로그인)

## 1. 카카오 개발자 콘솔

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속 후 로그인
2. 내 애플리케이션 → 애플리케이션 추가하기 → 앱 이름 입력(예: Ohun) → 저장

## 2. 플랫폼 설정

- 앱 설정 → 플랫폼 → Web 플랫폼 등록
- 사이트 도메인: `http://localhost:5173` (개발), 운영 시 실제 도메인 추가

## 3. 카카오 로그인

- 제품 설정 → 카카오 로그인 → 활성화 설정 **ON**
- Redirect URI 등록: `http://localhost:5173/auth/oauth/callback?provider=kakao`  
  (대소문자·슬래시·쿼리 파라미터 정확히 일치)

## 4. 동의 항목

- 닉네임, 프로필 사진: 필수 동의
- 이메일: 필요 시 선택 동의

## 5. 키 확인

- 앱 설정 → 앱 키: **REST API 키** = `KAKAO_CLIENT_ID`
- 제품 설정 → 카카오 로그인 → 보안: **Client Secret** 생성 후 복사 = `KAKAO_CLIENT_SECRET`

## 6. server/.env

```env
KAKAO_CLIENT_ID=여기에_REST_API_키
KAKAO_CLIENT_SECRET=여기에_Client_Secret
FRONTEND_URL=http://localhost:5173
```

저장 후 서버 재시작.

## 문제 해결

- "KAKAO_CLIENT_ID가 설정되지 않았습니다" → `.env` 값·재시작 확인
- Redirect URI 오류 → 콘솔에 등록한 URI와 정확히 동일한지 확인
- Client Secret은 외부 공개 금지, `.env`는 `.gitignore` 유지
