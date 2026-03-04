import { GU_COORDINATES, REGION_DONG, DONG_COORDINATES } from '../data/regionData';

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


export type ResidenceInput = { residenceAddress?: string | null; residenceSido?: string | null };

/**
 * 사용자의 현재 위치/거주지에서 도시를 가져옵니다.
 * userId와 apiResidence가 주어지면 회원 거주지 기준, 없으면 localStorage 기준.
 * @returns 도시명 또는 null
 */
export function getUserCity(): KoreanCity | null;
export function getUserCity(userId: number, apiResidence?: ResidenceInput): KoreanCity | null;
export function getUserCity(userId?: number, apiResidence?: ResidenceInput): KoreanCity | null {
  if (userId !== undefined && (apiResidence?.residenceAddress || apiResidence?.residenceSido)) {
    return getUserCityForJoin(userId, apiResidence);
  }
  if (userId !== undefined) {
    return getUserCityForJoin(userId, undefined);
  }
  try {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      if (location?.address) {
        const city = extractCityFromAddress(location.address);
        if (city) return city;
      }
    }
  } catch (e) {
    console.error('사용자 위치 정보 파싱 실패:', e);
  }
  return null;
}

/** 타 지역 매치 참가 확인용: 사용자 지역(시/도) — localStorage 또는 회원 거주지 */
export function getUserCityForJoin(
  userId?: number,
  apiResidence?: { residenceAddress?: string | null; residenceSido?: string | null }
): KoreanCity | null {
  try {
    const locationKey = userId ? `userLocation_${userId}` : 'userLocation';
    const saved = localStorage.getItem(locationKey);
    if (saved) {
      const loc = JSON.parse(saved);
      if (loc?.address && typeof loc.address === 'string') {
        const city = extractCityFromAddress(loc.address);
        if (city) return city;
      }
    }
  } catch (_) {}
  if (apiResidence?.residenceAddress && apiResidence.residenceAddress.trim()) {
    const city = extractCityFromAddress(apiResidence.residenceAddress.trim());
    if (city) return city;
  }
  if (apiResidence?.residenceSido && apiResidence.residenceSido.trim()) {
    const s = apiResidence.residenceSido.trim();
    for (const city of KOREAN_CITIES) {
      if (city === '전체') continue;
      const short = city.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').replace('도', '');
      if (s === city || s === short) return city;
    }
  }
  return null;
}

/**
 * 두 좌표 간 거리(km)를 Haversine 공식으로 계산합니다.
 */
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 지구 반경(km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** 선택 지역 문자열을 시/구/동 계층으로 파싱 (예: "서울특별시 강남구" → { sido: "서울특별시", gu: "강남구" }) */
export function parseRegionToHierarchy(selectedRegion: string): { sido?: string; gu?: string; dong?: string } {
  if (!selectedRegion || selectedRegion === '전체') return {};
  const parts = selectedRegion.trim().split(/\s+/);
  return {
    sido: parts[0] || undefined,
    gu: parts[1] || undefined,
    dong: parts[2] || undefined,
  };
}

/**
 * 매치 주소(location)가 선택 지역(시/도·구·동)에 해당하는지 여부.
 * 주소가 "대전 대덕구 ..."처럼 짧게 저장돼도 "대전광역시 대덕구" 선택 시 매칭되도록 계층적으로 비교.
 */
export function addressMatchesRegion(location: string | null | undefined, selectedRegion: string): boolean {
  const loc = (location || '').trim();
  if (!loc || !selectedRegion || selectedRegion === '전체') return false;
  const hierarchy = parseRegionToHierarchy(selectedRegion);
  const groupCity = extractCityFromAddress(loc);
  if (!groupCity) return false;
  if (!hierarchy.sido) return false;
  const sidoMatch = groupCity === hierarchy.sido;
  if (!sidoMatch) return false;
  if (!hierarchy.gu) return true;
  const guInAddress = loc.includes(hierarchy.gu);
  if (!guInAddress) return false;
  if (!hierarchy.dong) return true;
  return loc.includes(hierarchy.dong);
}

/** 시/도·구의 하위 지역 목록 (드롭다운용). fullName = "시/도 구" 또는 "시/도 구 동", displayName = 구/동 이름만 */
export type RegionChild = { fullName: string; displayName: string };
const REGION_GU: Record<string, string[]> = {
  '서울특별시': ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'],
  '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
  '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
  '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
  '세종특별자치시': [],
  '경기도': ['수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '김포시', '광명시', '광주시', '군포시', '하남시', '오산시', '이천시', '안성시', '의왕시', '양평군', '여주시', '과천시', '양주시', '포천시', '동두천시', '가평군', '연천군'],
  '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '제주특별자치도': ['제주시', '서귀포시'],
};

export function getRegionChildren(regionName: string): RegionChild[] {
  if (!regionName || regionName === '전체') return [];
  const trimmed = regionName.trim();
  const hasSpace = trimmed.includes(' ');
  if (hasSpace) {
    const dongNames = REGION_DONG[trimmed];
    if (!dongNames || dongNames.length === 0) return [];
    return dongNames.map((dong) => ({
      fullName: `${trimmed} ${dong}`,
      displayName: dong,
    }));
  }
  const guNames = REGION_GU[trimmed];
  if (!guNames || guNames.length === 0) return [];
  return guNames.map((gu) => ({
    fullName: `${trimmed} ${gu}`,
    displayName: gu,
  }));
}

/** 지역명(시/도·구·동)에 해당하는 대표 좌표. 동 선택 시 동 좌표, 없으면 구·시청 사용 (전국 데이터: data/regionData.ts) */
export function getRegionCoordinates(regionName: string): [number, number] | null {
  if (!regionName || regionName === '전체') return null;
  const parts = regionName.trim().split(/\s+/);
  const city = (parts[0] || regionName) as string;
  if (parts.length >= 3) {
    const threePartKey = `${parts[0]} ${parts[1]} ${parts[2]}`;
    if (DONG_COORDINATES[threePartKey]) return DONG_COORDINATES[threePartKey];
    if (GU_COORDINATES[threePartKey]) return GU_COORDINATES[threePartKey]; // 시/도 시 구 형식
  }
  if (parts.length >= 2) {
    const guKey = `${parts[0]} ${parts[1]}`;
    if (GU_COORDINATES[guKey]) return GU_COORDINATES[guKey];
  }
  return getCityCoordinates(city as KoreanCity) ?? null;
}

/** 지도 줌 레벨: 시/도 ≈3km, 구 ≈1km, 동 ≈500m (숫자 클수록 확대) */
export function getRegionZoomLevel(regionName: string): number | null {
  if (!regionName || regionName === '전체') return null;
  const parts = regionName.trim().split(/\s+/).length;
  if (parts >= 3) return 15;   // 동 ≈ 500m 축척
  if (parts >= 2) return 14;   // 구 ≈ 1km 축척
  return 12;                   // 시/도 ≈ 3km 축척
}

/** 거주지 정보에서 도시 추출 (NaverMapPanel 등용) */
export function getCityFromResidence(residence?: ResidenceInput | null): KoreanCity | null {
  if (!residence) return null;
  if (residence.residenceAddress?.trim()) {
    const c = extractCityFromAddress(residence.residenceAddress.trim());
    if (c) return c;
  }
  if (residence.residenceSido?.trim()) {
    const s = residence.residenceSido.trim();
    for (const city of KOREAN_CITIES) {
      if (city === '전체') continue;
      const short = city.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').replace('도', '');
      if (s === city || s === short) return city;
    }
  }
  return null;
}

