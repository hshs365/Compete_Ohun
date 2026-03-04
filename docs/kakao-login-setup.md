# 카카오 로그인 설정 가이드

## 1. 카카오 디벨로퍼스 앱 생성

1. [developers.kakao.com](https://developers.kakao.com) 접속 후 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름 입력 후 저장

## 2. 카카오 로그인 활성화

1. 생성한 앱 선택 → **제품 설정** → **카카오 로그인**
2. **활성화 설정**을 **ON**으로 변경
3. **Redirect URI** 등록:
   - 개발: `http://localhost:5173/auth/oauth/callback?provider=kakao`
   - 운영: `https://your-domain.com/auth/oauth/callback?provider=kakao`

## 3. 동의 항목 설정

**제품 설정** → **카카오 로그인** → **동의항목**에서 다음 항목 설정:

| 항목 | 필수 여부 | 용도 |
|------|----------|------|
| 닉네임 | 필수 | 추가정보 입력 폼 기본값 |
| 프로필 사진 | 선택 | 프로필 이미지 |
| 카카오계정(이메일) | 필수 | 계정 식별·계정 찾기 |

## 4. REST API 키 및 Client Secret

1. **앱 설정** → **앱 키**에서 **REST API 키** 확인 → `KAKAO_CLIENT_ID`로 사용
2. **앱 설정** → **보안** → **Client Secret** 생성 후 → `KAKAO_CLIENT_SECRET`으로 사용  
   (Client Secret은 선택 사항이지만, 보안 강화 시 사용 권장)

## 5. 환경 변수 설정

`server/.env`에 추가:

```
KAKAO_CLIENT_ID=your_rest_api_key
KAKAO_CLIENT_SECRET=your_client_secret
```

## 6. 테스트

1. 서버 재시작
2. 로그인 페이지에서 **카카오톡으로 로그인** 버튼 클릭
3. 카카오 로그인 → 추가 정보 입력(닉네임·주소 등) → 완료
