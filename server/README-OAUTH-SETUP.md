# 카카오 OAuth 설정 가이드

## 1. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 이름 입력 후 저장

## 2. 플랫폼 설정

1. 앱 설정 > 플랫폼 > Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:5173` (개발 환경)

## 3. 카카오 로그인 활성화

1. 제품 설정 > 카카오 로그인 > 활성화 설정 > ON
2. Redirect URI 등록:
   - `http://localhost:5173/auth/oauth/callback?provider=kakao`

## 4. 동의 항목 설정

1. 제품 설정 > 카카오 로그인 > 동의항목
2. 필수 동의 항목:
   - 닉네임
   - 프로필 사진
3. 선택 동의 항목:
   - 카카오계정(이메일) - 필요시

## 5. REST API 키 및 Client Secret 확인

1. 앱 설정 > 앱 키
   - REST API 키 확인 (이것이 Client ID)
2. 제품 설정 > 카카오 로그인 > 보안
   - Client Secret 생성 (활성화되어 있지 않으면 생성)

## 6. 환경 변수 설정

`server/.env` 파일에 다음 내용 추가:

```env
KAKAO_CLIENT_ID=your_rest_api_key_here
KAKAO_CLIENT_SECRET=your_client_secret_here
FRONTEND_URL=http://localhost:5173
```

## 7. 서버 재시작

환경 변수를 변경한 후 서버를 재시작하세요:

```bash
cd server
npm run start:dev
```

## 문제 해결

### "KAKAO_CLIENT_ID가 설정되지 않았습니다" 오류
- `.env` 파일이 `server` 디렉토리에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)
- 서버를 재시작했는지 확인

### "카카오 로그인 URL을 가져오는데 실패했습니다" 오류
- 백엔드 서버가 실행 중인지 확인 (`http://localhost:3000`)
- 네트워크 탭에서 API 응답 확인
- 브라우저 콘솔에서 에러 메시지 확인

### Redirect URI 오류
- 카카오 개발자 콘솔에서 등록한 Redirect URI와 코드의 URI가 정확히 일치하는지 확인
- 대소문자, 슬래시, 쿼리 파라미터까지 정확히 일치해야 함


