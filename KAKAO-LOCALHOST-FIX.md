# 카카오 localhost 설정 - 간단한 해결책

## 핵심: 플랫폼 설정은 필수가 아닙니다!

카카오 개발자 콘솔에서 **사이트 도메인(플랫폼 설정)을 건너뛰고** 다음만 설정하면 됩니다:

## 필수 설정 (이것만 하면 됩니다)

### 1. Redirect URI 등록
1. 제품 설정 > 카카오 로그인 > Redirect URI
2. Redirect URI 등록 클릭
3. 입력: `http://localhost:5173/auth/oauth/callback?provider=kakao`
4. 저장

### 2. 동의 항목 설정
1. 제품 설정 > 카카오 로그인 > 동의항목
2. 필수 동의:
   - 닉네임
   - 프로필 사진

### 3. REST API 키 및 Client Secret 확인
1. 앱 설정 > 앱 키 > **REST API 키** 복사
2. 제품 설정 > 카카오 로그인 > 보안 > **Client Secret** 생성 및 복사

## .env 파일 설정

`server/.env`에 추가:

```env
KAKAO_CLIENT_ID=복사한_REST_API_키
KAKAO_CLIENT_SECRET=복사한_Client_Secret
FRONTEND_URL=http://localhost:5173
```

## 서버 재시작 후 테스트

플랫폼 설정 없이도 이렇게만 하면 작동합니다!

## 참고

- 플랫폼 설정의 "사이트 도메인"은 **선택사항**입니다
- Redirect URI만 정확히 설정하면 됩니다
- 개발 환경에서는 이 방법으로 충분합니다


