# 구글 로그인 설정 가이드

구글 OAuth 2.0을 사용한 소셜 로그인 기능을 설정하는 방법입니다.

## 1. Google Cloud Console 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 후 로그인
2. 상단 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: Allcourtplay) → **만들기**

## 2. OAuth 동의 화면 설정

1. 왼쪽 메뉴 **API 및 서비스** → **OAuth 동의 화면**
2. **User Type**: 외부(External) 선택 → **만들기**
3. **앱 정보** 입력:
   - 앱 이름: `Allcourtplay` (또는 원하는 이름)
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. **저장 후 계속**
5. **범위** 화면에서 **추가 또는 삭제** 클릭
   - `.../auth/userinfo.email` (이메일)
   - `.../auth/userinfo.profile` (프로필 정보)
   - `openid` (OpenID Connect)
   - 추가 후 **저장 후 계속**
6. **테스트 사용자** (게시 전 테스트 시): 본인 이메일 추가
7. **대시보드로 돌아가기**

## 3. OAuth 클라이언트 ID 생성

1. **API 및 서비스** → **사용자 인증 정보**
2. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형**: 웹 애플리케이션
4. **이름**: `Allcourtplay Web` (또는 원하는 이름)
5. **승인된 JavaScript 원본** (선택):
   - 개발: `http://localhost:5173`
   - 운영: `https://your-domain.com`
6. **승인된 리디렉션 URI** (필수):
   - 개발: `http://localhost:5173/auth/oauth/callback?provider=google`
   - 운영: `https://your-domain.com/auth/oauth/callback?provider=google`
7. **만들기** 클릭 후 **클라이언트 ID**, **클라이언트 보안 비밀** 복사

## 4. 환경 변수 설정

`server/.env` 파일에 추가:

```
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

> `FRONTEND_URL`이 이미 설정되어 있으면 콜백 URL이 자동으로 구성됩니다.
> Google 콘솔에 등록한 리디렉션 URI와 `{FRONTEND_URL}/auth/oauth/callback?provider=google`이 **정확히 일치**해야 합니다.

## 5. 동작 확인

1. 서버 재시작
2. 로그인 페이지에서 **Google로 로그인** 버튼 클릭
3. 구글 로그인 페이지로 리다이렉트 후 인증 완료 시 앱으로 복귀

## 트러블슈팅

### "GOOGLE_CLIENT_ID가 설정되지 않았습니다"
- `.env`에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`이 설정되어 있는지 확인
- 서버 재시작 여부 확인

### "redirect_uri_mismatch" / "redirect_uri 불일치"
- Google Cloud Console → 사용자 인증 정보 → 해당 클라이언트 → **승인된 리디렉션 URI** 확인
- `FRONTEND_URL` 기반 URL과 프로토콜, 포트, 경로(`/auth/oauth/callback?provider=google`)까지 **완전히 동일**해야 함

### "access_denied" / "Access blocked"
- OAuth 동의 화면이 **테스트** 모드일 때: **테스트 사용자**에 본인 이메일 추가
- 또는 앱을 **게시** 상태로 변경
