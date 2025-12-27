# 카카오맵 JavaScript API 설정 가이드

## ⚠️ 중요: JavaScript 키 필요

카카오맵 JavaScript API를 사용하려면 **JavaScript 키**가 필요합니다.
- ✅ REST API 키 (이미 설정됨) → 주소 변환용 (지오코딩/역지오코딩)
- ✅ JavaScript 키 (필요) → 지도 표시용

## 🔑 JavaScript 키 발급 방법

### 1. 카카오 개발자 콘솔 접속
- [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
- 애플리케이션 선택

### 2. JavaScript 키 확인
1. "앱 키" 탭으로 이동
2. **JavaScript 키** 복사
   - 예: `abc123def456ghi789jkl012mno345pq`
   - ⚠️ REST API 키가 아닌 **JavaScript 키**입니다!

### 3. 플랫폼 설정 확인
1. "플랫폼" 탭 확인
2. Web 플랫폼에 `http://localhost:5173` 등록되어 있는지 확인
   - 없으면 "Web 플랫폼 등록" 클릭 후 추가

### 4. 환경 변수 설정

**파일 위치**: `client/.env`

현재 파일 내용:
```env
# 카카오맵 REST API 키 (주소 변환용)
VITE_KAKAO_REST_API_KEY=af4d06317e00c1376baf782047450605
```

**JavaScript 키 추가**:
```env
# 카카오맵 REST API 키 (주소 변환용)
VITE_KAKAO_REST_API_KEY=af4d06317e00c1376baf782047450605

# 카카오맵 JavaScript 키 (지도 표시용) - 새로 추가!
VITE_KAKAO_JAVASCRIPT_KEY=your_javascript_key_here
```

**주의**: `your_javascript_key_here`를 실제 JavaScript 키로 교체하세요!

### 5. 클라이언트 재시작
```bash
cd client
npm run dev
```

## ✅ 설정 확인

### 브라우저 콘솔에서 확인
1. F12 → Console 탭
2. "새 모임 만들기" → "지도 보기" 클릭
3. 콘솔에 에러가 없으면 정상

### 지도가 표시되지 않는 경우
- 콘솔에 "카카오맵 JavaScript 키가 설정되지 않았습니다" 에러 확인
- `.env` 파일에 `VITE_KAKAO_JAVASCRIPT_KEY` 추가 확인
- 클라이언트 재시작 확인

## 📝 참고

- **REST API 키**: 주소 → 좌표 변환 (지오코딩), 좌표 → 주소 변환 (역지오코딩)
- **JavaScript 키**: 지도 표시, 마커 표시
- 두 키는 **다릅니다**!
- 두 키 모두 필요합니다!

## 🎯 완료 후 테스트

1. "새 모임 만들기" 버튼 클릭
2. "지도 보기" 버튼 클릭
3. **카카오맵**이 표시되는지 확인 (OpenStreetMap이 아님!)
4. 주소 입력 시 마커가 이동하는지 확인
5. 마커 드래그 시 주소가 자동 입력되는지 확인

