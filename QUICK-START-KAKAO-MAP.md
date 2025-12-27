# 카카오맵 API 빠른 설정 가이드

## 🚀 빠른 시작 (3단계)

### 1단계: 카카오 개발자 콘솔에서 REST API 키 발급

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. 앱 이름 입력 후 저장
4. 생성한 앱 선택 → "앱 키" 탭에서 **REST API 키** 복사

### 2단계: 환경 변수 파일 생성

**파일 생성**: `client/.env`

```env
VITE_KAKAO_REST_API_KEY=여기에_복사한_REST_API_키_붙여넣기
```

**예시**:
```env
VITE_KAKAO_REST_API_KEY=abc123def456ghi789jkl012mno345pq
```

### 3단계: 클라이언트 재시작

```powershell
cd client
npm run dev
```

## ✅ 설정 확인 (실제 기능 테스트)

**⚠️ 주의**: 브라우저 콘솔에서 `import.meta`를 직접 사용할 수 없습니다!

### 가장 확실한 확인 방법: 실제 기능 테스트

1. **브라우저에서 `http://localhost:5173` 접속**
2. **로그인** (필요시)
3. **"새 모임 만들기" 버튼 클릭**
4. **위치 입력 필드에 주소 입력**:
   ```
   서울시 강남구
   ```
5. **800ms 후 확인**:
   - ✅ **마커가 강남구로 이동함** → API 키 정상 작동!
   - ❌ **마커가 이동하지 않음** → `.env` 파일 확인 및 클라이언트 재시작 필요

### Network 탭에서 확인

1. **F12 → Network 탭**
2. **위치 입력 필드에 주소 입력**
3. **Network 탭에서 확인**:
   - ✅ `dapi.kakao.com` 요청이 보임 → 카카오맵 API 사용 중
   - ❌ `nominatim.openstreetmap.org` 요청만 보임 → OpenStreetMap API 사용 중 (API 키 없음)

**자세한 방법**: `KAKAO-MAP-API-TEST.md` 파일 참고

## 🧪 테스트

1. "새 모임 만들기" 버튼 클릭
2. 위치 입력 필드에 "서울시 강남구" 입력
3. 800ms 후 마커가 해당 위치로 이동하는지 확인

## 💡 참고사항

- **API 키 없어도 동작**: OpenStreetMap API로 자동 대체됩니다
- **카카오맵 API 장점**: 한국 주소 정확도 높음
- **무료 제공량**: 일 10만 건 (충분함)

## 📚 자세한 설정 방법

`KAKAO-MAP-API-SETUP.md` 파일 참고

