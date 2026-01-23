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
  badges?: {
    isNew?: boolean;
    isHot?: boolean;
    hasRanker?: boolean;
    isUrgent?: boolean;
    isToday?: boolean;
  };
  parsedMeetingTime?: Date;
};
