import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet 마커 아이콘 기본 설정 (렌더링 문제 해결)
// 이 코드는 모듈이 로드될 때 한 번만 실행되어야 함
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// React Strict Mode에서 중복 초기화 방지를 위한 전역 플래그
const mapInitializationFlags = new WeakMap<HTMLElement, boolean>();

// 지도 크기 조정을 위한 컴포넌트
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // 지도가 완전히 마운트된 후 크기 조정
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    
    // 윈도우 리사이즈 시에도 지도 크기 조정
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
};

// SelectedGroup 타입 정의
export type SelectedGroup = {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
  memberCount?: number;
  category?: string;
  description?: string;
  meetingTime?: string;
  contact?: string;
};

interface MapPanelProps {
  selectedGroup?: SelectedGroup | null;
  onCreateGroupClick?: () => void;
}

// 지도 중심 이동 컴포넌트
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);
  
  useEffect(() => {
    // 이전 중심과 다를 때만 이동 (무한 루프 방지)
    if (!prevCenterRef.current || 
        prevCenterRef.current[0] !== center[0] || 
        prevCenterRef.current[1] !== center[1]) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
      prevCenterRef.current = center;
    }
  }, [center, zoom, map]);
  return null;
};

const MapPanel = ({ selectedGroup = null, onCreateGroupClick }: MapPanelProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const defaultPosition: [number, number] = [37.5665, 126.9780]; // Default position (Seoul)
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
  // 컴포넌트 인스턴스마다 고유한 ID 생성 (React Strict Mode 대응)
  const mapIdRef = useRef(`map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useLayoutEffect(() => {
    // DOM이 준비된 후 맵 렌더링 여부 결정
    if (mapContainerRef.current) {
      const container = mapContainerRef.current;
      // 이미 맵이 초기화되어 있지 않은 경우에만 렌더링
      if (!(container as any)._leaflet_id && !mapInitializationFlags.get(container)) {
        setIsMounted(true);
        setShouldRenderMap(true);
      }
    } else {
      setIsMounted(true);
      setShouldRenderMap(true);
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 언마운트 시 맵 정리
    return () => {
      if (mapRef.current) {
        try {
          // DOM에서 맵 컨테이너 제거
          const container = mapRef.current.getContainer();
          if (container) {
            // Leaflet이 자동으로 정리하도록 함
            mapRef.current.remove();
            // DOM에서 Leaflet ID 제거
            delete (container as any)._leaflet_id;
            // 전역 플래그 제거
            mapInitializationFlags.delete(container);
          }
        } catch (e) {
          // 이미 제거된 경우 무시
        }
        mapRef.current = null;
      }
    };
  }, []);

  if (!isMounted || !shouldRenderMap) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <p className="text-[var(--color-text-secondary)]">지도를 불러오는 중...</p>
      </div>
    );
  }

  const mapCenter = selectedGroup ? selectedGroup.coordinates : defaultPosition;
  const mapZoom = selectedGroup ? 15 : 13;

  return (
    <div 
      ref={containerRef}
      className="h-full w-full" 
      style={{ height: '100%', width: '100%', position: 'relative' }}
    >
      <div 
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
      >
        <MapContainer
          key={mapIdRef.current}
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          whenCreated={(map) => {
            const container = map.getContainer();
            
            // 이미 초기화된 맵이 있으면 제거 (React Strict Mode 대응)
            if (mapRef.current && mapRef.current !== map) {
              try {
                const oldContainer = mapRef.current.getContainer();
                if (oldContainer) {
                  mapRef.current.remove();
                  delete (oldContainer as any)._leaflet_id;
                  mapInitializationFlags.delete(oldContainer);
                }
              } catch (e) {
                // 무시
              }
            }
            
            // 현재 맵 인스턴스 저장 및 플래그 설정
            mapRef.current = map;
            if (container) {
              mapInitializationFlags.set(container, true);
            }
          }}
          whenReady={() => {
            // 맵이 준비되면 크기 조정
            if (mapRef.current) {
              setTimeout(() => {
                mapRef.current?.invalidateSize();
              }, 100);
            }
          }}
        >
        <MapResizer />
        <MapController center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 선택된 그룹 마커 */}
        {selectedGroup && (
          <Marker position={selectedGroup.coordinates}>
            <Popup>
              <div>
                <strong>{selectedGroup.name}</strong>
                <br />
                {selectedGroup.location}
              </div>
            </Popup>
          </Marker>
        )}
        {/* 기본 위치 마커 (그룹이 선택되지 않았을 때만) */}
        {!selectedGroup && (
          <Marker position={defaultPosition}>
            <Popup>
              서울 시청 <br /> 현재 위치
            </Popup>
          </Marker>
        )}
        </MapContainer>
      </div>
      
      {/* 새 모임 만들기 플로팅 버튼 */}
      {onCreateGroupClick && (
        <button
          onClick={onCreateGroupClick}
          className="absolute bottom-6 right-6 z-[1000] bg-[var(--color-blue-primary)] text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          aria-label="새 모임 만들기"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="whitespace-nowrap font-semibold text-sm md:text-base">
            새 모임 만들기
          </span>
        </button>
      )}
    </div>
  );
};

export default MapPanel;
