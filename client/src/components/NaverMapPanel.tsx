import React, { useEffect, useRef, useState } from 'react';
import type { SelectedGroup } from '../types/selected-group';
import { getCityCoordinates, getRegionCoordinates, getRegionZoomLevel, getCityFromResidence, getUserCity, extractCityFromAddress, type KoreanCity } from '../utils/locationUtils';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { MATCH_TYPE_THEME } from './HomeMatchTypeChoice';

type MatchType = 'general' | 'rank' | 'event';

interface NaverMapPanelProps {
  selectedGroup?: SelectedGroup | null;
  allGroups?: SelectedGroup[];
  onCreateGroupClick?: () => void;
  onGroupClick?: (group: SelectedGroup) => void;
  /** 마커 클릭 시 해당 시설의 모든 매치를 좌측 목록에 표시 (시설명, 매치 목록) */
  onFacilityMarkerClick?: (info: { facilityName: string; groups: SelectedGroup[]; coords: [number, number] }) => void;
  /** 선택 지역: '전체' | 시/도 | 구 fullName | 동 fullName. 없으면 selectedCity 사용 */
  selectedRegion?: string | null;
  selectedCity?: string | null; // 선택된 도시 (deprecated: use selectedRegion)
  selectedCategory?: string | null; // 선택된 카테고리
  mapLayers?: {
    rankers?: boolean;
    events?: boolean;
    popularSpots?: boolean;
  };
  /** 매치 종류에 따른 FAB 버튼 문구 (일반 매치 생성 / 랭크 매치 생성 / 이벤트매치 생성) */
  matchType?: MatchType;
  /** 지도 기본 보기 단위 (사용자 주소 기준). 시≈5km, 구≈2km, 동≈500m */
  mapViewLevel?: 'sido' | 'gu' | 'dong';
}

declare global {
  interface Window {
    naver: any;
  }
}

// ⭐ 전역 플래그: 지도가 이미 생성되었는지 확인 (중복 생성 방지)
const mapInstanceCreated = new WeakMap<HTMLDivElement, boolean>();

const CREATE_BUTTON_LABEL: Record<MatchType, string> = {
  general: '일반 매치 생성',
  rank: '랭크 매치 생성',
  event: '이벤트매치 생성',
};

/** 지도 기본 보기 단위별 네이버 줌 레벨 (사용자 주소 기준) */
const MAP_VIEW_ZOOM_LEVELS: Record<'sido' | 'gu' | 'dong', number> = {
  sido: 12, // 시 단위 ≈ 3km
  gu: 13,   // 구 단위 ≈ 2km
  dong: 16, // 동 단위 ≈ 500m
};

