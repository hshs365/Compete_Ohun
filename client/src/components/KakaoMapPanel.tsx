import React, { useEffect, useRef, useState } from 'react';
import type { SelectedGroup } from './MapPanel';

interface KakaoMapPanelProps {
  selectedGroup?: SelectedGroup | null;
  allGroups?: SelectedGroup[];
  onCreateGroupClick?: () => void;
  onGroupClick?: (group: SelectedGroup) => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMapPanel: React.FC<KakaoMapPanelProps> = ({
  selectedGroup = null,
  allGroups = [],
  onCreateGroupClick,
  onGroupClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const scriptLoadedRef = useRef(false);
  const isInitializingRef = useRef(false); // 초기화 중 플래그
  const [isLoading, setIsLoading] = useState(true);
  const [defaultPosition, setDefaultPosition] = useState<[number, number]>([37.5665, 126.9780]);
  
  // 사용자 위치 가져오기 (localStorage 또는 기본값)
  const getUserLocation = (): [number, number] => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location.latitude && location.longitude) {
          console.log('✅ 사용자 위치 정보 로드됨:', location);
          return [location.latitude, location.longitude];
        }
      }
    } catch (e) {
      console.warn('사용자 위치 정보 파싱 실패:', e);
    }
    console.log('📍 기본 위치 사용 (서울 시청):', [37.5665, 126.9780]);
    return [37.5665, 126.9780]; // 서울 시청 (기본값)
  };
  
  // 위치 정보 초기 로드 및 localStorage 변경 감지
  useEffect(() => {
    const updateLocation = () => {
      const newPosition = getUserLocation();
      setDefaultPosition(prev => {
        // 위치가 실제로 변경되었을 때만 업데이트
        if (prev[0] !== newPosition[0] || prev[1] !== newPosition[1]) {
          console.log('🔄 위치 정보 변경 감지:', prev, '->', newPosition);
          return newPosition;
        }
        return prev;
      });
    };
    
    // 초기 위치 로드 (약간의 지연을 두어 컴포넌트 마운트 완료 후 실행)
    setTimeout(() => {
      updateLocation();
    }, 100);
    
    // localStorage 변경 감지 (storage 이벤트는 다른 탭에서만 발생하므로 직접 체크)
    // 초기화가 완료된 후에만 체크 시작 (3초 후)
    const checkInterval = setInterval(() => {
      // 지도가 초기화되지 않았으면 스킵
      if (!scriptLoadedRef.current) {
        return;
      }
      
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          if (location.latitude && location.longitude) {
            setDefaultPosition(prev => {
              if (prev[0] !== location.latitude || prev[1] !== location.longitude) {
                console.log('🔄 위치 정보 변경 감지 (주기적 체크), 지도 업데이트');
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
      if (e.key === 'userLocation' && e.newValue) {
        try {
          const location = JSON.parse(e.newValue);
          if (location.latitude && location.longitude) {
            console.log('🔄 localStorage 변경 감지 (다른 탭), 지도 업데이트');
            setDefaultPosition([location.latitude, location.longitude]);
          }
        } catch (e) {
          // 무시
        }
      }
    };
    
    // 커스텀 이벤트 리스너 (같은 탭에서 변경 시)
    const handleUserLocationUpdated = (e: CustomEvent) => {
      const { latitude, longitude } = e.detail;
      if (latitude && longitude) {
        console.log('🔄 위치 정보 업데이트 이벤트 수신, 지도 업데이트');
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
  }, []); // 한 번만 실행

  // 카카오맵 스크립트 로드
  useEffect(() => {
    // 초기화 플래그 리셋
    isInitializingRef.current = false;
    setIsLoading(true); // 로딩 상태 초기화
    
    const loadKakaoMapScript = () => {
      const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
      
      if (!KAKAO_JAVASCRIPT_KEY) {
        console.error('카카오맵 JavaScript 키가 설정되지 않았습니다. VITE_KAKAO_JAVASCRIPT_KEY를 .env 파일에 추가해주세요.');
        setIsLoading(false);
        return;
      }

      // 이미 로드되어 있으면 스킵
      if (window.kakao && window.kakao.maps) {
        scriptLoadedRef.current = true;
        // 컨테이너가 준비될 때까지 충분히 대기 (재로그인 시 DOM이 준비되는 시간 필요)
        // 위치 정보도 로드될 시간을 주기 위해 약간 더 대기
        setTimeout(() => {
          if (mapContainerRef.current && !isInitializingRef.current) {
            // 위치 정보를 다시 읽어서 최신 값 사용
            const currentPosition = getUserLocation();
            console.log('지도 초기화 시작 (스크립트 이미 로드됨), 위치:', currentPosition);
            initializeMap();
          }
        }, 500);
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
            // 컨테이너가 준비될 때까지 충분히 대기
            setTimeout(() => {
              if (mapContainerRef.current && !isInitializingRef.current) {
                initializeMap();
              }
            }, 300);
          }
        }, 100);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!scriptLoadedRef.current) {
            console.error('카카오맵 스크립트 로드 타임아웃');
            setIsLoading(false);
          }
        }, 10000);
        return;
      }

      // 스크립트 동적 로드
      const script = document.createElement('script');
      const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}&libraries=services&autoload=false`;
      script.src = scriptUrl;
      script.async = true;
      
      console.log('카카오맵 스크립트 로드 시도:', scriptUrl.substring(0, 50) + '...');
      
      script.onload = () => {
        console.log('카카오맵 스크립트 로드 완료');
        // 스크립트가 로드된 후 kakao 객체가 준비될 때까지 대기
        const checkKakao = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakao);
            console.log('카카오맵 객체 확인됨, 초기화 시작');
            window.kakao.maps.load(() => {
              scriptLoadedRef.current = true;
              // 컨테이너가 준비될 때까지 충분히 대기
              setTimeout(() => {
                if (mapContainerRef.current && !isInitializingRef.current) {
                  initializeMap();
                }
              }, 300);
            });
          }
        }, 50);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkKakao);
          if (!scriptLoadedRef.current) {
            console.error('카카오맵 초기화 타임아웃 - kakao 객체를 찾을 수 없습니다');
            console.error('Network 탭에서 스크립트 요청 상태를 확인해주세요');
            setIsLoading(false);
          }
        }, 10000);
      };
      script.onerror = (error) => {
        console.error('❌ 카카오맵 스크립트 로드 실패');
        console.error('에러 상세:', error);
        console.error('요청 URL:', scriptUrl);
        console.error('JavaScript 키:', KAKAO_JAVASCRIPT_KEY ? `${KAKAO_JAVASCRIPT_KEY.substring(0, 10)}...` : '없음');
        console.error('');
        console.error('🔍 확인 사항:');
        console.error('1. 카카오 개발자 콘솔에서 JavaScript 키가 올바른지 확인');
        console.error('2. 플랫폼 설정에 http://localhost:5173이 등록되어 있는지 확인');
        console.error('3. Network 탭에서 dapi.kakao.com 요청의 상태 코드 확인');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      // 중복 초기화 방지
      if (isInitializingRef.current) {
        console.log('지도 초기화가 이미 진행 중입니다. 스킵합니다.');
        return;
      }
      
      // 컨테이너가 준비될 때까지 대기
      if (!mapContainerRef.current) {
        console.warn('지도 컨테이너가 아직 준비되지 않았습니다. 재시도합니다...');
        setTimeout(() => {
          if (mapContainerRef.current && !isInitializingRef.current) {
            initializeMap();
          } else if (!mapContainerRef.current) {
            console.error('지도 컨테이너를 찾을 수 없습니다.');
            setIsLoading(false);
            isInitializingRef.current = false;
          }
        }, 200);
        return;
      }
      
      if (!window.kakao || !window.kakao.maps) {
        console.warn('지도 초기화 조건 불만족:', {
          hasContainer: !!mapContainerRef.current,
          hasKakao: !!window.kakao,
          hasMaps: !!(window.kakao && window.kakao.maps)
        });
        setIsLoading(false);
        isInitializingRef.current = false;
        return;
      }
      
      // 초기화 시작
      isInitializingRef.current = true;
      
      // 현재 위치 정보를 다시 읽어서 최신 값 사용 (defaultPosition state가 아직 업데이트되지 않았을 수 있음)
      const currentPosition = getUserLocation();
      console.log('지도 초기화 시작, 사용 위치:', currentPosition);

      const container = mapContainerRef.current;
      
      // 지도 컨테이너 크기 확인 (여러 방법으로 시도)
      const rect = container.getBoundingClientRect();
      const containerWidth = container.offsetWidth || container.clientWidth || rect.width || window.innerWidth;
      const containerHeight = container.offsetHeight || container.clientHeight || rect.height || window.innerHeight * 0.6;
      
      console.log('지도 컨테이너 크기 확인:', {
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
        rectWidth: rect.width,
        rectHeight: rect.height,
        finalWidth: containerWidth,
        finalHeight: containerHeight
      });
      
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
              console.log('컨테이너 크기 확인됨, 지도 초기화 재시도');
              initializeMap();
            } else {
              console.error('지도 컨테이너 크기를 가져올 수 없습니다.');
              setIsLoading(false);
              isInitializingRef.current = false;
            }
          }
        }, 500);
        return;
      }

      // 위치 정보 확인 및 설정 (initializeMap 내부에서 읽은 최신 값 사용)
      const mapCenter = selectedGroup 
        ? new window.kakao.maps.LatLng(selectedGroup.coordinates[0], selectedGroup.coordinates[1])
        : new window.kakao.maps.LatLng(currentPosition[0], currentPosition[1]);
      
      // 사용자 위치가 있으면 확대 (레벨 3), 없으면 기본 확대 (레벨 13)
      // selectedGroup이 있으면 더 확대 (레벨 15)
      const mapZoom = selectedGroup ? 15 : (currentPosition[0] !== 37.5665 || currentPosition[1] !== 126.9780) ? 3 : 13;

      // 지도 생성
      const options = {
        center: mapCenter,
        level: mapZoom,
      };

      // 기존 지도가 있으면 완전히 제거
      if (mapRef.current) {
        try {
          console.log('기존 지도 인스턴스 제거 중...');
          // 기존 마커 제거
          markersRef.current.forEach(marker => {
            try {
              marker.setMap(null);
            } catch (e) {
              // 무시
            }
          });
          markersRef.current = [];
          
          // 지도 컨테이너 초기화
          const container = mapContainerRef.current;
          if (container) {
            // 컨테이너 내부의 모든 자식 요소 제거
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
          }
          
          mapRef.current = null;
          console.log('기존 지도 인스턴스 제거 완료');
        } catch (e) {
          console.warn('기존 지도 제거 중 오류:', e);
        }
      }

      let map: any;
      try {
        map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;
        
        console.log('✅ 지도 생성 완료');
        console.log('   컨테이너 크기:', containerWidth, 'x', containerHeight);
        console.log('   지도 중심:', mapCenter.getLat(), mapCenter.getLng());
        console.log('   지도 레벨:', mapZoom);
        console.log('   컨테이너 스타일:', {
          display: window.getComputedStyle(container).display,
          position: window.getComputedStyle(container).position,
          width: window.getComputedStyle(container).width,
          height: window.getComputedStyle(container).height,
          visibility: window.getComputedStyle(container).visibility,
          opacity: window.getComputedStyle(container).opacity
        });
        
        // 지도가 생성된 직후 여러 번 relayout 호출 (크기 조정)
        const relayoutMap = () => {
          if (mapRef.current) {
            try {
              mapRef.current.relayout();
              console.log('✅ 지도 relayout 완료');
            } catch (error) {
              console.error('❌ 지도 relayout 실패:', error);
            }
          }
        };
        
        // 즉시 relayout
        setTimeout(relayoutMap, 50);
        // 추가 relayout (컨테이너 크기가 안정화된 후)
        setTimeout(relayoutMap, 200);
        setTimeout(relayoutMap, 500);
      } catch (error) {
        console.error('❌ 지도 생성 실패:', error);
        setIsLoading(false);
        isInitializingRef.current = false; // 초기화 실패 시 플래그 해제
        return;
      }

      if (!map || !mapRef.current) {
        console.error('❌ 지도 객체가 생성되지 않았습니다.');
        setIsLoading(false);
        return;
      }

      // 기존 마커 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // 모든 모임 마커 생성
      allGroups.forEach((group) => {
        const markerPosition = new window.kakao.maps.LatLng(
          group.coordinates[0],
          group.coordinates[1]
        );
        
        const isSelected = selectedGroup && selectedGroup.id === group.id;
        
        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });

        // 선택된 마커는 더 크게 표시
        if (isSelected) {
          marker.setZIndex(window.kakao.maps.ZIndex.MARKER + 1);
        }

        marker.setMap(mapRef.current);
        markersRef.current.push(marker);

        // 인포윈도우 생성
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 150px;">
              <strong>${group.name}</strong><br/>
              ${group.location}<br/>
              <span style="font-size: 12px; color: #666;">${group.category || ''}</span>
              ${group.memberCount ? `<br/><span style="font-size: 12px; color: #666;">참가자: ${group.memberCount}명</span>` : ''}
            </div>
          `,
        });

        // 마커 클릭 시 인포윈도우 표시 및 지도 이동
        window.kakao.maps.event.addListener(marker, 'click', () => {
          // 지도 중심을 해당 모임 위치로 이동
          if (mapRef.current) {
            mapRef.current.setCenter(markerPosition);
            mapRef.current.setLevel(15); // 확대 레벨 설정
            console.log('📍 지도 중심 이동:', group.name, markerPosition);
          }
          
          // 부모 컴포넌트에 모임 선택 알림
          if (onGroupClick) {
            onGroupClick(group);
          }
          
          // 인포윈도우 표시
          infowindow.open(mapRef.current, marker);
        });
      });

      // 모임이 없을 때 기본 마커
      if (allGroups.length === 0 && !selectedGroup) {
        const markerPosition = new window.kakao.maps.LatLng(
          currentPosition[0],
          currentPosition[1]
        );
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });
        marker.setMap(mapRef.current);
        markersRef.current.push(marker);

        const infowindow = new window.kakao.maps.InfoWindow({
          content: '<div style="padding: 10px;">서울 시청<br/>현재 위치</div>',
        });
        infowindow.open(mapRef.current, marker);
      }

      // 지도 초기화 완료 후 로딩 상태 해제
      // 지도가 완전히 렌더링될 때까지 충분한 지연
      setTimeout(() => {
        // 지도 크기 최종 조정
        if (mapRef.current) {
          try {
            mapRef.current.relayout();
            // 지도 중심 재설정 (렌더링 문제 해결)
            mapRef.current.setCenter(mapCenter);
            console.log('✅ 지도 최종 relayout 및 중심 재설정 완료');
          } catch (error) {
            console.error('❌ 지도 relayout 실패:', error);
          }
        }
        isInitializingRef.current = false; // 초기화 완료
        setIsLoading(false); // 로딩 완료
        console.log('✅ 지도 초기화 완료');
      }, 800);
      
      // 타임아웃 설정 (10초 후에도 초기화가 완료되지 않으면 로딩 해제)
      setTimeout(() => {
        if (isLoading) {
          console.warn('⚠️ 지도 초기화 타임아웃 - 로딩 상태 해제');
          setIsLoading(false);
          isInitializingRef.current = false;
        }
      }, 10000);
    };

    loadKakaoMapScript();

    // 윈도우 리사이즈 시 지도 크기 조정
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.relayout();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
          mapRef.current = null;
        } catch (e) {
          console.warn('지도 정리 중 오류:', e);
        }
      }
      isInitializingRef.current = false;
      scriptLoadedRef.current = false; // 스크립트 로드 플래그도 리셋
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행 (defaultPosition 변경 시 재초기화하지 않음)

  // 선택된 그룹이나 그룹 목록 변경 시 지도 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps || !scriptLoadedRef.current) {
      console.log('지도 업데이트 스킵:', {
        hasMap: !!mapRef.current,
        hasKakao: !!window.kakao,
        hasMaps: !!(window.kakao && window.kakao.maps),
        scriptLoaded: scriptLoadedRef.current
      });
      return;
    }

    const mapCenter = selectedGroup 
      ? new window.kakao.maps.LatLng(selectedGroup.coordinates[0], selectedGroup.coordinates[1])
      : new window.kakao.maps.LatLng(defaultPosition[0], defaultPosition[1]);
    
    const mapZoom = selectedGroup ? 15 : (defaultPosition[0] !== 37.5665 || defaultPosition[1] !== 126.9780) ? 3 : 13;

    console.log('지도 업데이트:', {
      selectedGroup: selectedGroup?.name || '없음',
      center: [mapCenter.getLat(), mapCenter.getLng()],
      zoom: mapZoom
    });

    // 지도 중심 이동
    try {
      mapRef.current.setCenter(mapCenter);
      mapRef.current.setLevel(mapZoom);
    } catch (error) {
      console.error('지도 중심 이동 실패:', error);
    }

    // 지도 크기 조정 (컨테이너 크기가 변경되었을 때 필요)
    const relayoutMap = () => {
      if (mapRef.current) {
        try {
          mapRef.current.relayout();
        } catch (error) {
          console.error('지도 relayout 실패:', error);
        }
      }
    };
    
    setTimeout(relayoutMap, 50);
    setTimeout(relayoutMap, 200);

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 모든 모임 마커 다시 생성
    allGroups.forEach((group) => {
      const markerPosition = new window.kakao.maps.LatLng(
        group.coordinates[0],
        group.coordinates[1]
      );
      
      const isSelected = selectedGroup && selectedGroup.id === group.id;
      
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      });

      if (isSelected) {
        marker.setZIndex(window.kakao.maps.ZIndex.MARKER + 1);
      }

      marker.setMap(mapRef.current);
      markersRef.current.push(marker);

      // 인포윈도우
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 150px;">
            <strong>${group.name}</strong><br/>
            ${group.location}<br/>
            <span style="font-size: 12px; color: #666;">${group.category || ''}</span>
            ${group.memberCount ? `<br/><span style="font-size: 12px; color: #666;">참가자: ${group.memberCount}명</span>` : ''}
          </div>
        `,
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 지도 중심을 해당 모임 위치로 이동
        if (mapRef.current) {
          mapRef.current.setCenter(markerPosition);
          mapRef.current.setLevel(15); // 확대 레벨 설정
          console.log('📍 지도 중심 이동:', group.name, markerPosition);
        }
        
        // 부모 컴포넌트에 모임 선택 알림
        if (onGroupClick) {
          onGroupClick(group);
        }
        
        // 인포윈도우 표시
        infowindow.open(mapRef.current, marker);
      });
    });

    // 모임이 없을 때 기본 마커
    if (allGroups.length === 0 && !selectedGroup) {
      const markerPosition = new window.kakao.maps.LatLng(
        defaultPosition[0],
        defaultPosition[1]
      );
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      });
      marker.setMap(mapRef.current);
      markersRef.current.push(marker);
    }
  }, [selectedGroup, allGroups]);

  return (
    <div 
      className="h-full w-full relative" 
      style={{ 
        height: '100%', 
        width: '100%', 
        minHeight: '400px', 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 0
      }}
    >
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)] z-10">
          <p className="text-[var(--color-text-secondary)]">지도를 불러오는 중...</p>
        </div>
      )}
      
      <div
        ref={mapContainerRef}
        style={{ 
          height: '100%', 
          width: '100%', 
          minHeight: '400px', 
          position: 'relative',
          flex: '1 1 0%',
          display: 'block',
          zIndex: 0
        }}
        className="kakao-map-panel"
      />
      
      {/* 새 모임 만들기 플로팅 버튼 - 항상 표시 */}
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

export default KakaoMapPanel;

