import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PublicFacilityQueryDto } from './dto/public-facility-query.dto';

/** 공공 API 응답 한 건 (전국체육시설표준데이터 실제 필드: faci_nm, faci_road_addr 등) */
interface PublicApiItem {
  faci_nm?: string;
  faci_stat_nm?: string; // 영업, 폐업, 휴업 등
  faci_road_addr?: string;
  faci_daddr?: string;
  faci_lat?: string;
  faci_lot?: string;
  ftype_nm?: string;
  faci_tel?: string;
  faci_oper_time?: string;
  addr_ctpv_nm?: string;
  addr_cpb_nm?: string;
  cp_nm?: string;
  mng_inst_nm?: string;
  관리기관?: string;
  관리기관명?: string;
  fclt_nm?: string;
  fcltNm?: string;
  시설명?: string;
  rdnmadr?: string;
  lnmadr?: string;
  소재지주소?: string;
  주소?: string;
  tel_no?: string;
  telNo?: string;
  연락처?: string;
  전화번호?: string;
  oper_time?: string;
  operTime?: string;
  이용시간?: string;
  운영시간?: string;
  fclt_ty_nm?: string;
  fcltTyNm?: string;
  시설유형명?: string;
  시설유형?: string;
  fclt_se_nm?: string;
  induty_nm?: string;
  업종명?: string;
  prk_posbl_at?: string;
  주차가능여부?: string;
  shwr_posbl_at?: string;
  샤워실여부?: string;
  [key: string]: unknown;
}

export interface PublicFacilityCard {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  /** 공공 API 관리기관명 (있을 때만 카드에 표시) */
  managerName: string | null;
  rating: number;
  reviewCount: number;
  price: string | null;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  source: 'public';
}

const DEFAULT_AMENITIES = ['주차', '샤워실', '라커룸'];

