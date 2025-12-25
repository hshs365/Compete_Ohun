# 카카오 개발자 콘솔에서 localhost 설정 방법

## 문제
카카오 개발자 콘솔에서 `http://localhost:5173`를 사이트 도메인으로 입력하면 오류가 발생할 수 있습니다.

## 해결 방법

### 방법 1: 플랫폼 설정 없이 Redirect URI만 등록 (권장)

카카오 개발자 콘솔에서:
1. **플랫폼 설정을 건너뜁니다** (사이트 도메인 입력 안 함)
2. **제품 설정 > 카카오 로그인 > Redirect URI**로 바로 이동
3. Redirect URI 등록:
   ```
   http://localhost:5173/auth/oauth/callback?provider=kakao
   ```
   - 이 방법으로도 정상 작동합니다!
4. 동의 항목 설정 (필수)

### 방법 2: 실제 도메인 사용 (프로덕션용)

개발 환경이 아닌 실제 배포를 위해:
- 무료 도메인 서비스 사용:
  - [ngrok](https://ngrok.com/) - 로컬 개발용 터널링
  - [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)
  - 실제 도메인 구매 (예: `.dev` 도메인)

### 방법 3: 127.0.0.1 사용 (시도해볼 수 있음)

일부 경우 IP 주소를 사용할 수 있습니다:
- 사이트 도메인: `127.0.0.1:5173`
- Redirect URI: `http://127.0.0.1:5173/auth/oauth/callback?provider=kakao`

## 현재 권장: 방법 1 사용

**중요**: 플랫폼 설정(사이트 도메인)은 필수가 아닙니다!

다음 단계만 진행하세요:

1. ✅ 앱 등록 (완료하신 것 같습니다)
2. ✅ REST API 키 확인
3. ✅ Client Secret 생성
4. ✅ **Redirect URI 등록** (가장 중요!)
5. ✅ 동의 항목 설정
6. ⚠️ **플랫폼 설정은 건너뛰어도 됩니다**

## 테스트

플랫폼 설정 없이도 Redirect URI만 등록하면 카카오 로그인이 작동합니다.

`.env` 파일에 REST API 키와 Client Secret만 설정하고 테스트해보세요!


