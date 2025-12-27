# 카카오맵 404 에러 해결 가이드

## ❌ 현재 발생 중인 문제

Network 탭에서 `dapi.kakao.com/` 요청이 **404 Not Found** 에러 발생

## 🔍 원인 분석

### 1. 플랫폼 설정 확인 (가장 중요!)

카카오맵 JavaScript API를 사용하려면 **플랫폼 설정**에 도메인을 등록해야 합니다.

#### 설정 방법:

1. **카카오 개발자 콘솔 접속**
   - [https://developers.kakao.com/](https://developers.kakao.com/)
   - 애플리케이션 "Ohun" 선택

2. **"플랫폼" 탭 클릭**

3. **Web 플랫폼 등록**
   - "Web 플랫폼 등록" 버튼 클릭
   - 사이트 도메인 입력: `http://localhost:5173`
   - 저장

4. **저장 후 확인**
   - 변경 사항이 반영되기까지 **1-2분** 걸릴 수 있음
   - 브라우저를 완전히 닫았다가 다시 열기

### 2. JavaScript 키 확인

현재 설정된 키:
- `.env` 파일: `VITE_KAKAO_JAVASCRIPT_KEY=e808ef5da75ce1c3d2f548a9794935a0`
- 카카오 개발자 콘솔: `대표 Default JS Key` = `e808ef5da75ce1c3d2f548a9794935a0`

✅ **키는 올바르게 설정되어 있습니다!**

### 3. 스크립트 URL 확인

올바른 URL 형식:
```
https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_JAVASCRIPT_KEY&libraries=services&autoload=false
```

❌ 잘못된 URL (404 에러 발생):
```
https://dapi.kakao.com/
```

## 🔧 해결 방법

### 방법 1: 플랫폼 설정 (필수!)

1. 카카오 개발자 콘솔 → "플랫폼" 탭
2. "Web 플랫폼 등록" 클릭
3. `http://localhost:5173` 입력
4. 저장
5. **1-2분 대기**
6. 브라우저 완전히 닫고 다시 열기
7. 클라이언트 재시작

### 방법 2: 브라우저 캐시 클리어

1. **F12 → Network 탭**
2. **"Disable cache" 체크**
3. **페이지 새로고침 (Ctrl+Shift+R)**

### 방법 3: 클라이언트 재시작

```bash
# 클라이언트 완전히 종료 후
cd client
npm run dev
```

## 🧪 테스트

### 1단계: 플랫폼 설정 확인

1. 카카오 개발자 콘솔 → "플랫폼" 탭
2. Web 플랫폼에 `http://localhost:5173`이 등록되어 있는지 확인
3. 없으면 등록

### 2단계: 브라우저에서 테스트

1. **브라우저 완전히 닫기**
2. **다시 열기**
3. `http://localhost:5173` 접속
4. **F12 → Network 탭**
5. 필터에 "kakao" 입력
6. `dapi.kakao.com/v2/maps/sdk.js` 요청 확인
7. **상태 코드가 200 OK**인지 확인

### 3단계: 콘솔 확인

브라우저 콘솔에서 다음 메시지 확인:
- ✅ "카카오맵 스크립트 로드 시도: ..."
- ✅ "카카오맵 스크립트 로드 완료"
- ✅ "카카오맵 객체 확인됨, 초기화 시작"

## 📝 중요 사항

1. **플랫폼 설정은 필수입니다!**
   - 플랫폼 설정 없이는 JavaScript API를 사용할 수 없습니다
   - 404 에러의 가장 흔한 원인입니다

2. **변경 사항 반영 시간**
   - 플랫폼 설정 변경 후 1-2분 걸릴 수 있음
   - 브라우저를 완전히 닫았다가 다시 열어야 함

3. **키는 올바릅니다**
   - JavaScript 키: `e808ef5da75ce1c3d2f548a9794935a0` ✅
   - REST API 키: `af4d06317e00c1376baf782047450605` ✅

## 🆘 여전히 문제가 있는 경우

1. **Network 탭에서 실제 요청 URL 확인**
   - `dapi.kakao.com/v2/maps/sdk.js?appkey=...` 형태여야 함
   - 루트 경로(`/`)로 요청하면 안 됨

2. **플랫폼 설정 다시 확인**
   - Web 플랫폼에 `http://localhost:5173` 등록 확인
   - 저장 후 충분히 대기

3. **브라우저 완전히 닫고 다시 열기**



