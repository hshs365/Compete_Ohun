import React, { useEffect, useRef } from 'react';

export interface NaverMapMarkerItem {
  lat: number;
  lng: number;
  id?: number;
  name?: string;
}

interface NaverMapProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
  onMapLoad?: (map: any) => void;
  style?: React.CSSProperties;
  /** 시설 등 추가 마커 (표시만, 클릭 불가) */
  markers?: NaverMapMarkerItem[];
  /** true면 중심에 드래그 가능 마커 표시. false면 시설 마커만 표시 */
  showCenterMarker?: boolean;
  /** true면 우측 하단에 지도 축척(Scale Bar) 표시 */
  showScaleControl?: boolean;
}

declare global {
  interface Window {
    naver: any;
  }
}

const NaverMap: React.FC<NaverMapProps> = ({
  center,
  zoom = 15,
  onMarkerDragEnd,
  onMapLoad,
  style = { height: '100%', width: '100%' },
  markers = [],
  showCenterMarker = true,
  showScaleControl = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const facilityMarkersRef = useRef<any[]>([]);
  const scriptLoadedRef = useRef(false);

  // 네이버 지도 스크립트 로드
  useEffect(() => {
    const loadNaverMapScript = () => {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      
      if (!NAVER_CLIENT_ID) {
        console.error('네이버 지도 Client ID가 설정되지 않았습니다. VITE_NAVER_MAP_CLIENT_ID를 .env 파일에 추가해주세요.');
        return;
      }

      // 이미 로드되어 있으면 초기화
      if (window.naver && window.naver.maps) {
        scriptLoadedRef.current = true;
        initializeMap();
        return;
      }

      // 스크립트가 이미 추가되어 있는지 확인
      const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
      if (existingScript) {
        // 스크립트가 있으면 로드 완료를 기다림
        const checkInterval = setInterval(() => {
          if (window.naver && window.naver.maps) {
            clearInterval(checkInterval);
            scriptLoadedRef.current = true;
            initializeMap();
          }
        }, 100);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 10000);
        return;
      }

      // 스크립트 동적 로드
      const script = document.createElement('script');
      // 네이버 지도 API v3 공식 형식 사용
      // 공식 문서: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
      // 스크립트 URL 형식: https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...
      // ⭐ 중요: 파라미터 이름이 ncpClientId에서 ncpKeyId로 변경되었습니다!
      const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}&submodules=geocoder`;
      script.src = scriptUrl;
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        // 스크립트가 로드된 후 naver 객체가 준비될 때까지 대기
        const checkNaver = setInterval(() => {
          if (window.naver && window.naver.maps) {
            clearInterval(checkNaver);
            scriptLoadedRef.current = true;
            initializeMap();
          }
        }, 50);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkNaver);
          if (!scriptLoadedRef.current) {
            console.error('네이버 지도 초기화 타임아웃');
          }
        }, 10000);
      };
      script.onerror = (error) => {
        console.error('❌ 네이버 지도 스크립트 로드 실패');
        console.error('요청 URL:', scriptUrl);
        console.error('Client ID:', NAVER_CLIENT_ID ? `${NAVER_CLIENT_ID.substring(0, 10)}...` : '없음');
        console.error('🔍 Web Service URL 설정과 Client ID를 확인해주세요');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || !window.naver || !window.naver.maps) {
        console.warn('네이버 지도 초기화 실패: 필요한 객체가 없습니다.');
        return;
      }

      // LatLng 생성자가 사용 가능한지 확인
      if (typeof window.naver.maps.LatLng !== 'function') {
        console.error('네이버 지도 LatLng 생성자를 사용할 수 없습니다.');
        return;
      }

      const [lat, lng] = center;

      // 기존 지도가 있으면 제거
      if (mapRef.current) {
        try {
          // 기존 마커 이벤트 리스너 제거
          if (markerRef.current && onMarkerDragEnd && window.naver && window.naver.maps) {
            window.naver.maps.Event.removeListener(markerRef.current, 'dragend');
          }
        } catch (e) {
          // 무시
        }
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }

      try {
        // 카카오 레벨(1-14)을 네이버 레벨(0-21)로 변환
        const convertKakaoLevelToNaver = (kakaoLevel: number): number => {
          return Math.round((kakaoLevel - 1) * 1.5);
        };
        
        // 지도 생성
        const container = mapContainerRef.current;
        const options = {
          center: new window.naver.maps.LatLng(lat, lng),
          zoom: convertKakaoLevelToNaver(zoom || 15),
        };

        const map = new window.naver.maps.Map(container, options);
        mapRef.current = map;

        if (showScaleControl && typeof window.naver.maps.ScaleControl === 'function') {
          try {
            const scaleControl = new window.naver.maps.ScaleControl();
            if (map.controls && typeof map.controls.add === 'function' && window.naver.maps.Position) {
              map.controls.add(scaleControl, window.naver.maps.Position.BOTTOM_RIGHT);
            }
          } catch (e) {
            console.warn('ScaleControl 추가 실패:', e);
          }
        }

        if (showCenterMarker) {
          const markerPosition = new window.naver.maps.LatLng(lat, lng);
          const marker = new window.naver.maps.Marker({
            position: markerPosition,
            map: map,
            draggable: true,
          });
          markerRef.current = marker;
          if (onMarkerDragEnd) {
            window.naver.maps.Event.addListener(marker, 'dragend', () => {
              const position = marker.getPosition();
              onMarkerDragEnd(position.lat(), position.lng());
            });
          }
        } else {
          markerRef.current = null;
        }

        // 지도 로드 콜백
        if (onMapLoad) {
          onMapLoad(map);
        }
      } catch (error) {
        console.error('네이버 지도 초기화 중 에러 발생:', error);
      }
    };

    loadNaverMapScript();
  }, []); // 초기 로드만

  // 중심 좌표 변경 시 지도 이동 및 확대
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return;
    if (typeof window.naver.maps.LatLng !== 'function') return;

    const [lat, lng] = center;
    try {
      const convertKakaoLevelToNaver = (kakaoLevel: number): number => Math.round((kakaoLevel - 1) * 1.5);
      const moveLatLon = new window.naver.maps.LatLng(lat, lng);
      mapRef.current.panTo(moveLatLon);
      if (zoom) mapRef.current.setZoom(convertKakaoLevelToNaver(zoom));
      if (showCenterMarker && markerRef.current) markerRef.current.setPosition(moveLatLon);
      setTimeout(() => {
        if (mapRef.current && typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
      }, 100);
    } catch (error) {
      console.error('지도 업데이트 중 에러 발생:', error);
    }
  }, [center, zoom, showCenterMarker]);

  // 시설 마커 갱신
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps || !Array.isArray(markers)) return;
    const map = mapRef.current;
    facilityMarkersRef.current.forEach((m) => m.setMap(null));
    facilityMarkersRef.current = [];
    markers.forEach((item) => {
      const pos = new window.naver.maps.LatLng(item.lat, item.lng);
      const m = new window.naver.maps.Marker({ position: pos, map, draggable: false });
      facilityMarkersRef.current.push(m);
    });
  }, [markers]);

  return (
    <div
      ref={mapContainerRef}
      style={style}
      className="naver-map-container"
    />
  );
};

export default NaverMap;

