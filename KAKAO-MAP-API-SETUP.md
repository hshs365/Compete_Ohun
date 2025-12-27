# 카카오맵 API 설정 가이드

## 🎯 목적
주소를 좌표로 변환(지오코딩)하고, 좌표를 주소로 변환(역지오코딩)하기 위해 카카오맵 API를 사용합니다.

## 📋 카카오맵 API 키 발급 방법

### 1. 카카오 개발자 콘솔 접속
- [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
- 카카오 계정으로 로그인

### 2. 애플리케이션 생성
1. "내 애플리케이션" → "애플리케이션 추가하기"
2. 앱 이름 입력 (예: "Ohun")
3. 저장

### 3. REST API 키 확인
1. 생성한 애플리케이션 선택
2. "앱 키" 탭에서 **REST API 키** 복사
   - 예: `abc123def456ghi789jkl012mno345pq`

### 4. 플랫폼 설정 (웹)
1. "플랫폼" 탭 → "Web 플랫폼 등록"
2. 사이트 도메인 입력:
   - 개발: `http://localhost:5173`
   - 운영: 실제 도메인 (예: `https://ohun.com`)

### 5. API 키 설정
1. "제품 설정" → "카카오 로그인" 활성화 (이미 했다면 스킵)
2. "제품 설정" → "로컬" 활성화
   - 로컬 API는 주소 검색, 좌표 변환에 사용됩니다.

## 🔧 환경 변수 설정

### 클라이언트 환경 변수 파일 생성

**파일 위치**: `client/.env` 또는 `client/.env.local`

```env
# 카카오맵 REST API 키
VITE_KAKAO_REST_API_KEY=your_rest_api_key_here
```

**주의사항**:
- `.env` 파일은 Git에 커밋하지 마세요 (`.gitignore`에 추가되어 있어야 함)
- `VITE_` 접두사가 필요합니다 (Vite 환경 변수 규칙)
- 클라이언트 재시작 후 적용됩니다

### 서버 환경 변수 (OAuth용, 선택사항)

**파일 위치**: `server/.env`

```env
# 카카오 OAuth (이미 설정되어 있다면 그대로 사용)
KAKAO_CLIENT_ID=your_rest_api_key_here
KAKAO_CLIENT_SECRET=your_client_secret_here
```

**참고**: 카카오맵 API와 카카오 OAuth는 같은 REST API 키를 사용할 수 있습니다.

## ✅ 설정 확인

### 1. 환경 변수 확인
```powershell
# 클라이언트 디렉토리에서
cd client
# .env 파일이 있는지 확인
dir .env
```

### 2. 클라이언트 재시작
```powershell
# 기존 프로세스 종료 후
npm run dev
```

### 3. 브라우저 콘솔에서 확인
```javascript
// 브라우저 개발자 도구 콘솔에서
console.log(import.meta.env.VITE_KAKAO_REST_API_KEY);
// API 키가 출력되면 정상
```

## 🧪 테스트 방법

### 1. 주소 입력 테스트
1. "새 모임 만들기" 버튼 클릭
2. 위치 입력 필드에 주소 입력 (예: "서울시 강남구")
3. 800ms 후 자동으로 좌표 변환되어 마커 이동 확인

### 2. 주소 찾기 버튼 테스트
1. "주소 찾기" 버튼 클릭
2. 다음 주소 검색 팝업에서 주소 선택
3. 마커가 해당 위치로 이동하는지 확인

### 3. 마커 드래그 테스트
1. "지도 보기" 버튼 클릭
2. 지도에서 마커를 드래그
3. 주소 입력 필드에 주소가 자동 입력되는지 확인

## 🐛 문제 해결

### API 키가 설정되지 않았을 때
- **증상**: 주소 입력 시 마커가 이동하지 않음
- **해결**: 
  1. `.env` 파일 확인
  2. `VITE_` 접두사 확인
  3. 클라이언트 재시작

### CORS 에러 발생 시
- **증상**: 브라우저 콘솔에 CORS 에러
- **해결**: 카카오 개발자 콘솔에서 플랫폼 설정 확인

### API 호출 제한 초과 시
- **증상**: 403 에러 또는 "Quota exceeded"
- **해결**: 
  - 무료 제공량: 일 10만 건
  - 현재 사용량 확인: 카카오 개발자 콘솔 → "통계" 탭
  - 필요 시 유료 전환

## 📊 API 사용량 확인

1. 카카오 개발자 콘솔 접속
2. 애플리케이션 선택
3. "통계" 탭에서 일일/월간 사용량 확인

## 💡 참고사항

- **무료 제공량**: 일 10만 건 (로컬 API)
- **현재 예상 사용량**: 일 수십~수백 건 수준
- **대체 옵션**: OpenStreetMap Nominatim API (코드에 이미 포함)

## 🔗 관련 링크

- [카카오 디벨로퍼스](https://developers.kakao.com/)
- [카카오맵 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [로컬 API 가이드](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-address)



