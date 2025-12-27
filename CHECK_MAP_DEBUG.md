# 지도 디버깅 가이드

## 콘솔에서 확인할 명령어

브라우저 개발자 도구 콘솔에서 다음 명령어를 실행하세요:

### 1. 지도 컨테이너 확인
```javascript
const container = document.querySelector('.kakao-map-panel');
console.log('컨테이너:', container);
console.log('컨테이너 크기:', container?.offsetWidth, 'x', container?.offsetHeight);
console.log('컨테이너 스타일:', window.getComputedStyle(container));
```

### 2. 카카오맵 객체 확인
```javascript
console.log('window.kakao:', window.kakao);
console.log('window.kakao.maps:', window.kakao?.maps);
```

### 3. 지도 인스턴스 확인 (React DevTools 사용)
- React DevTools를 설치한 후 Components 탭에서 `KakaoMapPanel` 컴포넌트를 찾으세요
- `mapRef.current`를 확인하세요

### 4. 지도 강제 재렌더링
```javascript
const container = document.querySelector('.kakao-map-panel');
if (container && window.kakao && window.kakao.maps) {
  // 지도 인스턴스를 찾아서 relayout 호출
  // (이 방법은 React 컴포넌트 내부에서만 작동할 수 있습니다)
  console.log('지도 컨테이너는 존재합니다');
  console.log('카카오맵 SDK도 로드되었습니다');
}
```

## 일반적인 문제 해결

1. **지도가 보이지 않는 경우**
   - 컨테이너 크기가 0인지 확인
   - 카카오맵 SDK가 로드되었는지 확인
   - 네트워크 탭에서 `sdk.js` 요청이 성공했는지 확인

2. **"지도 컨테이너 크기가 0입니다" 경고가 나오는 경우**
   - 브라우저를 새로고침
   - Elements 탭에서 `.kakao-map-panel` 요소의 부모 요소들이 제대로 크기를 가지고 있는지 확인

3. **지도가 회색으로 보이는 경우**
   - 카카오맵 JavaScript 키가 올바른지 확인
   - 플랫폼 설정에서 `http://localhost:5173`이 등록되어 있는지 확인