function getStr(item: PublicApiItem, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v != null && typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function getAmenities(item: PublicApiItem): string[] {
  const list: string[] = [];
  const parking = getStr(item, 'prk_posbl_at', 'faci_prk_yn', '주차가능여부');
  if (parking && (parking === 'Y' || parking === '예' || parking === '가능')) list.push('주차');
  const shower = getStr(item, 'shwr_posbl_at', 'faci_shwr_yn', '샤워실여부');
  if (shower && (shower === 'Y' || shower === '예' || shower === '가능')) list.push('샤워실');
  const locker = getStr(item, 'locker_room', 'faci_locker_yn', '라커룸');
  if (locker && (locker === 'Y' || locker === '예' || locker === '가능')) list.push('라커룸');
  if (list.length === 0) return [...DEFAULT_AMENITIES]; // 기본값
  return list;
}

/** 시도명 정규화 (전체/전국 -> API 값 없음) */
function normalizeSido(area: string): string {
  if (!area || area === '전체' || area === '전국') return '';
  const m: Record<string, string> = {
    '서울특별시': '서울특별시',
    '부산광역시': '부산광역시',
    '대구광역시': '대구광역시',
    '인천광역시': '인천광역시',
    '광주광역시': '광주광역시',
    '대전광역시': '대전광역시',
    '울산광역시': '울산광역시',
    '세종특별자치시': '세종특별자치시',
    '경기도': '경기도',
    '강원도': '강원도',
    '충청북도': '충청북도',
    '충청남도': '충청남도',
    '전라북도': '전라북도',
    '전라남도': '전라남도',
    '경상북도': '경상북도',
    '경상남도': '경상남도',
    '제주특별자치도': '제주특별자치도',
  };
  return m[area] || area;
}

/** 시도 매칭용 키워드 (API는 '경기 도', '경기도' 등으로 옴). 전국/전체면 빈 문자열(전체 매칭) */
function areaMatchKeyword(area: string): string {
  if (!area || area === '전체' || area === '전국') return '';
  const m: Record<string, string> = {
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '경기도': '경기',
    '강원도': '강원',
    '충청북도': '충북',
    '충청남도': '충남',
    '전라북도': '전북',
    '전라남도': '전남',
    '경상북도': '경북',
    '경상남도': '경남',
    '제주특별자치도': '제주',
  };
  return m[area] || area.replace(/특별시|광역시|특별자치시|도/g, '').trim() || area;
}

/** API 응답 문자열에서 시도 키워드 추출 (예: '경기 도', '인천광역시' -> '경기', '인천'). 매칭 실패 시 null */
function getItemSidoKeyword(item: PublicApiItem): string | null {
  const raw = getStr(item, 'addr_ctpv_nm', 'cp_nm', 'mng_inst_nm', '관리기관', '관리기관명', 'addr_cpb_nm');
  if (!raw) return null;
  const s = raw.trim();
  // 시도명/관리기관명이 포함된 문자열에서 키워드만 추출 (순서: 긴 것부터 매칭)
  const patterns: [RegExp, string][] = [
    [/서울특별시|서울시|^서울\b/, '서울'],
    [/부산광역시|^부산\b/, '부산'],
    [/대구광역시|^대구\b/, '대구'],
    [/인천광역시|^인천\b/, '인천'],
    [/광주광역시|^광주\b/, '광주'],
    [/대전광역시|^대전\b/, '대전'],
    [/울산광역시|^울산\b/, '울산'],
    [/세종특별자치시|^세종\b/, '세종'],
    [/경기도|경기\s*도|^경기\b/, '경기'],
    [/강원도|^강원\b/, '강원'],
    [/충청북도|충북|^충북\b/, '충북'],
    [/충청남도|충남|^충남\b/, '충남'],
    [/전라북도|전북|^전북\b/, '전북'],
    [/전라남도|전남|^전남\b/, '전남'],
    [/경상북도|경북|^경북\b/, '경북'],
    [/경상남도|경남|^경남\b/, '경남'],
    [/제주특별자치도|제주도|^제주\b/, '제주'],
  ];
  for (const [regex, keyword] of patterns) {
    if (regex.test(s)) return keyword;
  }
  return null;
}

/** 폐업/휴업 시설 제외 */
function isClosed(item: PublicApiItem): boolean {
  const stat = getStr(item, 'faci_stat_nm', 'faci_stat_cd');
  return stat === '폐업' || stat === '휴업' || stat === '폐관' || stat === '휴관';
}

/** 선택한 지역(시도)과 일치하는지 — 시도 키워드 정확 일치만 허용. 시도 불명이면 지역 선택 시 제외 */
function matchesArea(item: PublicApiItem, areaKeyword: string): boolean {
  if (!areaKeyword) return true;
  const itemKeyword = getItemSidoKeyword(item);
  if (itemKeyword == null) return false; // 시도 정보 없으면 선택 지역에서 제외
  return itemKeyword === areaKeyword.trim();
}

/** 앱에서 노출할 시설 유형만 허용: 야구장, 축구장, 풋살장, 체육센터(농구/배드민턴/탁구 등). 스크린골프·당구·헬스장 등 제외 */
const ALLOWED_FTYPE_KEYWORDS = ['야구', '축구', '풋살', '체육센터', '농구', '배드민턴', '탁구'];

/** 공공 API 시설이 허용된 유형인지 (ftype_nm 기준) */
function isAllowedFacilityType(item: PublicApiItem): boolean {
  const ftype = getStr(item, 'ftype_nm', 'fclt_ty_nm', 'fcltTyNm', '시설유형명', '시설유형', '업종명');
  if (!ftype) return false;
  const lower = ftype.toLowerCase();
  return ALLOWED_FTYPE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/** 종목(카테고리)별 ftype_nm 키워드 - 추후 종목 추가 시 확장 */
const CATEGORY_FTYPE_KEYWORDS: Record<string, string[]> = {
  축구: ['축구', '풋살'],
};

/** 선택한 종목과 일치하는지 (ftype_nm 기준) */
function matchesCategory(item: PublicApiItem, category: string): boolean {
  if (!category || category === '전체') return true;
  const keywords = CATEGORY_FTYPE_KEYWORDS[category];
  if (!keywords || keywords.length === 0) return true;
  const ftype = getStr(item, 'ftype_nm', 'fclt_ty_nm', 'fcltTyNm', '시설유형명', '시설유형', '업종명').toLowerCase();
  if (!ftype) return false;
  return keywords.some((kw) => ftype.includes(kw.toLowerCase()));
}

@Injectable()
export class PublicFacilitiesService {
  // 포털 개발계정 상세보기 엔드포인트 그대로 사용 (https)
  private readonly baseUrl = 'https://apis.data.go.kr/B551014/SRVC_API_SFMS_FACI';

  constructor(private readonly configService: ConfigService) {}

  async getList(query: PublicFacilityQueryDto): Promise<{
    facilities: PublicFacilityCard[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const serviceKey = this.configService.get<string>('DATA_GO_KR_SERVICE_KEY');
    if (!serviceKey) {
      return { facilities: [], total: 0, page: query.page ?? 1, hasMore: false };
    }

    const pageNo = query.page ?? 1;
    const clientLimit = Math.min(query.limit ?? 9, 100);
    // 필터(종목/지역/폐업 등) 후 개수가 줄어들므로 API에는 더 많이 요청해, 클라이언트에는 clientLimit(9)개 단위로 반환
    const numOfRows = Math.min(100, Math.max(60, clientLimit * 6));

    // 공공데이터포털: serviceKey(Decoding 키), resultType=json. 일부 API는 type 대신 resultType 사용.
    const params: Record<string, string | number> = {
      serviceKey,
      pageNo,
      numOfRows,
      resultType: 'json',
      type: 'json',
    };

    const search = query.search?.trim();
    if (search) params['fcltNm'] = search;
    const sido = normalizeSido(query.area ?? '');
    if (sido) {
      params['ctprvnNm'] = sido;
      params['ctprvn_nm'] = sido;
      params['cp_nm'] = sido;
    }
    const tryRequest = async (requestUrl: string, requestParams: Record<string, string | number>) => {
      const res = await axios.get(requestUrl, {
        params: requestParams,
        timeout: 15000,
        headers: { Accept: 'application/json' },
        validateStatus: () => true,
      });
      if (res.status !== 200) return null;

      const data = res.data as any;
      const header = data?.response?.header ?? data?.header;
      const resultCode = header?.resultCode ?? header?.resultCode;
      if (resultCode != null && String(resultCode) !== '00' && String(resultCode) !== '0') return null;

      const body = data?.response?.body ?? data?.body;
      let items: PublicApiItem[] = [];
      const raw =
        body?.items?.item ??
        body?.items ??
        body?.item ??
        body?.data?.list ??
        (Array.isArray(body) ? body : undefined);
      if (Array.isArray(raw)) items = raw;
      else if (raw && typeof raw === 'object') items = [raw];

      const totalCount = typeof body?.totalCount === 'number' ? body.totalCount : items.length;
      return { items, totalCount };
    };

    const urlsToTry = [
      this.baseUrl,
      `${this.baseUrl}/getList`,
      `${this.baseUrl}/TODZ_API_SFMS_FACI`,
    ];

    let lastError: unknown;
    for (const url of urlsToTry) {
      try {
        let result = await tryRequest(url, params);
        if (!result && (params['fcltNm'] || params['ctprvnNm'] || params['cp_nm'])) {
          const minimalParams = { serviceKey, pageNo, numOfRows, resultType: 'json' as const };
          result = await tryRequest(url, minimalParams);
        }
        if (result !== null) {
          const areaKeyword = areaMatchKeyword(query.area ?? '');
          const category = query.category?.trim() ?? '';
          const filtered = result.items.filter(
            (item) =>
              isAllowedFacilityType(item) &&
              !isClosed(item) &&
              matchesArea(item, areaKeyword) &&
              matchesCategory(item, category),
          );
          const allMapped: PublicFacilityCard[] = filtered.map((item, idx) =>
            this.mapItem(item, (pageNo - 1) * numOfRows + idx),
          );
          const facilities = allMapped.slice(0, clientLimit);
          const hasMore =
            allMapped.length > clientLimit ||
            (result.items.length >= numOfRows && pageNo * numOfRows < result.totalCount);
          return {
            facilities,
            total: result.totalCount,
            page: pageNo,
            hasMore,
          };
        }
        lastError = { url, message: 'no valid response' };
      } catch (err) {
        lastError = err;
        if (axios.isAxiosError(err)) {
          console.warn('[PublicFacilities] try', url, err.response?.status, String(err.response?.data ?? err.message).slice(0, 200));
        }
      }
    }

    console.error('[PublicFacilities] API error (all URLs tried):', lastError);
    return { facilities: [], total: 0, page: pageNo, hasMore: false };
  }

  private mapItem(item: PublicApiItem, index: number): PublicFacilityCard {
    const name = getStr(item, 'faci_nm', 'fclt_nm', 'fcltNm', '시설명') || `시설 ${index + 1}`;
    const roadAddr = getStr(item, 'faci_road_addr', 'rdnmadr', 'lnmadr', '소재지주소', '주소');
    const detailAddr = getStr(item, 'faci_daddr');
    const address = roadAddr ? (detailAddr ? `${roadAddr} ${detailAddr}`.trim() : roadAddr) : '주소 정보 없음';
    const phone = getStr(item, 'faci_tel', 'tel_no', 'telNo', '연락처', '전화번호') || null;
    const operatingHours = getStr(item, 'faci_oper_time', 'oper_time', 'operTime', '이용시간', '운영시간') || null;
    const managerName = getStr(item, 'cp_nm', 'mng_inst_nm', '관리기관', '관리기관명') || null;
    const type = getStr(item, 'ftype_nm', 'fclt_ty_nm', 'fcltTyNm', '시설유형명', '시설유형', 'fclt_se_nm', 'induty_nm', '업종명') || '체육시설';

    const lat = item.faci_lat != null && item.faci_lat !== '' ? parseFloat(String(item.faci_lat)) : null;
    const lng = item.faci_lot != null && item.faci_lot !== '' ? parseFloat(String(item.faci_lot)) : null;

    return {
      id: `public-${index}-${Date.now()}`,
      name,
      type,
      address: address || '주소 정보 없음',
      phone,
      operatingHours,
      managerName,
      rating: 0,
      reviewCount: 0,
      price: null,
      amenities: getAmenities(item),
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      source: 'public',
    };
  }
}
