# 카카오 OAuth 설정 완벽 가이드

## 1단계: 카카오 개발자 콘솔 접속 및 앱 등록

### 1-1. 개발자 콘솔 접속
1. 브라우저에서 [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인

### 1-2. 애플리케이션 등록
1. "내 애플리케이션" 메뉴 클릭
2. "애플리케이션 추가하기" 버튼 클릭
3. 앱 이름 입력 (예: "Ohun 운동모임")
4. 저장

## 2단계: 플랫폼 설정

1. 생성한 앱 선택
2. "앱 설정" > "플랫폼" 메뉴
3. "Web 플랫폼 등록" 클릭
4. 사이트 도메인 입력: `http://localhost:5173`
5. 저장

## 3단계: 카카오 로그인 활성화

1. "제품 설정" > "카카오 로그인" 메뉴
2. "활성화 설정"을 **ON**으로 변경
3. 저장

## 4단계: Redirect URI 등록 (중요!)

1. "제품 설정" > "카카오 로그인" > "Redirect URI" 메뉴
2. "Redirect URI 등록" 버튼 클릭
3. **정확히** 다음 URI 입력:
   ```
   http://localhost:5173/auth/oauth/callback?provider=kakao
   ```
   ⚠️ 주의사항:
   - 대소문자 정확히 일치
   - 슬래시(/) 정확히 일치
   - 쿼리 파라미터(`?provider=kakao`) 포함
   - http (https 아님)
4. 저장

## 5단계: 동의 항목 설정

1. "제품 설정" > "카카오 로그인" > "동의항목" 메뉴
2. 필수 동의 항목:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 필수 동의
3. 선택 동의 항목 (선택사항):
   - **카카오계정(이메일)**: 선택 동의 (이메일 정보가 필요하면)

## 6단계: REST API 키 및 Client Secret 확인

### 6-1. REST API 키 확인 (이것이 KAKAO_CLIENT_ID)
1. "앱 설정" > "앱 키" 메뉴
2. **REST API 키** 복사 (예: `1234567890abcdef1234567890abcdef`)

### 6-2. Client Secret 생성 (이것이 KAKAO_CLIENT_SECRET)
1. "제품 설정" > "카카오 로그인" > "보안" 메뉴
2. Client Secret이 없으면:
   - "Client Secret" 섹션에서 "생성" 버튼 클릭
   - 생성된 Client Secret 복사 (예: `AbCdEf1234567890GhIjKlMnOpQrSt`)

## 7단계: .env 파일에 설정 추가

`server/.env` 파일을 열어서 다음 내용 추가:

```env
# 기존 데이터베이스 설정 (유지)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=ohun

# 기존 JWT 설정 (유지)
JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# 기존 서버 설정 (유지)
PORT=3000
FRONTEND_URL=http://localhost:5173

# 카카오 OAuth 설정 (여기에 추가!)
KAKAO_CLIENT_ID=여기에_REST_API_키_붙여넣기
KAKAO_CLIENT_SECRET=여기에_Client_Secret_붙여넣기
```

## 8단계: 서버 재시작

`.env` 파일을 수정한 후 반드시 서버를 재시작:

```bash
# 현재 실행 중인 서버 종료 (Ctrl+C)
# 그 다음 다시 시작
cd server
npm run start:dev
```

## 9단계: 테스트

1. 프론트엔드에서 카카오 로그인 버튼 클릭
2. 카카오 로그인 페이지로 리다이렉트되는지 확인
3. 카카오 계정으로 로그인
4. 동의 항목 확인 후 동의
5. 추가 정보 입력 페이지로 이동하는지 확인

## 문제 해결

### "KAKAO_CLIENT_ID가 설정되지 않았습니다" 에러
- `.env` 파일에 `KAKAO_CLIENT_ID=` 줄이 있는지 확인
- 값이 비어있지 않은지 확인
- 서버를 재시작했는지 확인

### Redirect URI 오류
- 카카오 개발자 콘솔의 Redirect URI가 정확히 일치하는지 확인
- `http://localhost:5173/auth/oauth/callback?provider=kakao`
- 앞뒤 공백이 없는지 확인

### Client Secret 오류
- Client Secret을 생성했는지 확인
- 복사할 때 앞뒤 공백이 포함되지 않았는지 확인

## 주의사항

- Client Secret은 외부에 공개하지 마세요
- 프로덕션 환경에서는 실제 도메인으로 변경 필요
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다


