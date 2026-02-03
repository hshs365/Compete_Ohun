// 한국의 주요 도시 목록
export const KOREAN_CITIES = [
  '전체',
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const;

export type KoreanCity = typeof KOREAN_CITIES[number];

/** 지역 표시명: '전체'만 '전국'으로, 나머지는 전체 지역명 그대로 표시 (예: 전라남도, 충청북도) */
export const getRegionDisplayName = (city: string): string => {
  if (city === '전체') return '전국';
  return city;
};

// 도시별 시청 좌표 (위도, 경도)
export const CITY_COORDINATES: Record<KoreanCity, [number, number] | null> = {
  '전체': null,
  '서울특별시': [37.5665, 126.9780], // 서울 시청
  '부산광역시': [35.1796, 129.0756], // 부산 시청
  '대구광역시': [35.8714, 128.6014], // 대구 시청
  '인천광역시': [37.4563, 126.7052], // 인천 시청
  '광주광역시': [35.1595, 126.8526], // 광주 시청
  '대전광역시': [36.3504, 127.3845], // 대전 시청
  '울산광역시': [35.5384, 129.3114], // 울산 시청
  '세종특별자치시': [36.4805, 127.2892], // 세종시청
  '경기도': [37.2752, 127.0095], // 수원시청 (경기도청)
  '강원도': [37.8854, 127.7298], // 춘천시청 (강원도청)
  '충청북도': [36.6285, 127.9293], // 청주시청 (충청북도청)
  '충청남도': [36.5184, 126.8009], // 홍성군청 (충청남도청)
  '전라북도': [35.8200, 127.1087], // 전주시청 (전라북도청)
  '전라남도': [34.8194, 126.4610], // 무안군청 (전라남도청)
  '경상북도': [36.5760, 128.5050], // 안동시청 (경상북도청)
  '경상남도': [35.2383, 128.6922], // 창원시청 (경상남도청)
  '제주특별자치도': [33.4996, 126.5312], // 제주시청
};

/**
 * 도시명으로 시청 좌표를 가져옵니다.
 * @param city 도시명
 * @returns [위도, 경도] 또는 null
 */
export const getCityCoordinates = (city: KoreanCity): [number, number] | null => {
  return CITY_COORDINATES[city] || null;
};

/**
 * 주소 문자열에서 도시를 추출합니다.
 * @param address 주소 문자열 (예: "대전 서구 대덕대로112번길 10")
 * @returns 도시명 또는 null
 */
export const extractCityFromAddress = (address: string): KoreanCity | null => {
  if (!address) return null;
  
  // 각 도시명으로 시작하는지 확인
  for (const city of KOREAN_CITIES) {
    if (city === '전체') continue;
    
    // 도시명이 주소에 포함되어 있는지 확인
    // 예: "대전" -> "대전광역시" 또는 "대전 서구" 등
    if (address.includes(city) || address.startsWith(city.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').replace('도', ''))) {
      return city;
    }
  }
  
  // 도시명이 명시적으로 없으면 주소의 첫 번째 단어로 추정
  // 예: "대전 서구..." -> "대전광역시"
  const firstWord = address.split(' ')[0];
  for (const city of KOREAN_CITIES) {
    if (city === '전체') continue;
    const cityName = city.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').replace('도', '');
    if (firstWord === cityName) {
      return city;
    }
  }
  
  return null;
};


/**
 * 사용자의 현재 위치에서 도시를 가져옵니다.
 * @returns 도시명 또는 null
 */
export const getUserCity = (): KoreanCity | null => {
  try {
    // localStorage에서 저장된 위치 정보 가져오기
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      
      // 주소가 있으면 주소에서 도시 추출
      if (location.address) {
        const city = extractCityFromAddress(location.address);
        if (city) return city;
      }
      
    }
  } catch (e) {
    console.error('사용자 위치 정보 파싱 실패:', e);
  }
  
  return null;
};

