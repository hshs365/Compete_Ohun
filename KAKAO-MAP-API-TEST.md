# 카카오맵 API 키 확인 및 테스트 방법

## ⚠️ 중요: 브라우저 콘솔에서 직접 확인 불가

브라우저 콘솔에서 `import.meta.env.VITE_KAKAO_REST_API_KEY`를 직접 실행하면 다음 에러가 발생합니다:
```
Uncaught SyntaxError: Cannot use 'import.meta' outside a module
```

**이유**: `import.meta`는 모듈 컨텍스트에서만 사용 가능하며, 브라우저 콘솔에서는 직접 사용할 수 없습니다.

---

## ✅ 올바른 확인 방법

### 방법 1: 실제 기능 테스트 (가장 확실한 방법)

1. **브라우저에서 `http://localhost:5173` 접속**
2. **로그인** (필요시)
3. **"새 모임 만들기" 버튼 클릭**
4. **위치 입력 필드에 주소 입력**:
   - 예: "서울시 강남구"
   - 또는: "부산시 해운대구"
5. **800ms 후 확인**:
   - ✅ **마커가 해당 위치로 이동함** → API 키 정상 작동!
   - ❌ **마커가 이동하지 않음** → API 키 확인 필요

### 방법 2: Network 탭에서 확인

1. **F12로 개발자 도구 열기**
2. **Network 탭 클릭**
3. **"새 모임 만들기" → 위치 입력 필드에 주소 입력**
4. **Network 탭에서 `dapi.kakao.com` 요청 확인**:
   - ✅ **요청이 보임**: API 키가 설정되어 있음
   - ❌ **요청이 없음**: API 키가 없어서 OpenStreetMap API 사용 중

### 방법 3: 코드에 임시 로그 추가

`client/src/components/CreateGroupModal.tsx` 파일의 `handleAddressToCoordinates` 함수 시작 부분에 추가:

```typescript
const handleAddressToCoordinates = async (address: string) => {
  const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
  
  // 임시: API 키 확인용 (테스트 후 제거)
  console.log('카카오맵 API 키:', KAKAO_REST_API_KEY ? '설정됨 ✅' : '없음 ❌');
  
  // ... 나머지 코드
};
```

그 다음:
1. 클라이언트 재시작
2. "새 모임 만들기" → 위치 입력
3. 브라우저 콘솔에서 로그 확인

---

## 🧪 종합 테스트

### 테스트 시나리오

1. **주소 직접 입력 테스트**
   - 위치 입력: "서울시 강남구"
   - 결과: 마커가 강남구로 이동해야 함

2. **주소 찾기 버튼 테스트**
   - "주소 찾기" 버튼 클릭
   - 주소 선택
   - 결과: 마커가 선택한 주소로 이동해야 함

3. **마커 드래그 테스트**
   - "지도 보기" 버튼 클릭
   - 마커를 다른 위치로 드래그
   - 결과: 주소 입력 필드에 주소가 자동 입력되어야 함

---

## 🔍 API 키가 작동하는지 확인하는 방법

### 카카오맵 API가 사용 중인지 확인

브라우저 개발자 도구 → Network 탭에서:
- **카카오맵 API 사용 중**: `dapi.kakao.com` 요청이 보임
- **OpenStreetMap API 사용 중**: `nominatim.openstreetmap.org` 요청이 보임

### 정확도 확인

- **카카오맵 API**: 한국 주소 정확도 높음 (정확한 좌표)
- **OpenStreetMap API**: 한국 주소 정확도 낮을 수 있음 (대략적인 좌표)

---

## 💡 권장 확인 방법

**가장 간단하고 확실한 방법**:
1. "새 모임 만들기" 열기
2. 위치에 "서울시 강남구 테헤란로" 입력
3. 마커가 정확히 강남구로 이동하는지 확인
4. 이동하면 → API 키 정상 작동 ✅



