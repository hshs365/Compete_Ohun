# 카카오맵 API 키 설정 확인 방법

## ✅ 간단한 확인 방법

### 1단계: 브라우저에서 개발자 도구 열기
1. `http://localhost:5173` 접속
2. **F12** 키 누르기 (또는 마우스 우클릭 → "검사")
3. **Console** 탭 클릭

### 2단계: 콘솔에 아래 코드 입력
**주의**: 브라우저 콘솔에서는 `import.meta`를 직접 사용할 수 없습니다!

**대신 실제 기능으로 테스트하세요:**

1. "새 모임 만들기" 버튼 클릭
2. 위치 입력 필드에 "서울시 강남구" 입력
3. 800ms 후 마커가 이동하는지 확인
   - ✅ **마커가 이동함**: API 키가 정상 작동 중
   - ❌ **마커가 이동 안 함**: API 키 확인 필요

### 또는 코드에서 확인
실제 코드에서 사용하는 방식을 확인하려면:
1. `client/src/components/CreateGroupModal.tsx` 파일 열기
2. 183번째 줄 근처에서 `KAKAO_REST_API_KEY` 변수 확인
3. 브라우저 콘솔에서 직접 확인은 불가능 (모듈 컨텍스트 필요)

---

## 🔍 더 자세한 확인 방법

### 방법 1: 환경 변수 전체 확인
```javascript
console.log(import.meta.env);
```
모든 환경 변수가 객체로 출력됩니다.

### 방법 2: API 키만 확인
```javascript
import.meta.env.VITE_KAKAO_REST_API_KEY
```
API 키만 출력됩니다 (console.log 없이도 됩니다).

---

## ⚠️ 주의사항

### `cd client`는 사용하지 않습니다!
- 브라우저 콘솔은 **JavaScript 코드**를 실행하는 곳입니다
- `cd client`는 터미널 명령어이므로 브라우저에서는 작동하지 않습니다
- 대신 **JavaScript 코드**를 입력해야 합니다

### 올바른 예시
```javascript
// ✅ 이렇게 입력하세요
console.log(import.meta.env.VITE_KAKAO_REST_API_KEY);

// ❌ 이렇게 하지 마세요
cd client
```

---

## 🐛 문제 해결

### `undefined`가 출력되는 경우

1. **`.env` 파일 확인**
   - `client/.env` 파일이 있는지 확인
   - 파일 내용이 올바른지 확인:
     ```env
     VITE_KAKAO_REST_API_KEY=af4d06317e00c1376baf782047450605
     ```

2. **`VITE_` 접두사 확인**
   - 반드시 `VITE_`로 시작해야 합니다
   - 예: `VITE_KAKAO_REST_API_KEY` ✅
   - 예: `KAKAO_REST_API_KEY` ❌ (작동 안 함)

3. **클라이언트 재시작**
   - `.env` 파일을 수정한 후에는 **반드시 클라이언트를 재시작**해야 합니다
   - 터미널에서 `Ctrl+C`로 종료 후 `npm run dev`로 다시 시작

4. **파일 위치 확인**
   - `.env` 파일은 반드시 `client` 폴더 안에 있어야 합니다
   - 경로: `C:\Compete_Ohun\client\.env`

---

## 📝 단계별 체크리스트

- [ ] `client/.env` 파일 생성
- [ ] 파일 내용에 `VITE_KAKAO_REST_API_KEY=...` 입력
- [ ] 클라이언트 재시작 (`npm run dev`)
- [ ] 브라우저에서 `http://localhost:5173` 접속
- [ ] F12로 개발자 도구 열기
- [ ] Console 탭에서 `console.log(import.meta.env.VITE_KAKAO_REST_API_KEY);` 입력
- [ ] API 키가 출력되는지 확인

---

## 💡 팁

브라우저 콘솔에서 직접 입력할 때:
- 코드를 복사해서 붙여넣기 가능
- Enter 키를 누르면 실행됩니다
- 결과가 바로 아래에 표시됩니다

