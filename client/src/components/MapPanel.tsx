import React, { useEffect, useState } from 'react';
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
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapPanel = ({ selectedGroup = null, onCreateGroupClick }: MapPanelProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const defaultPosition: [number, number] = [37.5665, 126.9780]; // Default position (Seoul)
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // 컴포넌트가 마운트된 후 지도 초기화
    setIsMounted(true);
  }, []);

  // 선택된 그룹이 변경되면 지도 업데이트
  useEffect(() => {
    if (selectedGroup) {
      // 지도 재렌더링을 위해 key 변경
      setMapKey((prev) => prev + 1);
    }
  }, [selectedGroup]);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <p className="text-[var(--color-text-secondary)]">지도를 불러오는 중...</p>
      </div>
    );
  }

  const mapCenter = selectedGroup ? selectedGroup.coordinates : defaultPosition;
  const mapZoom = selectedGroup ? 15 : 13;

  return (
    <div className="h-full w-full" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        key={`map-container-${mapKey}`}
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
