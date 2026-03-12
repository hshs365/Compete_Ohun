/** 플레이어 구인 폼: 종목별 필드 정의 */
export type RecruitFieldType = 'select' | 'multiselect' | 'checkbox';

export interface RecruitFieldDef {
  key: string;
  label: string;
  type: RecruitFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export interface MercenaryRecruitFormSchema {
  fields: RecruitFieldDef[];
}

/** 종목별 플레이어 구인 폼 스키마 */
export const MERCENARY_RECRUIT_FORM: Record<string, MercenaryRecruitFormSchema> = {
  배드민턴: {
    fields: [
      {
        key: 'levelCategory',
        label: '희망 급수',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: 'A', label: 'A조' },
          { value: 'B', label: 'B조' },
          { value: 'C', label: 'C조' },
          { value: 'D', label: 'D조' },
          { value: 'E', label: 'E조' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'all', label: '상관없음' },
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
        ],
        required: false,
      },
    ],
  },
  축구: {
    fields: [
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'FW', label: 'FW' },
          { value: 'MF', label: 'MF' },
          { value: 'DF', label: 'DF' },
          { value: 'GK', label: 'GK' },
        ],
        required: false,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
        ],
        required: false,
      },
    ],
  },
  풋살: {
    fields: [
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'FW', label: 'FW' },
          { value: 'MF', label: 'MF' },
          { value: 'DF', label: 'DF' },
          { value: 'GK', label: 'GK' },
        ],
        required: false,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
        ],
        required: false,
      },
    ],
  },
  농구: {
    fields: [
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'PG', label: '포인트가드' },
          { value: 'SG', label: '슈팅가드' },
          { value: 'SF', label: '스몰포워드' },
          { value: 'PF', label: '파워포워드' },
          { value: 'C', label: '센터' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '3v3_half', label: '3:3 하프코트' },
          { value: '3v3_full', label: '3:3 풀코트' },
          { value: '5v5_full', label: '5:5 풀코트' },
          { value: 'street', label: '스트리트(길거리)' },
          { value: 'league', label: '리그/대회' },
        ],
        required: false,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
        ],
        required: false,
      },
    ],
  },
  야구: {
    fields: [
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'P', label: '투수' },
          { value: 'C', label: '포수' },
          { value: '1B', label: '1루수' },
          { value: '2B', label: '2루수' },
          { value: '3B', label: '3루수' },
          { value: 'SS', label: '유격수' },
          { value: 'LF', label: '좌익수' },
          { value: 'CF', label: '중견수' },
          { value: 'RF', label: '우익수' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: 'full', label: '9회 정식' },
          { value: '7inning', label: '7회' },
          { value: 'softball', label: '소프트볼' },
          { value: 'practice', label: '연습/친선' },
        ],
        required: false,
      },
    ],
  },
  핸드볼: {
    fields: [
      {
        key: 'skillLevel',
        label: '희망 급수',
        type: 'select',
        options: [{ value: '', label: '상관없음' }],
        required: false,
      },
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'GK', label: '골키퍼' },
          { value: 'LW', label: '레프트윙' },
          { value: 'RW', label: '라이트윙' },
          { value: 'PV', label: '피벗' },
          { value: 'CB', label: '센터백' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '7v7', label: '7:7 정식' },
          { value: 'practice', label: '연습/친선' },
        ],
        required: false,
      },
    ],
  },
  배구: {
    fields: [
      {
        key: 'skillLevel',
        label: '희망 급수',
        type: 'select',
        options: [{ value: '', label: '상관없음' }],
        required: false,
      },
      {
        key: 'positions',
        label: '희망 포지션',
        type: 'multiselect',
        options: [
          { value: 'all', label: '전체' },
          { value: 'S', label: '세터' },
          { value: 'OH', label: '아웃사이드 히터' },
          { value: 'MB', label: '미들 블로커' },
          { value: 'OP', label: '오포지트' },
          { value: 'L', label: '리베로' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: '6v6', label: '6:6 정식' },
          { value: '4v4', label: '4:4' },
          { value: 'practice', label: '연습/친선' },
        ],
        required: false,
      },
    ],
  },
  탁구: {
    fields: [
      {
        key: 'skillLevel',
        label: '희망 실력',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'all', label: '상관없음' },
          { value: 'singles', label: '단식' },
          { value: 'doubles', label: '복식' },
          { value: 'mixed', label: '혼합복식' },
        ],
        required: false,
      },
    ],
  },
  골프: {
    fields: [
      {
        key: 'skillLevel',
        label: '희망 실력',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'stroke', label: '스트로크' },
          { value: 'match', label: '매치플레이' },
          { value: 'fourball', label: '포볼' },
          { value: 'practice', label: '연습라운드' },
        ],
        required: true,
      },
    ],
  },
  테니스: {
    fields: [
      {
        key: 'skillLevel',
        label: '희망 실력',
        type: 'select',
        options: [
          { value: '', label: '상관없음' },
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
        required: false,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'all', label: '상관없음' },
          { value: 'singles', label: '단식' },
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
        ],
        required: false,
      },
    ],
  },
};
