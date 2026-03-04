# 네이버 소셜 로그인 설정 가이드

네이버 로그인 API를 사용한 소셜 로그인 기능을 설정하는 방법입니다.

> **주의**: 네이버 **지도** API(`NAVER_MAP_CLIENT_ID`)와 **로그인** API는 별도로 등록·발급합니다.

## 1. 네이버 개발자 센터 애플리케이션 등록

1. [네이버 개발자 센터](https://developers.naver.com/) 접속 후 로그인
2. **Application** > **애플리케이션 등록** 클릭
3. 애플리케이션 이름 입력 후 진행

## 2. 로그인 API 사용 API 설정

1. 등록한 애플리케이션 선택
2. **API 설정** 탭에서 **네이버 로그인** 사용 설정
3. **사용 API**에서 **네이버 로그인** 추가

## 3. 콜백 URL 등록

**환경별 콜백 URL 예시**:

| 환경 | 콜백 URL |
|------|----------|
| 로컬 개발 | `http://localhost:5173/auth/oauth/callback?provider=naver` |
| 스테이징 | `https://staging.example.com/auth/oauth/callback?provider=naver` |
| 운영 | `https://yourdomain.com/auth/oauth/callback?provider=naver` |

- `FRONTEND_URL` 환경변수에 맞는 URL을 **서비스 URL** 및 **Callback URL**로 등록
- 여러 환경을 사용하는 경우 각각 등록 가능

## 4. Client ID / Client Secret 발급

1. **애플리케이션 정보** 탭에서 **Client ID** 복사 → `.env`의 `NAVER_LOGIN_CLIENT_ID`
2. **Client Secret** 클릭 후 복사 → `.env`의 `NAVER_LOGIN_CLIENT_SECRET`

## 5. 환경변수 설정

`server/.env` 파일에 추가:

```
NAVER_LOGIN_CLIENT_ID=발급받은_Client_ID
NAVER_LOGIN_CLIENT_SECRET=발급받은_Client_Secret
```

## 6. 동작 확인

1. 서버 재시작
2. 클라이언트 로그인 페이지에서 **네이버로 로그인** 버튼 클릭
3. 네이버 로그인 페이지로 리다이렉트 후 인증 완료 시 앱으로 복귀

## 트러블슈팅

### "NAVER_LOGIN_CLIENT_ID가 설정되지 않았습니다"

- `.env`에 `NAVER_LOGIN_CLIENT_ID`, `NAVER_LOGIN_CLIENT_SECRET`이 설정되어 있는지 확인
- 서버 재시작 여부 확인

### "invalid_client" 또는 "redirect_uri 불일치"

- 네이버 콘솔에 등록한 Callback URL과 `FRONTEND_URL` 기반 URL이 정확히 일치하는지 확인
- 프로토콜(`http`/`https`), 포트, 경로(`/auth/oauth/callback?provider=naver`)까지 동일해야 함
