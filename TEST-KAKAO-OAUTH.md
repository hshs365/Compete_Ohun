# 카카오 OAuth 테스트 체크리스트

## 현재 상황 진단

카카오 로그인 버튼을 눌렀을 때 문제가 발생하는 경우 다음을 확인하세요:

### 1. 백엔드 서버 실행 확인
```bash
# 서버 디렉토리에서
cd server
npm run start:dev
```
- 서버가 `http://localhost:3000`에서 실행 중인지 확인
- 터미널에 에러 메시지가 없는지 확인

### 2. 환경 변수 설정 확인

`server/.env` 파일에 다음이 설정되어 있어야 합니다:

```env
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret
FRONTEND_URL=http://localhost:5173
```

### 3. 카카오 개발자 콘솔 설정 확인

다음 단계를 따라 설정하세요:

#### 단계 1: 카카오 개발자 콘솔 접속
- https://developers.kakao.com/ 접속
- 로그인 후 "내 애플리케이션" 메뉴 클릭

#### 단계 2: 애플리케이션 등록 (없는 경우)
- "애플리케이션 추가하기" 클릭
- 앱 이름 입력 (예: "Ohun 운동모임")
- 저장

#### 단계 3: 플랫폼 설정
- 앱 선택 > 앱 설정 > 플랫폼
- Web 플랫폼 등록 클릭
- 사이트 도메인: `http://localhost:5173` 입력

#### 단계 4: 카카오 로그인 활성화
- 제품 설정 > 카카오 로그인
- 활성화 설정을 ON으로 변경

#### 단계 5: Redirect URI 등록
- 제품 설정 > 카카오 로그인 > Redirect URI
- Redirect URI 등록 클릭
- **정확히** 다음 URI 입력: `http://localhost:5173/auth/oauth/callback?provider=kakao`
  - 주의: 대소문자, 슬래시, 쿼리 파라미터까지 정확히 일치해야 함

#### 단계 6: REST API 키 확인
- 앱 설정 > 앱 키
- **REST API 키** 복사 (이것이 KAKAO_CLIENT_ID)

#### 단계 7: Client Secret 생성 (필요한 경우)
- 제품 설정 > 카카오 로그인 > 보안
- Client Secret이 없으면 "생성" 클릭
- 생성된 Client Secret 복사 (이것이 KAKAO_CLIENT_SECRET)

#### 단계 8: 동의 항목 설정
- 제품 설정 > 카카오 로그인 > 동의항목
- 필수 동의 항목:
  - 닉네임: 필수
  - 프로필 사진: 필수
- 선택 동의 항목:
  - 카카오계정(이메일): 선택 (필요시)

### 4. 환경 변수 업데이트 및 서버 재시작

`.env` 파일에 값 설정 후:

```bash
cd server
# 서버 중지 (Ctrl+C)
npm run start:dev  # 서버 재시작
```

### 5. 브라우저에서 테스트

1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 확인
3. 카카오 로그인 버튼 클릭
4. 다음을 확인:
   - `/api/auth/social/auth-url?provider=kakao` 요청이 전송되는지
   - 응답 코드가 200인지
   - 응답에 `authUrl`이 포함되어 있는지

### 6. 예상 동작

정상적으로 작동하면:
1. 카카오 로그인 버튼 클릭
2. 카카오 로그인 페이지로 리다이렉트
3. 카카오 계정으로 로그인
4. 동의 항목 확인 및 동의
5. `/auth/oauth/callback?provider=kakao&code=...`로 리다이렉트
6. 추가 정보 입력 페이지로 이동 (신규 사용자)
7. 또는 메인 페이지로 이동 (기존 사용자)

### 7. 문제 해결

#### "KAKAO_CLIENT_ID가 설정되지 않았습니다" 오류
- `.env` 파일에 `KAKAO_CLIENT_ID`가 있는지 확인
- 서버를 재시작했는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)

#### "카카오 로그인을 시작하는데 실패했습니다" 오류
- 브라우저 콘솔에서 실제 에러 메시지 확인
- Network 탭에서 API 응답 확인
- 백엔드 서버 로그 확인

#### Redirect URI 오류
- 카카오 개발자 콘솔의 Redirect URI와 코드의 URI가 정확히 일치하는지 확인
- 쿼리 파라미터까지 포함해서 확인

#### "CORS 오류" 발생 시
- `server/src/main.ts`에서 CORS 설정 확인
- `FRONTEND_URL` 환경 변수가 올바른지 확인


