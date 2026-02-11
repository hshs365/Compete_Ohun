export type SelectedGroup = {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
  memberCount?: number;
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
};
