# 카카오맵 JavaScript API 빠른 설정 가이드

## ✅ 완료된 작업

1. ✅ Leaflet 제거
2. ✅ 카카오맵 JavaScript API 컴포넌트 생성
3. ✅ CreateGroupModal에서 카카오맵 사용하도록 수정
4. ✅ 마커 드래그 및 주소 변환 기능 구현

## 🔑 필요한 설정 (1단계만!)

### JavaScript 키 발급 및 설정

1. **카카오 개발자 콘솔 접속**
   - [https://developers.kakao.com/](https://developers.kakao.com/)
   - 애플리케이션 선택

2. **JavaScript 키 확인**
   - "앱 키" 탭 → **JavaScript 키** 복사
   - ⚠️ REST API 키가 아닌 **JavaScript 키**입니다!

3. **`.env` 파일에 추가**
   - 파일 위치: `client/.env`
   - 기존 내용:
     ```env
     VITE_KAKAO_REST_API_KEY=af4d06317e00c1376baf782047450605
     ```
   - **아래 줄 추가**:
     ```env
     VITE_KAKAO_JAVASCRIPT_KEY=여기에_JavaScript_키_붙여넣기
     ```

4. **클라이언트 재시작**
   ```bash
   cd client
   npm run dev
   ```

## 🧪 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. "새 모임 만들기" 버튼 클릭
3. "지도 보기" 버튼 클릭
4. **카카오맵**이 표시되는지 확인 ✅
5. 주소 입력 시 마커가 이동하는지 확인 ✅
6. 마커 드래그 시 주소가 자동 입력되는지 확인 ✅

## ❌ 문제 해결

### 지도가 표시되지 않는 경우

1. **콘솔 확인** (F12 → Console):
   - "카카오맵 JavaScript 키가 설정되지 않았습니다" → `.env` 파일 확인
   - 다른 에러 → Network 탭에서 `dapi.kakao.com` 요청 확인

2. **확인 사항**:
   - ✅ `.env` 파일에 `VITE_KAKAO_JAVASCRIPT_KEY` 추가됨
   - ✅ JavaScript 키가 올바른지 확인 (REST API 키 아님!)
   - ✅ 클라이언트 재시작함

### 마커가 이동하지 않는 경우

1. **콘솔 확인**:
   - "카카오맵 API 키 확인: 설정됨 ✅" 메시지 확인
   - 주소 입력 시 API 호출 로그 확인

2. **확인 사항**:
   - ✅ `VITE_KAKAO_REST_API_KEY`가 설정되어 있음
   - ✅ 클라이언트 재시작함

## 📝 참고

- **REST API 키**: 주소 변환용 (이미 설정됨)
- **JavaScript 키**: 지도 표시용 (새로 추가 필요)
- 두 키 모두 필요합니다!