const NaverMapPanel: React.FC<NaverMapPanelProps> = ({
  selectedGroup = null,
  allGroups = [],
  onCreateGroupClick,
  onGroupClick,
  onFacilityMarkerClick,
  selectedRegion: propSelectedRegion = null,
  selectedCity = null,
  selectedCategory = null,
  mapLayers = {},
  matchType = 'general',
  mapViewLevel = 'sido',
}) => {
  const selectedRegion = propSelectedRegion ?? selectedCity;
  const mapViewLevelRef = useRef(mapViewLevel);
  mapViewLevelRef.current = mapViewLevel;
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  /** 라벨(InfoWindow) 저장용. { overlay, lat, lng } - 줌 변경 시 재open 필요 */
  const overlaysRef = useRef<{ overlay: any; lat: number; lng: number }[]>([]);
  const scriptLoadedRef = useRef(false);
  const isInitializingRef = useRef(false); // 초기화 중 플래그
  const prevCategoryRef = useRef<string | null>(null); // 이전 카테고리 추적용
  const lastSelectedGroupRef = useRef<SelectedGroup | null>(null); // 마지막으로 선택된 매치 저장용
  const selectedGroupRef = useRef<SelectedGroup | null>(selectedGroup); // 지도 초기화 시 최신 선택 매치 반영용
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ResizeObserver 디바운스
  const initializeMapRef = useRef<(() => void) | null>(null); // 상세 패널 열릴 때 지도 재생성 호출용
  const [defaultPosition, setDefaultPosition] = useState<[number, number]>([37.5665, 126.9780]);
  const [userResidenceSido, setUserResidenceSido] = useState<string | null>(null);
  const [userResidenceAddress, setUserResidenceAddress] = useState<string | null>(null);
  /** 지도 인스턴스 생성 완료 시 true. allGroups 로드 후 지도가 늦게 준비될 때 마커를 그리기 위해 사용 */
  const [mapReady, setMapReady] = useState(false);
  /** 매치 주소를 지오코딩한 좌표 (마커를 실제 주소 위치에 표시하기 위함) */
  const [geocodedCoords, setGeocodedCoords] = useState<Record<number, [number, number]>>({});
  /** 사용자 주소(residenceAddress) 지오코딩 결과 - 내 위치 마커용 */
  const [userAddressCoords, setUserAddressCoords] = useState<[number, number] | null>(null);
  /** Naver 지도/지오코더 스크립트 로드 완료 시 true. 지오코딩을 이 시점 이후에 실행하기 위함 */
  const [naverReady, setNaverReady] = useState(false);
  /** 내 정보에서 주소 저장 시 지오코딩 재실행용 */
  const [locationUpdateVersion, setLocationUpdateVersion] = useState(0);
  /** Service.geocode 사용 가능 시 true (서브모듈 비동기 로드 대기) */
  const [geocoderReady, setGeocoderReady] = useState(false);
  /** 현재 지도 줌 레벨 (라벨 표시 여부 판단용. 500m 축척 ≈ 17 이상) */
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(10);

  // ⭐ 매치 제목 라벨 표시 조건
  // - 상세보기(선택된 매치)가 열려 있을 때, 또는 특정 카테고리(전체 제외)를 선택했을 때
  // - 그리고 줌이 500m 축척(레벨 17) 이상일 때만 (축소 시 UI 복잡도 완화)
  const ZOOM_LABEL_THRESHOLD = 17; // 네이버 줌 17 ≈ 500m 축척
  const shouldShowLabelsBase =
    !!selectedGroup || (!!selectedCategory && selectedCategory !== '전체');
  const shouldShowLabels =
    shouldShowLabelsBase && mapZoomLevel >= ZOOM_LABEL_THRESHOLD;

  /** 매치 타입·마감 여부에 따른 마커 색상 (일반=파랑, 랭크=주황, 이벤트=보라, 마감=회색) */
  const getMatchMarkerColor = (group: SelectedGroup): string => {
    if (group.isFull) return '#6b7280'; // 회색 (마감)
    const t = group.type || 'normal';
    if (t === 'rank') return MATCH_TYPE_THEME.rank.accentHex;
    if (t === 'event') return MATCH_TYPE_THEME.event.accentHex;
    return MATCH_TYPE_THEME.general.accentHex; // 일반 = 파란색
  };

  // ⭐ 모임 제목 라벨 (InfoWindow 사용, CSS로 배경 제거)
  const createLabelOverlay = (name: string, position: any) => {
    return new window.naver.maps.InfoWindow({
      position,
      content: `
        <div class="group-label-text" style="
          background: transparent;
          color: #111827;
          padding: 0;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        ">
          ${name}
        </div>
      `,
      pixelOffset: new window.naver.maps.Point(0, -10),
      disableAnchor: false,
    });
  };

  /** API에 저장된 좌표가 도시 시청(중심)과 동일한지 여부. 시청 좌표면 실제 매치 위치가 아니므로 지오코딩 사용 */
  const isSameAsCityCenter = (lat: number, lng: number, address: string | undefined): boolean => {
    if (!address || typeof address !== 'string' || address.trim() === '') return false;
    const city = extractCityFromAddress(address);
    if (!city || city === '전체') return false;
    const cityCoords = getCityCoordinates(city as KoreanCity);
    if (!cityCoords) return false;
    const eps = 0.003; // 약 300m 이내면 동일 좌표로 간주
    return Math.abs(lat - cityCoords[0]) < eps && Math.abs(lng - cityCoords[1]) < eps;
  };
  
  // 카카오 레벨(1-14)을 네이버 레벨(0-21)로 변환
  const convertKakaoLevelToNaver = (kakaoLevel: number): number => {
    // 카카오 1-14 → 네이버 0-21
    return Math.round((kakaoLevel - 1) * 1.5);
  };

  /** 우측 지도 패널 시각적 중앙에 마커가 오도록 setCenter 후 panBy 보정.
   *  네이버 panBy(dx,dy)는 '콘텐츠를 (dx,dy)만큼 이동'으로 해석됨 → 마커가 오른쪽이면 왼쪽으로 보내려면 dx < 0
   *  레이아웃 확정 후 한 번만 panBy 호출해 깜빡임 방지 */
  const centerMapOnMarker = (
    map: any,
    container: HTMLDivElement | null,
    lat: number,
    lng: number,
    zoom?: number,
    options?: { skipRefreshSize?: boolean }
  ) => {
    if (!map || !container || !window.naver?.maps) return;
    const latLng = new window.naver.maps.LatLng(lat, lng);
    map.setCenter(latLng);
    if (typeof zoom === 'number') map.setZoom(zoom);
    if (!options?.skipRefreshSize && typeof map.refreshSize === 'function') map.refreshSize();
    const runPanBy = () => {
      const proj = map.getProjection?.();
      if (!proj || typeof proj.pointFromCoord !== 'function') return;
      const markerPoint = proj.pointFromCoord(latLng);
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const desiredX = rect.left + rect.width / 2;
      const desiredY = rect.top + rect.height / 2;
      const dx = desiredX - markerPoint.x;
      const dy = desiredY - markerPoint.y;
      const maxPan = Math.max(rect.width, rect.height) * 1.5;
      if (Math.abs(dx) > maxPan || Math.abs(dy) > maxPan) return;
      map.panBy(new window.naver.maps.Point(dx, dy));
    };
    // setCenter/setZoom과 같은 틱에 panBy 실행 → 지도 갱신 1회로 묶여 idle 이벤트 1회만 발생
    setTimeout(runPanBy, 0);
  };

  /** 지도 완전 제거 (상세 패널 열릴 때 재생성 전 호출). 컨테이너는 유지하고 내부만 비움 */
  const destroyMap = () => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    try {
      markersRef.current.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (e) {
          /* 무시 */
        }
      });
      markersRef.current = [];
      overlaysRef.current.forEach(({ overlay }) => {
        try {
          if (overlay && typeof overlay.close === 'function') overlay.close();
        } catch (e) {
          /* 무시 */
        }
      });
      overlaysRef.current = [];
      if (mapRef.current) mapRef.current = null;
      mapInstanceCreated.delete(container);
      while (container.firstChild) container.removeChild(container.firstChild);
      isInitializingRef.current = false;
    } catch (e) {
      console.warn('지도 제거 중 오류:', e);
    }
  };

  // 사용자 위치 가져오기 (localStorage > API residenceAddress/residenceSido 기반)
  const getUserLocation = (): { coords: [number, number]; isDefault: boolean } => {
    const city = getUserCity(user?.id, {
      residenceAddress: (userResidenceAddress || user?.residenceAddress) ?? undefined,
      residenceSido: (userResidenceSido || user?.residenceSido) ?? undefined,
    });
    if (city && city !== '전체') {
      const coords = getCityCoordinates(city);
      if (coords) return { coords, isDefault: false };
    }
    return { coords: [37.5665, 126.9780], isDefault: true }; // 거주지 없을 때 서울 기본값
  };

  // selectedGroup 변경 시 ref 동기화 (지도 초기화가 늦을 때 선택 매치 좌표 사용)
  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  // 로그인된 경우 사용자 거주지(residenceSido, residenceAddress) 조회 - 내 위치 마커용
  useEffect(() => {
    if (!user) {
      setUserResidenceSido(null);
      setUserResidenceAddress(null);
      return;
    }
    if (user.residenceSido) setUserResidenceSido(user.residenceSido);
    if (user.residenceAddress) setUserResidenceAddress(user.residenceAddress);
    const fetchUserResidence = async () => {
      try {
        const userData = await api.get<{ residenceSido: string | null; residenceAddress: string | null }>('/api/auth/me');
        if (userData?.residenceSido != null) setUserResidenceSido(userData.residenceSido);
        if (userData?.residenceAddress != null) setUserResidenceAddress(userData.residenceAddress);
      } catch {
        setUserResidenceSido(null);
        setUserResidenceAddress(null);
      }
    };
    fetchUserResidence();
  }, [user]);

  /** userAddressCoords(실제 주소 지오코딩) 반영 시 지도 기본 위치를 시청 대신 내 주소로 설정 */
  const userCity = getUserCity(user?.id, {
    residenceAddress: (userResidenceAddress || user?.residenceAddress) ?? undefined,
    residenceSido: (userResidenceSido || user?.residenceSido) ?? undefined,
  });
  useEffect(() => {
    if (!userAddressCoords || selectedRegion === '전체') return;
    if (selectedRegion && userCity && selectedRegion === userCity) {
      setDefaultPosition((prev) =>
        prev[0] !== userAddressCoords[0] || prev[1] !== userAddressCoords[1]
          ? userAddressCoords
          : prev
      );
    } else if (!selectedRegion && userCity) {
      setDefaultPosition((prev) =>
        prev[0] !== userAddressCoords[0] || prev[1] !== userAddressCoords[1]
          ? userAddressCoords
          : prev
      );
    }
  }, [userAddressCoords, selectedRegion, userCity]);
  
  // 위치 정보 초기 로드 및 localStorage 변경 감지
  // ⭐ selectedRegion가 있으면 우선 사용, 없으면 localStorage 사용
  useEffect(() => {
    const updateLocation = () => {
      let newPosition: [number, number];
      
      // selectedRegion가 있으면 우선 사용
      if (selectedRegion && selectedRegion !== '전체') {
        const cityCoordinates = getRegionCoordinates(selectedRegion) ?? getCityCoordinates(selectedRegion as KoreanCity);
        if (cityCoordinates) {
          newPosition = cityCoordinates;
        } else {
          newPosition = getUserLocation().coords;
        }
      } else if (selectedRegion === '전체') {
        // '전체' 선택 시 대한민국 중심 좌표 사용
        newPosition = [36.3504, 127.3845]; // 대한민국 중심 좌표
      } else {
        // selectedRegion가 없으면 localStorage 사용
        newPosition = getUserLocation().coords;
      }
      
      setDefaultPosition(prev => {
        // 위치가 실제로 변경되었을 때만 업데이트
        if (prev[0] !== newPosition[0] || prev[1] !== newPosition[1]) {
          return newPosition;
        }
        return prev;
      });
    };
    
    // 초기 위치 로드 (약간의 지연을 두어 컴포넌트 마운트 완료 후 실행)
    setTimeout(() => {
      updateLocation();
    }, 100);
    
    // selectedRegion 변경 시에도 위치 업데이트
    updateLocation();
    
    // localStorage 변경 감지 (storage 이벤트는 다른 탭에서만 발생하므로 직접 체크)
    // 초기화가 완료된 후에만 체크 시작 (3초 후)
    const checkInterval = setInterval(() => {
      // 지도가 초기화되지 않았으면 스킵
      if (!scriptLoadedRef.current) {
        return;
      }
      
      // '전체' 선택 시에는 사용자 위치를 업데이트하지 않음
      if (selectedRegion === '전체') {
        return;
      }
      
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          if (location.latitude && location.longitude) {
            setDefaultPosition(prev => {
              if (prev[0] !== location.latitude || prev[1] !== location.longitude) {
                return [location.latitude, location.longitude];
              }
              return prev;
            });
          }
        } catch (e) {
          // 무시
        }
      }
    }, 2000); // 2초마다 체크 (너무 자주 체크하지 않도록)
    
    // storage 이벤트 리스너 (다른 탭에서 변경 시)
    const handleStorageChange = (e: StorageEvent) => {
      // '전체' 선택 시에는 사용자 위치를 업데이트하지 않음
      if (selectedRegion === '전체') {
        return;
      }
      
      if (e.key === 'userLocation' && e.newValue) {
        try {
          const location = JSON.parse(e.newValue);
          if (location.latitude && location.longitude) {
            setDefaultPosition([location.latitude, location.longitude]);
          }
        } catch (e) {
          // 무시
        }
      }
    };
    
    // 커스텀 이벤트 리스너 (같은 탭에서 변경 시)
    const handleUserLocationUpdated = (e: CustomEvent) => {
      // '전체' 선택 시에는 사용자 위치를 업데이트하지 않음
      if (selectedRegion === '전체') {
        return;
      }
      
      const { latitude, longitude } = e.detail;
      if (latitude && longitude) {
        setDefaultPosition([latitude, longitude]);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLocationUpdated', handleUserLocationUpdated as EventListener);
    
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLocationUpdated', handleUserLocationUpdated as EventListener);
    };
  }, [selectedRegion]); // selectedRegion 변경 시에도 업데이트

  // 카카오맵 스크립트 로드
  useEffect(() => {
    // ⭐ 중복 초기화 방지: 이미 지도가 생성되어 있으면 스킵
    if (mapContainerRef.current && mapInstanceCreated.get(mapContainerRef.current) && mapRef.current) {
      console.log('✅ 지도가 이미 생성되어 있습니다. 초기화를 건너뜁니다.');
      return;
    }
    
    // 초기화 플래그 리셋
    isInitializingRef.current = false;
    // 로딩 상태는 초기값 false 유지 (지도 컨테이너를 먼저 표시)
    
    const loadNaverMapScript = () => {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      
      if (!NAVER_CLIENT_ID) {
        console.error('네이버 지도 Client ID가 설정되지 않았습니다. VITE_NAVER_MAP_CLIENT_ID를 .env 파일에 추가해주세요.');
        return;
      }

      // 이미 로드되어 있으면 스킵
      if (window.naver && window.naver.maps) {
        scriptLoadedRef.current = true;
        scriptLoadedRef.current = true;
        setNaverReady(true);
        setTimeout(() => {
          if (mapContainerRef.current && !isInitializingRef.current) {
            initializeMap();
          }
        }, 100);
        return;
      }

      // 스크립트가 이미 추가되어 있는지 확인 (main.tsx에서 미리 로드한 경우)
      const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
      if (existingScript) {
        // 스크립트가 있으면 로드 완료를 기다림
        console.log('네이버 지도 스크립트가 이미 존재합니다. 로드 완료 대기 중...');
        const checkInterval = setInterval(() => {
          if (window.naver && window.naver.maps) {
            clearInterval(checkInterval);
            console.log('✅ 네이버 지도 API 준비 완료');
            scriptLoadedRef.current = true;
            setNaverReady(true);
            setTimeout(() => {
              if (mapContainerRef.current && !isInitializingRef.current) {
                initializeMap();
              }
            }, 50);
          }
        }, 50);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!scriptLoadedRef.current) {
            console.error('❌ 네이버 지도 스크립트 로드 타임아웃');
            console.error('🔍 확인 사항:');
            console.error('1. 네이버 클라우드 플랫폼 콘솔에서 Web Service URL에 http://localhost:5173이 등록되어 있는지 확인');
            console.error('2. Client ID가 올바른지 확인');
            console.error('3. Network 탭에서 oapi.map.naver.com 요청의 상태 코드 확인 (403 Forbidden이면 URL 미등록)');
            console.error('4. 브라우저 콘솔에서 스크립트 로드 에러 메시지 확인');
          }
        }, 10000);
        return;
      }

      // 스크립트 동적 로드 (main.tsx에서 미리 로드하지 않은 경우에만)
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
            setNaverReady(true);
            setTimeout(() => {
              if (mapContainerRef.current && !isInitializingRef.current) {
                initializeMap();
              }
            }, 50);
          }
        }, 50);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkNaver);
          if (!scriptLoadedRef.current) {
            console.error('네이버 지도 초기화 타임아웃 - naver 객체를 찾을 수 없습니다');
            console.error('Network 탭에서 스크립트 요청 상태를 확인해주세요');
          }
        }, 10000);
      };
      script.onerror = (error) => {
        console.error('❌ 네이버 지도 스크립트 로드 실패');
        console.error('에러 상세:', error);
        console.error('요청 URL:', scriptUrl);
        console.error('Client ID:', NAVER_CLIENT_ID ? `${NAVER_CLIENT_ID.substring(0, 10)}...` : '없음');
        console.error('');
        console.error('🔍 확인 사항:');
        console.error('1. 네이버 클라우드 플랫폼 콘솔에서 Client ID가 올바른지 확인');
        console.error('2. Web Service URL에 http://localhost:5173이 등록되어 있는지 확인');
        console.error('3. Network 탭에서 oapi.map.naver.com 요청의 상태 코드 확인');
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      // ⭐ 중복 초기화 방지: 여러 조건 확인
      if (isInitializingRef.current) {
        return;
      }
      
      // 컨테이너 확인
      if (!mapContainerRef.current) {
        return;
      }
      
      const container = mapContainerRef.current;
      
      // 재생성 시 컨테이너가 부모 크기를 따르도록 100%로 초기화 (픽셀 잔여값 제거)
      container.style.width = '100%';
      container.style.height = '100%';
      
      // ⭐ 전역 플래그 확인: 이미 지도가 생성되었는지 확인 (최우선)
      if (mapInstanceCreated.get(container)) {
        return;
      }
      
      // 기존 지도 인스턴스가 있으면 완전히 제거
      if (mapRef.current) {
        try {
          // 마커 제거
          markersRef.current.forEach(marker => {
            try {
              marker.setMap(null);
            } catch (e) {
              // 무시
            }
          });
          markersRef.current = [];
          
          // HTML 라벨 요소 직접 제거
          if (mapContainerRef.current) {
            const labels = mapContainerRef.current.querySelectorAll('[data-group-label]');
            labels.forEach(label => label.remove());
          }
          overlaysRef.current = [];
          
          // 지도 인스턴스 제거
          mapRef.current = null;
          setMapReady(false);
        } catch (e) {
          // 기존 지도 제거 중 오류 무시
        }
      }
      
      // ⭐ 지도가 이미 생성되어 있으면 절대 초기화하지 않음 (최우선 체크)
      if (mapInstanceCreated.get(container) && mapRef.current) {
        console.log('✅ 지도가 이미 생성되어 있습니다. 초기화를 건너뜁니다.');
        isInitializingRef.current = false;
        return;
      }
      
      // DOM에 지도가 있는지 확인 - 하지만 이미 지도가 생성되어 있으면 제거하지 않음
      // ⭐ 핵심: 지도가 이미 생성되어 있으면 (mapInstanceCreated.get(container)가 true) 컨테이너를 건드리지 않음
      // ⭐ 추가 체크: mapRef.current가 있고 지도가 실제로 존재하는지 확인
      if (container.children.length > 0 && !mapInstanceCreated.get(container) && !mapRef.current) {
        // 지도가 생성되지 않은 상태에서만 자식 요소 제거 (이전 지도 잔여물 정리)
        console.log('⚠️ 컨테이너에 자식 요소가 있지만 지도가 생성되지 않았습니다. 정리 중...');
        // 모든 자식 요소 제거
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.innerHTML = '';
        // 전역 플래그도 제거
        mapInstanceCreated.delete(container);
        // 카카오맵이 추가한 속성 제거
        container.removeAttribute('data-kakao-map');
        // 잠시 대기 후 재시도
        setTimeout(() => {
          if (!isInitializingRef.current && mapContainerRef.current && mapContainerRef.current.children.length === 0) {
            initializeMap();
          }
        }, 100);
        return;
      }
      
      // ⭐ 추가 안전장치: 지도가 이미 생성되어 있으면 초기화를 건너뜀
      if (mapInstanceCreated.get(container) || mapRef.current) {
        console.log('✅ 지도가 이미 생성되어 있습니다. 초기화를 건너뜁니다.');
        isInitializingRef.current = false;
        return;
      }
      
      if (!window.naver || !window.naver.maps) {
        console.warn('지도 초기화 조건 불만족:', {
          hasContainer: !!mapContainerRef.current,
          hasNaver: !!window.naver,
          hasMaps: !!(window.naver && window.naver.maps)
        });
        isInitializingRef.current = false;
        return;
      }
      
      // LatLng 생성자가 준비되었는지 확인
      if (typeof window.naver.maps.LatLng !== 'function') {
        console.warn('LatLng 생성자가 아직 준비되지 않았습니다. 잠시 후 다시 시도합니다.');
        setTimeout(() => {
          if (!isInitializingRef.current && mapContainerRef.current) {
            initializeMap();
          }
        }, 100);
        return;
      }
      
      // 초기화 시작
      isInitializingRef.current = true;
      
      // ⭐ selectedRegion가 있으면 우선 사용, 없으면 사용자 위치 사용
      // '전체' 선택 시에만 대한민국 중심 좌표 사용
      let currentPosition: [number, number];
      if (selectedRegion && selectedRegion !== '전체') {
        const cityCoordinates = getRegionCoordinates(selectedRegion) ?? getCityCoordinates(selectedRegion as KoreanCity);
        if (cityCoordinates) {
          currentPosition = cityCoordinates;
        } else {
          // 도시 좌표를 찾을 수 없으면 사용자 위치 사용
          currentPosition = getUserLocation().coords;
        }
      } else if (selectedRegion === '전체') {
        // '전체' 선택 시에만 대한민국 중심 좌표 사용
        currentPosition = [36.3504, 127.3845]; // 대한민국 중심 좌표
      } else {
        // selectedRegion가 null일 때 사용자 위치 사용
        currentPosition = getUserLocation().coords;
      }

      // 지도 컨테이너 크기 확인 (여러 방법으로 시도)
      const rect = container.getBoundingClientRect();
      const containerWidth = container.offsetWidth || container.clientWidth || rect.width || window.innerWidth;
      const containerHeight = container.offsetHeight || container.clientHeight || rect.height || window.innerHeight * 0.6;
      
      if (containerWidth === 0 || containerHeight === 0) {
        console.warn('지도 컨테이너 크기가 0입니다. 크기 조정 후 다시 시도합니다.');
        isInitializingRef.current = false; // 초기화 실패 시 플래그 해제
        // 컨테이너 크기가 설정될 때까지 대기 (최대 5초)
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
          retryCount++;
          const newRect = container.getBoundingClientRect();
          const newWidth = container.offsetWidth || container.clientWidth || newRect.width || window.innerWidth;
          const newHeight = container.offsetHeight || container.clientHeight || newRect.height || window.innerHeight * 0.6;
          
          if ((newWidth > 0 && newHeight > 0) || retryCount >= maxRetries) {
            clearInterval(retryInterval);
            if (newWidth > 0 && newHeight > 0 && !isInitializingRef.current) {
              initializeMap();
            } else {
              console.error('지도 컨테이너 크기를 가져올 수 없습니다.');
              isInitializingRef.current = false;
            }
          }
        }, 100); // 500ms -> 100ms로 단축하여 더 빠른 재시도
        return;
      }

      // 위치 정보 확인 및 설정: selectedGroupRef 사용 (비동기 초기화 시점에 선택된 매치 좌표 반영)
      let mapCenter;
      const groupForCenter = selectedGroupRef.current;
      try {
        mapCenter = groupForCenter && typeof groupForCenter.coordinates[0] === 'number' && typeof groupForCenter.coordinates[1] === 'number'
          ? new window.naver.maps.LatLng(groupForCenter.coordinates[0], groupForCenter.coordinates[1])
          : new window.naver.maps.LatLng(currentPosition[0], currentPosition[1]);
      } catch (error) {
        console.error('LatLng 생성 실패:', error);
        isInitializingRef.current = false;
        setTimeout(() => {
          if (!isInitializingRef.current && mapContainerRef.current) {
            initializeMap();
          }
        }, 100);
        return;
      }
      
      // 줌 레벨 설정: 매치 상세 시 확대, '전체' 시 50km, 도시/사용자 위치 시 mapViewLevel(시/구/동) 적용
      let mapZoom: number;
      if (groupForCenter) {
        mapZoom = 17; // 매치 위치로 확대
      } else if (selectedRegion === '전체') {
        mapZoom = 8; // 50km 스케일
      } else {
        // 도시/구/동 선택 또는 사용자 위치: 선택 지역에 맞는 줌(시=10, 구=13, 동=16) 또는 검색 옵션 적용
        mapZoom = getRegionZoomLevel(selectedRegion ?? '') || MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido'];
      }

      // 지도 생성
      // ⭐ 네이버 지도 API v3 기본 옵션만 사용 (subdomains 옵션은 v3에서 지원하지 않음)
      const options = {
        center: mapCenter,
        zoom: mapZoom,
      };

      // 지도 생성 전에 컨테이너 크기 설정 (0이면 픽셀 고정하지 않음 → 100% 유지로 레이아웃 후 refreshSize 대응)
      if (containerWidth > 0 && containerHeight > 0) {
        container.style.width = `${containerWidth}px`;
        container.style.height = `${containerHeight}px`;
      }
      
      // ⭐ 지도 생성 전에 isInitializingRef를 true로 설정
      isInitializingRef.current = true;
      
      let map: any;
      try {
        console.log('🔍 지도 생성 시도:', {
          container: container,
          options: options,
          hasNaver: !!window.naver,
          hasMaps: !!(window.naver && window.naver.maps),
          hasMapConstructor: !!(window.naver && window.naver.maps && window.naver.maps.Map),
          clientId: import.meta.env.VITE_NAVER_MAP_CLIENT_ID
        });
        
        map = new window.naver.maps.Map(container, options);
        mapRef.current = map;
        setMapReady(true);
        
        console.log('✅ 지도 생성 성공:', map);
        console.log('📍 현재 페이지 URL:', window.location.href);
        console.log('🔑 Client ID:', import.meta.env.VITE_NAVER_MAP_CLIENT_ID);
        console.log('📍 컨테이너 크기:', {
          width: container.offsetWidth,
          height: container.offsetHeight,
          childrenCount: container.children.length
        });
        
        // ⭐ 전역 플래그 설정: 지도가 생성되었음을 표시 (가장 먼저 설정)
        mapInstanceCreated.set(container, true);
        
        // 지도 생성 후 에러 이벤트 리스너 추가
        if (window.naver && window.naver.maps && window.naver.maps.Event) {
          window.naver.maps.Event.addListener(map, 'error', (error: any) => {
            console.error('❌ 네이버 지도 에러 이벤트 발생:', error);
            console.error('📍 에러 상세:', {
              error: error,
              currentUrl: window.location.href,
              clientId: import.meta.env.VITE_NAVER_MAP_CLIENT_ID,
              referrer: document.referrer
            });
          });
        }
        
        // ⭐ 지도 ready 이벤트 리스너 추가 (지도가 완전히 로드되었을 때)
        if (window.naver && window.naver.maps && window.naver.maps.Event) {
          window.naver.maps.Event.addListener(map, 'init', () => {
            console.log('✅ 네이버 지도 init 이벤트 발생 - 지도 초기화 완료');
          });
          
          // idle은 setCenter/setZoom/panBy 등 지도 갱신마다 1회씩 발생 → 한 번만 로그 (중복 제거)
          let idleLogOnce = true;
          window.naver.maps.Event.addListener(map, 'idle', () => {
            if (idleLogOnce) {
              idleLogOnce = false;
              console.log('✅ 네이버 지도 idle - 지도 타일 로드 완료');
            }
          });

          // 줌 변경 시 라벨 표시 여부 업데이트 (500m 축척 이상에서만 라벨 표시)
          const updateZoomLevel = () => {
            if (mapRef.current && typeof mapRef.current.getZoom === 'function') {
              setMapZoomLevel(mapRef.current.getZoom());
            }
          };
          window.naver.maps.Event.addListener(map, 'zoom_changed', updateZoomLevel);
          updateZoomLevel(); // 초기 줌 레벨 설정
        }
        
        // ⭐ 지도 컨테이너 크기 모니터링 (지도가 사라지는 문제 방지)
        const checkContainerSize = () => {
          if (!mapRef.current || !container) return;
          
          const rect = container.getBoundingClientRect();
          const width = container.offsetWidth || container.clientWidth || rect.width;
          const height = container.offsetHeight || container.clientHeight || rect.height;
          
          // 컨테이너 크기가 0이 되면 경고
          if (width === 0 || height === 0) {
            console.warn('⚠️ 지도 컨테이너 크기가 0입니다:', { width, height });
            console.warn('📍 컨테이너 상태:', {
              display: window.getComputedStyle(container).display,
              visibility: window.getComputedStyle(container).visibility,
              opacity: window.getComputedStyle(container).opacity,
              childrenCount: container.children.length
            });
            
            // 컨테이너 크기가 0이면 refreshSize 호출 시도
            if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
              setTimeout(() => {
                if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
                  mapRef.current.refreshSize();
                }
              }, 100);
            }
          }
        };
        
        // 주기적으로 컨테이너 크기 확인 (5초마다)
        const sizeCheckInterval = setInterval(checkContainerSize, 5000);
        
        // 컴포넌트 언마운트 시 인터벌 정리
        setTimeout(() => {
          clearInterval(sizeCheckInterval);
        }, 60000); // 1분 후 정리
        
        // 지도 생성 직후 relayout → setLevel 순서로 확실히 설정
        // setTimeout을 사용하여 지도가 완전히 초기화된 후 실행
        setTimeout(() => {
          if (mapRef.current) {
            // 1. refreshSize로 컨테이너 크기 재계산 (메서드 존재 확인)
            if (typeof mapRef.current.refreshSize === 'function') {
              if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
            }
            
            // 2. 선택된 매치가 있으면 해당 좌표로 중심·줌 (지역 '전체'여도 매치로 이동, 줌 17 ≈ 100m 축척)
            const groupNow = selectedGroupRef.current;
            if (groupNow && typeof groupNow.coordinates[0] === 'number' && typeof groupNow.coordinates[1] === 'number') {
              centerMapOnMarker(
                mapRef.current,
                mapContainerRef.current,
                groupNow.coordinates[0],
                groupNow.coordinates[1],
                17
              );
            } else if (selectedRegion === '전체') {
              // '전체' 선택 시에만 대한민국 중심 유지 (50km 스케일)
              const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845);
              mapRef.current.setCenter(koreaCenter);
              const naverLevel = 8; // 네이버 레벨 8 = 약 50km 스케일
              mapRef.current.setZoom(naverLevel);
              // 지도 레벨을 localStorage에 저장
              try {
                localStorage.setItem('mapLevel', '8');
              } catch (e) {
                // 무시
              }
            } else if (!selectedRegion) {
              // selectedRegion가 null일 때 사용자 위치 사용 (mapViewLevel 적용)
              const userLocation = getUserLocation().coords;
              const userCenter = new window.naver.maps.LatLng(userLocation[0], userLocation[1]);
              mapRef.current.setCenter(userCenter);
              const zoomLevel = MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido'];
              mapRef.current.setZoom(zoomLevel);
              // 지도 레벨을 localStorage에 저장
              try {
                localStorage.setItem('mapLevel', zoomLevel.toString());
              } catch (e) {
                // 무시
              }
            }
            
            // 3. 재생성 시 패널 크기에 맞추기 위해 refreshSize 여러 번 호출 (레이아웃 확정 후 지도가 영역을 채우도록)
            const doRefresh = () => {
              if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
                mapRef.current.refreshSize();
              }
            };
            setTimeout(doRefresh, 50);
            setTimeout(doRefresh, 150);
            setTimeout(doRefresh, 300);
            setTimeout(doRefresh, 500);
          }
        }, 300); // 지도 생성 후 300ms 대기
        
        // 지도가 생성된 직후 여러 번 refreshSize 호출 (크기 조정)
        const refreshMapSize = () => {
          if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
            try {
              if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
            } catch (error) {
              // refreshSize 실패 시 무시
            }
          }
        };
        
        // 즉시 refreshSize
        setTimeout(refreshMapSize, 50);
        // 추가 refreshSize (컨테이너 크기가 안정화된 후)
        setTimeout(refreshMapSize, 200);
        setTimeout(refreshMapSize, 500);
      } catch (error) {
        console.error('❌ 지도 생성 실패:', error);
        console.error('에러 상세:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          clientId: import.meta.env.VITE_NAVER_MAP_CLIENT_ID,
          currentUrl: window.location.href,
          referrer: document.referrer
        });
        console.error('🔍 확인 사항:');
        console.error('1. 네이버 클라우드 플랫폼 콘솔에서 "저장" 버튼을 눌렀는지 확인');
        console.error('2. 등록 후 1-2분 정도 기다린 후 다시 시도');
        console.error('3. 브라우저 캐시를 완전히 삭제하고 하드 리프레시 (Ctrl+Shift+Delete)');
        console.error('4. Client ID가 올바른지 확인:', import.meta.env.VITE_NAVER_MAP_CLIENT_ID);
        isInitializingRef.current = false; // 초기화 실패 시 플래그 해제
        return;
      }

      if (!map || !mapRef.current) {
        console.error('❌ 지도 객체가 생성되지 않았습니다.');
        return;
      }

      // 기존 마커 및 오버레이 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      // 기존 라벨 제거
      overlaysRef.current.forEach(({ overlay }) => {
        try {
          if (overlay && typeof overlay.close === 'function') overlay.close();
        } catch (e) {
          /* 무시 */
        }
      });
      overlaysRef.current = [];

      // ⭐ 모든 마커(그룹 + 모임 없을 때 기본)는 마커 useEffect에서만 그림. 여기서는 시청/현재위치 마커를 그리지 않음

      // 지도 초기화 완료 후 최종 조정
      // 지도가 빠르게 표시되도록 지연 시간 단축
      setTimeout(() => {
            // 지도 크기 최종 조정
            if (mapRef.current) {
              try {
                if (typeof mapRef.current.refreshSize === 'function') {
                  if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
                }
                // '전체' 선택 시에만 대한민국 중심으로 재설정 (매치 상세보기 중이면 건너뜀)
                if (selectedRegion === '전체' && !selectedGroupRef.current) {
                  const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845);
                  mapRef.current.setCenter(koreaCenter);
                  const naverLevel = 8; // 네이버 레벨 8 = 약 50km 스케일
                  mapRef.current.setZoom(naverLevel);
                  try {
                    localStorage.setItem('mapLevel', '8');
                  } catch (e) {
                    /* ignore */
                  }
                } else if (!selectedRegion && !selectedGroupRef.current) {
                  // selectedRegion가 null일 때 사용자 위치 사용 (매치 상세 중이면 건너뜀)
                  const userLocation = getUserLocation().coords;
                  const userCenter = new window.naver.maps.LatLng(userLocation[0], userLocation[1]);
                  mapRef.current.setCenter(userCenter);
                  const zoomLevel = MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido'];
                  mapRef.current.setZoom(zoomLevel);
                  try {
                    localStorage.setItem('mapLevel', zoomLevel.toString());
                  } catch (e) {
                    /* ignore */
                  }
                } else if (selectedRegion && selectedRegion !== '전체' && !selectedGroupRef.current) {
              // 특정 지역(시/구/동) 선택 시 해당 지역 중심·줌으로 설정 (매치 상세 중이면 건너뜀)
              const cityCoordinates = getRegionCoordinates(selectedRegion) ?? getCityCoordinates(selectedRegion as KoreanCity);
              if (cityCoordinates) {
                const cityCenter = new window.naver.maps.LatLng(cityCoordinates[0], cityCoordinates[1]);
                mapRef.current.setCenter(cityCenter);
                const zoomLevel = getRegionZoomLevel(selectedRegion);
                mapRef.current.setZoom(zoomLevel);
                try {
                  localStorage.setItem('mapLevel', zoomLevel.toString());
                  console.log('✅ 지도 최종 조정 - 선택된 지역 중심으로 설정:', selectedRegion, '네이버 레벨:', zoomLevel);
                } catch (e) {
                  // 무시
                }
              } else {
                const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845);
                mapRef.current.setCenter(koreaCenter);
                mapRef.current.setZoom(convertKakaoLevelToNaver(7));
                console.log('✅ 지도 최종 조정 - 지역 좌표 없음, 대한민국 중심으로 설정');
              }
            }
          } catch (error) {
            console.error('❌ 지도 refreshSize 실패:', error);
          }
        }
        isInitializingRef.current = false; // 초기화 완료
        console.log('✅ 지도 초기화 완료');
      }, 300); // 800ms -> 300ms로 단축
    };
    initializeMapRef.current = initializeMap;

    loadNaverMapScript();

    // 윈도우 리사이즈 시 지도 크기 조정
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
            mapRef.current.refreshSize();
          }
          const group = selectedGroupRef.current;
          if (group && mapRef.current && mapContainerRef.current) {
            centerMapOnMarker(
              mapRef.current,
              mapContainerRef.current,
              group.coordinates[0],
              group.coordinates[1],
              17
            );
          } else if (!group && selectedRegion === '전체' && mapRef.current) {
            const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845);
            mapRef.current.setCenter(koreaCenter);
            mapRef.current.setZoom(8);
          } else if (!group && !selectedRegion && mapRef.current) {
            const userLocation = getUserLocation().coords;
            const userCenter = new window.naver.maps.LatLng(userLocation[0], userLocation[1]);
            mapRef.current.setCenter(userCenter);
            mapRef.current.setZoom(MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido']);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // ⭐ ResizeObserver를 사용하여 지도 컨테이너 크기 변경 감지
    // 상세 패널이 나타나면서 지도 영역이 좁아질 때 자동으로 재조정
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (!mapRef.current) return;
        if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
        resizeDebounceRef.current = setTimeout(() => {
          resizeDebounceRef.current = null;
          if (!mapRef.current) return;
          if (typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
          // 매치 상세보기 중이면 ref로 확인 (클로저가 마운트 시점 값이라서 ref 사용)
          const hasSelectedGroup = selectedGroupRef.current;
          if (hasSelectedGroup && mapContainerRef.current) {
            // 매치 선택 중엔 setCenter 호출 안 함 → 서해(한국 전역) 뷰로 덮어쓰지 않음
            return;
          }
          if (selectedRegion === '전체') {
            const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845);
            mapRef.current.setCenter(koreaCenter);
            mapRef.current.setZoom(8);
          } else if (!selectedRegion) {
            const userLocation = getUserLocation().coords;
            const userCenter = new window.naver.maps.LatLng(userLocation[0], userLocation[1]);
            mapRef.current.setCenter(userCenter);
            mapRef.current.setZoom(MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido']);
          }
        }, 400);
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      if (resizeObserver && mapContainerRef.current) {
        resizeObserver.unobserve(mapContainerRef.current);
        resizeObserver.disconnect();
      }
      
      // 컴포넌트 언마운트 시 지도 정리
      if (mapRef.current) {
        try {
          markersRef.current.forEach(marker => {
            try {
              marker.setMap(null);
            } catch (e) {
              // 무시
            }
          });
          markersRef.current = [];
          
          // ⭐ 전역 플래그 제거
          if (mapContainerRef.current) {
            mapInstanceCreated.delete(mapContainerRef.current);
          }
          
          mapRef.current = null;
        } catch (e) {
          console.warn('지도 정리 중 오류:', e);
        }
      }
      isInitializingRef.current = false;
      scriptLoadedRef.current = false; // 스크립트 로드 플래그도 리셋
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행 (defaultPosition 변경 시 재초기화하지 않음)

  // ⭐ selectedGroup 변경 시: 상세 패널 열리면 지도 완전 제거 후 남은 공간에 맞춰 재생성 (마커 중앙 정렬)
  useEffect(() => {
    if (selectedGroup) {
      lastSelectedGroupRef.current = selectedGroup;
      const groupLat = selectedGroup.coordinates[0];
      const groupLng = selectedGroup.coordinates[1];
      if (
        typeof groupLat !== 'number' ||
        typeof groupLng !== 'number' ||
        isNaN(groupLat) ||
        isNaN(groupLng) ||
        groupLat < -90 ||
        groupLat > 90 ||
        groupLng < -180 ||
        groupLng > 180
      ) {
        return;
      }

      // 지도 완전 제거 → 상세 패널이 열린 뒤 레이아웃이 잡힌 다음, 남은 절반 공간에 지도 재생성
      destroyMap();
      const reinitTimer = setTimeout(() => {
        if (!scriptLoadedRef.current || !window.naver?.maps || !mapContainerRef.current) return;
        // 레이아웃이 확정된 뒤 크기 읽기 위해 다음 프레임에 초기화
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            initializeMapRef.current?.();
          });
        });
      }, 400);

      return () => clearTimeout(reinitTimer);
    }

    // selectedGroup null: 상세 닫힘 → 지도 완전 제거 후 전체 화면에 맞춰 재생성
    if (!selectedGroup) {
      destroyMap();
      const reinitTimer = setTimeout(() => {
        if (!scriptLoadedRef.current || !window.naver?.maps || !mapContainerRef.current) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            initializeMapRef.current?.();
          });
        });
      }, 400);
      return () => clearTimeout(reinitTimer);
    }
  }, [selectedGroup, selectedRegion]);

  // 지오코더 서브모듈 로드 대기 (naver.maps는 있어도 Service.geocode는 늦게 올 수 있음)
  useEffect(() => {
    if (!naverReady) return;
    const check = () => {
      if (typeof window !== 'undefined' && window.naver?.maps?.Service?.geocode) {
        setGeocoderReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const id = setInterval(() => {
      if (check()) clearInterval(id);
    }, 100);
    const t = setTimeout(() => {
      clearInterval(id);
      check();
    }, 3000);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [naverReady]);

  // ⭐ 매치 주소 → 실제 좌표 지오코딩 (좌측 목록 매치마다 마커 하나씩 표시)
  // 브라우저 JS 지오코더 우선 사용 (CORS 없음), REST API는 보조로 사용
  useEffect(() => {
    setGeocodedCoords({});
    if (!allGroups.length) return;

    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;

    const setCoordIfValid = (groupId: number, lat: number, lng: number, address: string | undefined) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (isSameAsCityCenter(lat, lng, address)) return;
      setGeocodedCoords((prev) => ({ ...prev, [groupId]: [lat, lng] }));
    };

    const geocodeOne = (group: SelectedGroup, query: string, isRetry: boolean) => {
      window.naver.maps.Service.geocode({ query }, (status: number, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK || !response?.v2?.addresses?.length) return;
        const { y, x } = response.v2.addresses[0];
        const lat = parseFloat(y);
        const lng = parseFloat(x);
        if (isSameAsCityCenter(lat, lng, group.location)) {
          if (!isRetry && group.location) {
            const detail = group.location.replace(/\s*\([^)]*\)\s*$/, '').trim();
            if (detail && detail !== query) geocodeOne(group, detail, true);
          }
          return;
        }
        setCoordIfValid(group.id, lat, lng, group.location);
      });
    };

    // 1) JS Service.geocode 우선 (브라우저에서 CORS 없이 동작)
    if (typeof window !== 'undefined' && window.naver?.maps?.Service?.geocode && geocoderReady) {
      allGroups.forEach((group) => {
        const address = group.location?.trim();
        if (!address) return;
        geocodeOne(group, address, false);
      });
      return;
    }

    // 2) REST API 지오코딩 폴백 (JS 지오코더 미준비 시)
    if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
      allGroups.forEach((group) => {
        const address = group.location?.trim();
        if (!address) return;
        const query = address.replace(/\s*\([^)]*\)\s*$/, '').trim() || address;
        fetch(
          `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
          {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
              'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
            },
          }
        )
          .then((res) => res.json())
          .then((data: { addresses?: { y: string; x: string }[] }) => {
            if (data?.addresses?.length) {
              const { y, x } = data.addresses[0];
              setCoordIfValid(group.id, parseFloat(y), parseFloat(x), group.location);
            }
          })
          .catch(() => {});
      });
    }
  }, [allGroups, geocoderReady]);

  /** 내 정보에서 주소 저장 시 지오코딩 재실행 */
  useEffect(() => {
    const handler = () => setLocationUpdateVersion((v) => v + 1);
    window.addEventListener('userLocationUpdated', handler);
    return () => window.removeEventListener('userLocationUpdated', handler);
  }, []);

  // ⭐ 사용자 주소(residenceAddress) 지오코딩 - 내 위치 마커를 정확한 주소에 표시
  // 주소 출처: API residenceAddress > localStorage(내 정보 주소 찾기로 저장한 값)
  useEffect(() => {
    let address = (userResidenceAddress || user?.residenceAddress)?.trim();
    if (!address && user?.id && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(`userLocation_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const addr = parsed?.address && typeof parsed.address === 'string' ? parsed.address.trim() : '';
          if (addr && !addr.startsWith('위도:')) address = addr;
        }
      } catch {
        /* 무시 */
      }
    }
    if (!address) {
      setUserAddressCoords(null);
      return;
    }
    setUserAddressCoords(null);
    const query = address.replace(/\s*\([^)]*\)\s*$/, '').trim() || address;

    const setCoords = (lat: number, lng: number) => {
      if (Number.isFinite(lat) && Number.isFinite(lng)) setUserAddressCoords([lat, lng]);
    };

    // 1) 서버 프록시 API (CORS 없음, 가장 안정적)
    api.get<{ lat: number; lng: number } | null>(`/api/geocode?query=${encodeURIComponent(query)}`)
      .then((res) => {
        if (res && Number.isFinite(res.lat) && Number.isFinite(res.lng)) {
          setCoords(res.lat, res.lng);
          return;
        }
        // 2) Naver JS 지오코더 (서버 실패 시)
        if (geocoderReady && typeof window !== 'undefined' && window.naver?.maps?.Service?.geocode) {
          window.naver.maps.Service.geocode({ query }, (status: number, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK || !response?.v2?.addresses?.length) return;
            const { y, x } = response.v2.addresses[0];
            setCoords(parseFloat(y), parseFloat(x));
          });
        }
      })
      .catch(() => {
        if (geocoderReady && typeof window !== 'undefined' && window.naver?.maps?.Service?.geocode) {
          window.naver.maps.Service.geocode({ query }, (status: number, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK || !response?.v2?.addresses?.length) return;
            const { y, x } = response.v2.addresses[0];
            setCoords(parseFloat(y), parseFloat(x));
          });
        }
      });
  }, [user?.id, user?.residenceAddress, userResidenceAddress, geocoderReady, locationUpdateVersion]);

  // ⭐ 마커 업데이트 전용 (지도 중심 변경 없음)
  useEffect(() => {
    // 지도가 아직 초기화되지 않았으면 스킵
    if (!mapRef.current || !window.naver || !window.naver.maps || !scriptLoadedRef.current) {
      return;
    }
    
    // 지도가 실제로 DOM에 렌더링되었는지 확인
    // ⭐ 지도가 생성되어 있으면 children.length > 0이어야 하지만, 
    // 지도가 아직 생성되지 않았으면 children.length === 0일 수 있으므로
    // mapRef.current가 있는지 확인하는 것이 더 정확함
    if (!mapContainerRef.current || !mapRef.current) {
      return;
    }

    // 지도 크기 조정 (상세 열림 시 selectedGroup effect에서 180ms 후 한 번만 하므로 중복 방지)
    const refreshMapSize = () => {
      if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        try {
          mapRef.current.refreshSize();
        } catch (error) {
          console.error('지도 refreshSize 실패:', error);
        }
      }
    };
    if (!selectedGroup) {
      setTimeout(refreshMapSize, 50);
      setTimeout(refreshMapSize, 200);
    }

    // 기존 마커 및 오버레이 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    // 기존 라벨 제거
    overlaysRef.current.forEach(({ overlay }) => {
      try {
        if (overlay && typeof overlay.close === 'function') overlay.close();
      } catch (e) {
        /* 무시 */
      }
    });
    overlaysRef.current = [];

    // 매치별 표시 좌표: 지오코딩 결과 우선, 없으면 API 좌표 fallback (시청 좌표는 제외)
    const groupsWithCoords: { group: SelectedGroup; coords: [number, number] }[] = [];
    allGroups.forEach((group) => {
      const geocoded = geocodedCoords[group.id];
      if (
        geocoded &&
        Number.isFinite(geocoded[0]) &&
        Number.isFinite(geocoded[1]) &&
        !isSameAsCityCenter(geocoded[0], geocoded[1], group.location)
      ) {
        groupsWithCoords.push({ group, coords: geocoded });
        return;
      }
      // 지오코딩 미완료/실패 시 API 좌표 fallback (시청 좌표면 제외 - 잘못된 마커 방지)
      const apiCoords = group.coordinates;
      if (
        Array.isArray(apiCoords) &&
        apiCoords.length >= 2 &&
        Number.isFinite(apiCoords[0]) &&
        Number.isFinite(apiCoords[1]) &&
        apiCoords[0] >= -90 &&
        apiCoords[0] <= 90 &&
        apiCoords[1] >= -180 &&
        apiCoords[1] <= 180 &&
        !isSameAsCityCenter(apiCoords[0], apiCoords[1], group.location)
      ) {
        groupsWithCoords.push({ group, coords: [apiCoords[0], apiCoords[1]] });
      }
    });

    // 모든 모임 마커 다시 생성 (타입·마감별 색상, 클릭 시 상세보기)
    groupsWithCoords.forEach(({ group, coords }) => {
      const markerPosition = new window.naver.maps.LatLng(coords[0], coords[1]);
      const isSelected = selectedGroup && selectedGroup.id === group.id;
      const markerColor = getMatchMarkerColor(group);

      const marker = new window.naver.maps.Marker({
        position: markerPosition,
        map: mapRef.current,
        zIndex: isSelected ? 1000 : 100,
        icon: {
          content: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2px solid white;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              box-sizing: border-box;
            " title="${group.name}"></div>
          `,
          size: new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12),
        },
      });

      markersRef.current.push(marker);

      // 라벨은 shouldShowLabelsBase(상세/카테고리 선택)일 때만 생성. 열림 여부는 줌 레벨(500m 이상)에 따라 결정
      if (shouldShowLabelsBase && mapRef.current) {
        const labelOverlay = createLabelOverlay(group.name, markerPosition);
        overlaysRef.current.push({ overlay: labelOverlay, lat: coords[0], lng: coords[1] });
        if (shouldShowLabels) {
          labelOverlay.open(mapRef.current, markerPosition);
        }
      }

      window.naver.maps.Event.addListener(marker, 'click', () => {
        // 상세보기 열려 있을 때는 마커 클릭 무시
        if (selectedGroup) return;

        if (mapRef.current && mapContainerRef.current) {
          centerMapOnMarker(mapRef.current, mapContainerRef.current, coords[0], coords[1], 17);
        }
        if (onFacilityMarkerClick) {
          const eps = 0.0001;
          const atSameFacility = groupsWithCoords
            .filter(({ coords: gc }) => Math.abs(gc[0] - coords[0]) < eps && Math.abs(gc[1] - coords[1]) < eps)
            .map(({ group }) => group);
          const sorted = [...atSameFacility].sort((a, b) => {
            const ta = a.parsedMeetingTime?.getTime() ?? Infinity;
            const tb = b.parsedMeetingTime?.getTime() ?? Infinity;
            return ta - tb;
          });
          const facilityName = group.location?.trim() || group.name?.trim() || '해당 시설';
          onFacilityMarkerClick({ facilityName, groups: sorted, coords });
        } else if (onGroupClick) {
          onGroupClick(group);
        }
      });
    });

    // 모임이 없을 때 기본 마커
    if (allGroups.length === 0 && !selectedGroup) {
      // '전체' 선택 시 대한민국 중심 좌표 사용
      let markerPosition: [number, number];
      if (selectedRegion === '전체') {
        markerPosition = [36.3504, 127.3845];
      } else {
        markerPosition = defaultPosition;
      }
      
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(markerPosition[0], markerPosition[1]),
        map: mapRef.current,
      });
      markersRef.current.push(marker);
    }

    // ⭐ 내 위치 마커 (로그인 시) - 지오코딩 우선, 실패/대기 시 거주지 도시 좌표 fallback
    if (user) {
      const loc = userAddressCoords
        ? { coords: userAddressCoords, isDefault: false }
        : getUserLocation();
      if (!loc.isDefault) {
          const userPosition = new window.naver.maps.LatLng(loc.coords[0], loc.coords[1]);
        const profileImg = (user.id && typeof localStorage !== 'undefined' ? localStorage.getItem(`profileImage_${user.id}`) : null) || user.profileImageUrl;
        const markerIconContent = profileImg
          ? `<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);box-sizing:border-box;"><img src="${String(profileImg).replace(/"/g, '&quot;')}" alt="내 위치" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.background='#2563eb';this.remove();" /></div>`
          : `<div style="width:28px;height:28px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);box-sizing:border-box;" title="내 위치"></div>`;
        const markerSize = profileImg ? 32 : 28;
        const markerAnchor = markerSize / 2;

        const userMarker = new window.naver.maps.Marker({
          position: userPosition,
          map: mapRef.current,
          zIndex: 1500,
          title: '내 위치',
          icon: {
            content: markerIconContent,
            size: new window.naver.maps.Size(markerSize, markerSize),
            anchor: new window.naver.maps.Point(markerAnchor, markerAnchor),
          },
        });
        markersRef.current.push(userMarker);
      }
    }
  }, [allGroups, selectedRegion, selectedGroup, selectedCategory, shouldShowLabelsBase, shouldShowLabels, mapReady, geocodedCoords, userResidenceSido, userResidenceAddress, defaultPosition, user, userAddressCoords]);

  // ⭐ 줌 레벨 변경 시 라벨 표시/숨김 (500m 축척 이상에서만 라벨 표시)
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    const map = mapRef.current;
    const show = shouldShowLabelsBase && mapZoomLevel >= ZOOM_LABEL_THRESHOLD;
    overlaysRef.current.forEach(({ overlay, lat, lng }) => {
      try {
        if (show) {
          overlay.open(map, new window.naver.maps.LatLng(lat, lng));
        } else {
          overlay.close();
        }
      } catch (e) {
        /* 무시 */
      }
    });
  }, [mapZoomLevel, shouldShowLabelsBase]);

  // ⭐ 지역 선택 변경 시 지도 중심 이동 (최우선 처리)
  useEffect(() => {
    // 지도가 준비되지 않았으면 스킵
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }
    
    // '전체' 선택 시 대한민국 중심으로 이동 (단, 매치 상세보기 중이면 그대로 두고 selectedGroup 효과에 맡김)
    if (selectedRegion === '전체') {
      if (selectedGroup) return;
      const koreaCenter = new window.naver.maps.LatLng(36.3504, 127.3845); // 대한민국 중심 좌표
      
      // 컨테이너 크기 확정
      const container = mapContainerRef.current;
      if (container) {
        const containerHeight = container.offsetHeight || container.clientHeight || window.innerHeight * 0.8;
        const containerWidth = container.offsetWidth || container.clientWidth || window.innerWidth * 0.6;
        container.style.height = `${containerHeight}px`;
        container.style.width = `${containerWidth}px`;
      }
      
      // refreshSize 후 중심 이동 및 줌 레벨 설정 (메서드 존재 확인)
      if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
      }
      
      // 즉시 설정 (50km 스케일)
      const naverLevel = 8; // 네이버 레벨 8 = 약 50km 스케일
      mapRef.current.setCenter(koreaCenter);
      mapRef.current.setZoom(naverLevel);
      // 지도 레벨을 localStorage에 저장
      try {
        localStorage.setItem('mapLevel', '8'); // 네이버 레벨로 저장
        console.log('📍 전체 선택 - 대한민국 중심으로 이동, 네이버 레벨:', naverLevel, '(50km 스케일)');
      } catch (e) {
        // 무시
      }
      
      // 여러 번 확실하게 설정 (매치 상세보기 중이면 덮어쓰지 않음)
      const applyKoreaView = () => {
        if (!mapRef.current || selectedGroupRef.current) return;
        mapRef.current.setCenter(koreaCenter);
        mapRef.current.setZoom(naverLevel);
        if (typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
      };
      setTimeout(applyKoreaView, 50);
      setTimeout(applyKoreaView, 200);
      setTimeout(applyKoreaView, 500);
      
      return;
    }
    
    // selectedGroup이 있으면 지역 선택 로직 실행 안 함 (충돌 방지)
    if (selectedGroup) {
      return;
    }
    
    // ⭐ 도시 선택 시에는 마지막 선택 모임 정보를 초기화하고 도시 중심으로 이동
    // (도시를 변경했을 때는 항상 도시 중심으로 이동해야 함)
    if (lastSelectedGroupRef.current) {
      lastSelectedGroupRef.current = null; // 도시 선택 시 초기화
    }
    
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    // selectedRegion가 null이면 사용자 위치 사용
    if (!selectedRegion) {
      const userLocation = getUserLocation().coords;
      const userPosition = new window.naver.maps.LatLng(userLocation[0], userLocation[1]);

      const container = mapContainerRef.current;
      if (container) {
        container.style.height = `${container.offsetHeight || container.clientHeight || window.innerHeight * 0.8}px`;
        container.style.width = `${container.offsetWidth || container.clientWidth || window.innerWidth * 0.6}px`;
      }

      if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }

      const userTimer = setTimeout(() => {
        if (selectedGroupRef.current) return;
        if (!mapRef.current) return;
        mapRef.current.setCenter(userPosition);
        mapRef.current.setZoom(MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido']);
        if (typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
        try {
          localStorage.setItem('mapLevel', MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido'].toString());
          console.log('📍 사용자 위치로 이동, 레벨:', MAP_VIEW_ZOOM_LEVELS[mapViewLevelRef.current || 'sido']);
        } catch (e) {
          /* ignore */
        }
      }, 100);
      return () => clearTimeout(userTimer);
    }

    const cityCoordinates = getRegionCoordinates(selectedRegion) ?? getCityCoordinates(selectedRegion as KoreanCity);
    if (!cityCoordinates) {
      return;
    }

    const [lat, lng] = cityCoordinates;
    const cityPosition = new window.naver.maps.LatLng(lat, lng);
    const zoomLevel = getRegionZoomLevel(selectedRegion);

    // 지도 중심을 해당 지역(시/구/동)으로 이동
    if (mapRef.current) {
      const container = mapContainerRef.current;
      if (container) {
        const containerHeight = container.offsetHeight || container.clientHeight || window.innerHeight * 0.8;
        const containerWidth = container.offsetWidth || container.clientWidth || window.innerWidth * 0.6;
        container.style.height = `${containerHeight}px`;
        container.style.width = `${containerWidth}px`;
      }

      if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }

      const cityTimer = setTimeout(() => {
        // 매치 상세보기로 전환된 뒤 예약된 콜백이면 줌/중심 덮어쓰지 않음
        if (selectedGroupRef.current) return;
        if (!mapRef.current || !selectedRegion) return;
        mapRef.current.setCenter(cityPosition);
        mapRef.current.setZoom(zoomLevel);
        if (typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
        try {
          localStorage.setItem('mapLevel', zoomLevel.toString());
          console.log('📍 도시 선택 - 지도 중심 이동:', selectedRegion, cityPosition, '네이버 레벨:', zoomLevel);
        } catch (e) {
          /* ignore */
        }
      }, 100);

      return () => clearTimeout(cityTimer);
    }
  }, [selectedRegion, selectedGroup]);

  // ⭐ 운동 카테고리 버튼 클릭 시(전체 포함) 지정된 도시 중심으로 지도 이동
  // 카테고리 변경 시 상세보기가 열려있어도 도시 중심으로 이동 (상세보기는 App.tsx에서 닫힘)
  useEffect(() => {
    // selectedGroup이 있으면 카테고리 변경 로직 실행 안 함 (충돌 방지)
    if (selectedGroup) {
      prevCategoryRef.current = selectedCategory;
      return;
    }
    
    // 카테고리 변경이 아니면 스킵 (초기 마운트 제외)
    const categoryChanged = prevCategoryRef.current !== selectedCategory;
    if (!categoryChanged && prevCategoryRef.current !== null) {
      return;
    }

    // selectedRegion가 없거나 '전체'이면 스킵
    if (!selectedRegion || selectedRegion === '전체') {
      prevCategoryRef.current = selectedCategory;
      return;
    }

    // 지도가 준비되지 않았으면 스킵
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      prevCategoryRef.current = selectedCategory;
      return;
    }

    const cityCoordinates = getRegionCoordinates(selectedRegion) ?? getCityCoordinates(selectedRegion as KoreanCity);
    if (!cityCoordinates) {
      console.warn('⚠️ 지역 좌표를 찾을 수 없습니다:', selectedRegion);
      prevCategoryRef.current = selectedCategory;
      return;
    }

    const [lat, lng] = cityCoordinates;
    const cityPosition = new window.naver.maps.LatLng(lat, lng);
    const zoomLevel = getRegionZoomLevel(selectedRegion);

    // 지도 중심을 해당 지역(시/구/동)으로 이동
    if (mapRef.current) {
      const container = mapContainerRef.current;
      if (container) {
        const containerHeight = container.offsetHeight || container.clientHeight || window.innerHeight * 0.8;
        const containerWidth = container.offsetWidth || container.clientWidth || window.innerWidth * 0.6;
        container.style.height = `${containerHeight}px`;
        container.style.width = `${containerWidth}px`;
      }

      if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
      
      // 한 번에 이동 (중복 제거)
      setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setCenter(cityPosition);
        mapRef.current.setZoom(zoomLevel);
        if (mapRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
        // 지도 레벨을 localStorage에 저장
        try {
          localStorage.setItem('mapLevel', zoomLevel.toString());
          console.log('📍 카테고리 변경 - 지도 레벨 저장 (네이버 레벨):', zoomLevel);
        } catch (e) {
          // 무시
        }
        }
      }, 100);
    }

    // 이전 카테고리 업데이트
    prevCategoryRef.current = selectedCategory;
  }, [selectedCategory, selectedRegion]); // selectedGroup 의존성 제거 (충돌 방지)

  // ⭐ mapViewLevel 변경 시 도시/사용자 뷰일 때 지도 줌 갱신
  useEffect(() => {
    if (selectedGroup || !mapRef.current || !window.naver?.maps) return;
    if (selectedRegion === '전체') return; // '전체'는 50km 고정
    const zoomLevel = MAP_VIEW_ZOOM_LEVELS[mapViewLevel];
    mapRef.current.setZoom(zoomLevel);
    try {
      localStorage.setItem('mapLevel', zoomLevel.toString());
    } catch (e) {
      /* ignore */
    }
  }, [mapViewLevel]);
  
  // ⭐ 상세 패널 애니메이션 완료 후 한 번만 재조정 (최적화)
  useEffect(() => {
    if (!selectedGroup || !mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }
    
    // 상세 패널 애니메이션 완료 후 한 번만 refreshSize (지역 '전체'여도 실행)
    const adjustTimer = setTimeout(() => {
      if (mapRef.current && mapContainerRef.current && typeof mapRef.current.refreshSize === 'function') {
        mapRef.current.refreshSize();
      }
    }, 400); // 상세 패널 애니메이션 완료 후 한 번만 실행
    
    return () => clearTimeout(adjustTimer);
  }, [selectedGroup, selectedRegion]);

  /** 현재 위치(또는 선택 도시)로 지도 중심 이동 */
  const handleCenterToCurrent = () => {
    if (!mapRef.current || !window.naver?.maps) return;
    const [lat, lng] = defaultPosition;
    const pos = new window.naver.maps.LatLng(lat, lng);
    mapRef.current.setCenter(pos);
    mapRef.current.setZoom(14);
    if (typeof mapRef.current.refreshSize === 'function') mapRef.current.refreshSize();
  };

  return (
    <div 
      className="map-container rounded-r-xl overflow-hidden"
      style={{ 
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '400px',
        borderRadius: 'var(--map-radius, 0.75rem)'
      }}
    >
      {/* 지도 컨테이너 - 네이버 지도 API 요구사항에 맞는 DOM 구조 */}
      <div
        id="map"
        ref={mapContainerRef}
        className="rounded-r-xl"
        style={{ 
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      />

      {/* 매치 종류별 생성 버튼 — 둥근 모서리, 매치 타입 테마 색상 */}
      {onCreateGroupClick && (
        <button
          onClick={onCreateGroupClick}
          className="absolute bottom-6 right-6 z-[1000] text-white px-4 py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          style={{ backgroundColor: MATCH_TYPE_THEME[matchType]?.accentHex ?? MATCH_TYPE_THEME.general.accentHex }}
          aria-label={CREATE_BUTTON_LABEL[matchType]}
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
            {CREATE_BUTTON_LABEL[matchType]}
          </span>
        </button>
      )}
    </div>
  );
};

export default NaverMapPanel;

