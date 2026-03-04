/** 용병 구인 폼: 종목별 필드 정의 */
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

/** 종목별 용병 구인 폼 스키마 */
export const MERCENARY_RECRUIT_FORM: Record<string, MercenaryRecruitFormSchema> = {
  배드민턴: {
    fields: [
      {
        key: 'levelCategory',
        label: '희망 급수',
        type: 'select',
        options: [
          { value: 'A', label: 'A조' },
          { value: 'B', label: 'B조' },
          { value: 'C', label: 'C조' },
          { value: 'D', label: 'D조' },
          { value: 'E', label: 'E조' },
        ],
        required: true,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
          { value: 'all', label: '복식 상관없음' },
        ],
        required: true,
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
          { value: 'FW', label: 'FW' },
          { value: 'MF', label: 'MF' },
          { value: 'DF', label: 'DF' },
          { value: 'GK', label: 'GK' },
        ],
        required: true,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
        ],
        required: true,
      },
      {
        key: 'matchSize',
        label: '경기 인원',
        type: 'select',
        options: [
          { value: '5', label: '5:5' },
          { value: '7', label: '7:7' },
          { value: '11', label: '11:11' },
        ],
        required: true,
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
          { value: 'FW', label: 'FW' },
          { value: 'MF', label: 'MF' },
          { value: 'DF', label: 'DF' },
          { value: 'GK', label: 'GK' },
        ],
        required: true,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
        ],
        required: true,
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
          { value: 'G', label: '가드' },
          { value: 'F', label: '포워드' },
          { value: 'C', label: '센터' },
        ],
        required: true,
      },
      {
        key: 'skillLevel',
        label: '실력 급수',
        type: 'select',
        options: [
          { value: '1', label: '1급 (상)' },
          { value: '2', label: '2급 (중상)' },
          { value: '3', label: '3급 (중)' },
          { value: '4', label: '4급 (중하)' },
          { value: '5', label: '5급 (하)' },
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
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
        required: true,
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'singles', label: '단식' },
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
          { value: 'all', label: '상관없음' },
        ],
        required: true,
      },
    ],
  },
};
