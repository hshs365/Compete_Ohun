export type SelectedGroup = {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
  memberCount?: number;
  /** 서버에서 반환한 매치장 제외 참가자 수 (용병 구하기 등) */
  participantCountExcludingCreator?: number;
  maxParticipants?: number;
  category?: string;
  description?: string;
  meetingTime?: string;
  contact?: string;
  equipment?: string[];
  /** 매치 유형: normal=일반, rank=랭크, event=이벤트 */
  type?: 'normal' | 'rank' | 'event';
  /** 인원 마감 여부 (마커 색상용) */
  isFull?: boolean;
  /** 참가비 여부 (목록 표시용) */
  hasFee?: boolean;
  /** 참가비 금액 P (목록 표시용) */
  feeAmount?: number | null;
  badges?: {
    isNew?: boolean;
    isHot?: boolean;
    hasRanker?: boolean;
    isUrgent?: boolean;
    isToday?: boolean;
  };
  parsedMeetingTime?: Date;
  /** 작성자(매치장) 정보 - 신뢰도/노쇼 표시용 */
  creator?: {
    id: number;
    nickname: string;
    tag?: string | null;
    mannerScore?: number;
    noShowCount?: number;
  };
  /** 슈퍼 노출: boostedUntil > now 이면 리스트 최상단 고정 */
  boostedUntil?: string | null;
  isBoosted?: boolean;
  /** 노쇼 방지 예치금 (용병 참가 시, 경기 종료 후 환급) */
  depositAmount?: number | null;
}
