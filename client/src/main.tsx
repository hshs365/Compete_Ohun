import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './style.css'

// 네이버 지도 타입 선언
declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

// 네이버 지도 API 인증 실패 콜백 함수 (공식 가이드 참고)
// https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
window.navermap_authFailure = function () {
  console.error('❌ 네이버 지도 Open API 인증 실패');
  console.error('📍 현재 페이지 URL:', window.location.href);
  console.error('🔑 Client ID:', import.meta.env.VITE_NAVER_MAP_CLIENT_ID);
  console.error('🔍 확인 사항:');
  console.error('1. 네이버 클라우드 플랫폼 콘솔에서 Web Service URL이 정확히 등록되어 있는지 확인');
  console.error('2. URL에 슬래시(/) 포함 여부 확인 (http://192.168.198.172:5173 vs http://192.168.198.172:5173/)');
  console.error('3. 저장 버튼을 눌렀는지 확인');
  console.error('4. 변경사항 반영까지 1-2분 정도 걸릴 수 있습니다');
  console.error('5. 브라우저를 완전히 닫았다가 다시 열기');
  console.error('6. 하드 리프레시 (Ctrl+Shift+R)');
};

// 네이버 지도 스크립트를 미리 로드하여 지도가 빠르게 표시되도록
const preloadNaverMapScript = () => {
  const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
  
  if (!NAVER_CLIENT_ID) {
    console.warn('네이버 지도 Client ID가 설정되지 않았습니다.');
    return;
  }

  // 이미 로드되어 있으면 스킵
  if (window.naver && window.naver.maps) {
    return;
  }

  // 스크립트가 이미 추가되어 있는지 확인
  const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
  if (existingScript) {
    return;
  }

  // 스크립트를 미리 로드 (페이지 로드와 동시에 시작)
  const script = document.createElement('script');
  // 네이버 지도 API v3 공식 형식 사용
  // 공식 문서: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
  // 스크립트 URL 형식: https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...
  // ⭐ 중요: 파라미터 이름이 ncpClientId에서 ncpKeyId로 변경되었습니다!
  // 지오코딩(주소→좌표)을 브라우저에서 CORS 없이 쓰려면 submodules=geocoder 필요
  const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}&submodules=geocoder`;
  script.src = scriptUrl;
  script.async = true;
  script.type = 'text/javascript';
  
  script.onload = () => {
    console.log('✅ 네이버 지도 스크립트 로드 완료');
    console.log('📍 현재 페이지 URL:', window.location.href);
    console.log('🔑 Client ID:', NAVER_CLIENT_ID);
    // naver 객체가 준비될 때까지 대기
    const checkNaver = setInterval(() => {
      if (window.naver && window.naver.maps) {
        clearInterval(checkNaver);
        console.log('✅ 네이버 지도 API 초기화 완료');
        console.log('📍 window.naver 객체 확인:', !!window.naver);
        console.log('📍 window.naver.maps 확인:', !!window.naver.maps);
      }
    }, 50);
    
    // 5초 후 타임아웃
    setTimeout(() => {
      clearInterval(checkNaver);
      if (!window.naver || !window.naver.maps) {
        console.error('❌ 네이버 지도 API 초기화 실패 - window.naver 객체를 찾을 수 없습니다');
        console.error('📍 현재 페이지 URL:', window.location.href);
        console.error('🔑 Client ID:', NAVER_CLIENT_ID);
        console.error('🔍 확인 사항:');
        console.error('1. 네이버 클라우드 플랫폼 콘솔에서 Web Service URL에 http://localhost:5173이 등록되어 있는지 확인');
        console.error('2. 저장 버튼을 눌렀는지 확인');
        console.error('3. 브라우저를 완전히 닫았다가 다시 열었는지 확인');
        console.error('4. 하드 리프레시 (Ctrl+Shift+R)를 시도했는지 확인');
        console.error('5. Network 탭에서 스크립트 요청의 상태 코드 확인 (403 Forbidden이면 URL 미등록 또는 변경사항 미반영)');
        console.error('6. 네이버 클라우드 플랫폼에서 변경사항 반영까지 1-2분 정도 걸릴 수 있습니다');
      }
    }, 5000);
  };
  
  script.onerror = (error) => {
    console.error('❌ 네이버 지도 스크립트 로드 실패');
    console.error('📍 현재 페이지 URL:', window.location.href);
    console.error('요청 URL:', scriptUrl);
    console.error('Client ID:', NAVER_CLIENT_ID ? `${NAVER_CLIENT_ID.substring(0, 10)}...` : '없음');
    console.error('에러 상세:', error);
    console.error('');
    console.error('🔍 확인 사항:');
    console.error('1. 네이버 클라우드 플랫폼 콘솔에서 Web Service URL에 http://localhost:5173이 등록되어 있는지 확인');
    console.error('2. 저장 버튼을 눌렀는지 확인');
    console.error('3. 브라우저를 완전히 닫았다가 다시 열었는지 확인');
    console.error('4. 하드 리프레시 (Ctrl+Shift+R)를 시도했는지 확인');
    console.error('5. Network 탭에서 스크립트 요청의 상태 코드 확인');
    console.error('   - 403 Forbidden: URL 미등록 또는 변경사항 미반영 (1-2분 대기 후 재시도)');
    console.error('   - 404 Not Found: 스크립트 URL 오류');
    console.error('6. 네이버 클라우드 플랫폼에서 변경사항 반영까지 1-2분 정도 걸릴 수 있습니다');
  };
  
  // 스크립트를 head에 추가하여 페이지 로드와 동시에 다운로드 시작
  document.head.appendChild(script);
  
  console.log('네이버 지도 스크립트 미리 로드 시작:', scriptUrl);
};

// 앱 렌더링 전에 스크립트 미리 로드
preloadNaverMapScript();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App></App>
)