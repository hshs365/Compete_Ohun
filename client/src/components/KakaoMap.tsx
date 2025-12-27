import React, { useEffect, useRef } from 'react';

interface KakaoMapProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
  onMapLoad?: (map: any) => void;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMap: React.FC<KakaoMapProps> = ({
  center,
  zoom = 15,
  onMarkerDragEnd,
  onMapLoad,
  style = { height: '100%', width: '100%' },
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const loadKakaoMapScript = () => {
      const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
      
      if (!KAKAO_JAVASCRIPT_KEY) {
        console.error('카카오맵 JavaScript 키가 설정되지 않았습니다. VITE_KAKAO_JAVASCRIPT_KEY를 .env 파일에 추가해주세요.');
        return;
      }

      // 이미 로드되어 있으면 스킵
      if (window.kakao && window.kakao.maps) {
        scriptLoadedRef.current = true;
        initializeMap();
        return;
      }

      // 스크립트가 이미 추가되어 있는지 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]');
      if (existingScript) {
        // 스크립트가 있으면 로드 완료를 기다림
        const checkInterval = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkInterval);
            scriptLoadedRef.current = true;
            initializeMap();
          }
        }, 100);
        return;
      }

      // 스크립트 동적 로드
      const script = document.createElement('script');
      const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&libraries=services&autoload=false`;
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        // 스크립트가 로드된 후 kakao 객체가 준비될 때까지 대기
        const checkKakao = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakao);
            window.kakao.maps.load(() => {
              scriptLoadedRef.current = true;
              initializeMap();
            });
          }
        }, 50);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkKakao);
          if (!scriptLoadedRef.current) {
            console.error('카카오맵 초기화 타임아웃');
          }
        }, 10000);
      };
      script.onerror = (error) => {
        console.error('❌ 카카오맵 스크립트 로드 실패');
        console.error('요청 URL:', scriptUrl);
        console.error('JavaScript 키:', KAKAO_JAVASCRIPT_KEY ? `${KAKAO_JAVASCRIPT_KEY.substring(0, 10)}...` : '없음');
        console.error('🔍 플랫폼 설정과 JavaScript 키를 확인해주세요');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || !window.kakao || !window.kakao.maps) {
        return;
      }

      const [lat, lng] = center;

      // 기존 지도가 있으면 제거
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }

      // 지도 생성
      const container = mapContainerRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: zoom,
      };

      const map = new window.kakao.maps.Map(container, options);
      mapRef.current = map;

      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        draggable: true,
      });

      marker.setMap(map);
      markerRef.current = marker;

      // 마커 드래그 이벤트
      if (onMarkerDragEnd) {
        window.kakao.maps.event.addListener(marker, 'dragend', () => {
          const position = marker.getPosition();
          onMarkerDragEnd(position.getLat(), position.getLng());
        });
      }

      // 지도 로드 콜백
      if (onMapLoad) {
        onMapLoad(map);
      }
    };

    loadKakaoMapScript();
  }, []); // 초기 로드만

  // 중심 좌표 변경 시 지도 이동 및 확대
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !window.kakao) return;

    const [lat, lng] = center;
    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

    // 지도 중심 이동 (애니메이션 효과)
    mapRef.current.panTo(moveLatLon);
    
    // 확대 레벨 설정
    if (zoom) {
      mapRef.current.setLevel(zoom);
    }

    // 마커 위치 이동
    markerRef.current.setPosition(moveLatLon);
    
    // 지도 크기 재조정 (컨테이너 크기 변경 대응)
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.relayout();
      }
    }, 100);
  }, [center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={style}
      className="kakao-map-container"
    />
  );
};

export default KakaoMap;

