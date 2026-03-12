import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, UsersIcon, WrenchScrewdriverIcon, TrashIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, TrophyIcon, StarIcon, CurrencyDollarIcon, BuildingOfficeIcon, ClipboardDocumentCheckIcon, HeartIcon, PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon, QrCodeIcon, DevicePhoneMobileIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import UserDetailModal from './UserDetailModal';
import FootballPitch from './FootballPitch';
import MatchReviewModal from './MatchReviewModal';
import MercenaryReviewModal from './MercenaryReviewModal';
import HostQRModal from './HostQRModal';
import EditGroupModal from './EditGroupModal';
import ExpandableQRCode from './ExpandableQRCode';
import { showError, showSuccess, showInfo, showConfirm, showToast } from '../utils/swal';
import { extractCityFromAddress, getUserCityForJoin } from '../utils/locationUtils';
import { MANNER_SCORE_THRESHOLD } from '../constants/penalty';

interface GroupDetailProps {
  group: SelectedGroup | null;
  onClose: () => void;
  onParticipantChange?: () => void; // 참가자 수 변경 시 콜백
}

interface Participant {
  id: number;
  userId: number;
  user: {
    id: number;
    nickname: string;
    tag?: string; // 닉네임 태그
    profileImage?: string | null;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null; // 랭커 여부 확인용
    totalScore?: number; // 오운 랭크 점수 (명예의 전당)
  };
  status: string;
  joinedAt: string;
  isCreator?: boolean; // 매치장 여부
  isRanker?: boolean; // 랭커 여부
  rank?: number; // 랭킹 순위
  score?: number; // 활동 점수
  sportCategory?: string; // 운동 카테고리
  positionCode?: string | null; // 포지션 지정 매치 시 참가 포지션
  slotLabel?: string | null; // 구장 슬롯 라벨 (LW, RW 등)
  team?: 'red' | 'blue'; // 레드팀 / 블루팀
}

interface GameSettings {
  id: number;
  gameType: 'team' | 'individual';
  positions: string[];
  minPlayersPerTeam: number | null;
  balanceByExperience: boolean;
  balanceByRank: boolean;
}

interface GroupDetailData {
  id: number;
  name: string;
  location: string;
  category: string;
  description: string | null;
  meetingTime: string | null;
  participantCount: number;
  creatorId: number;
  /** 매치 유형: normal 일반매치(매치장 진행), rank 랭크 매치(심판 시스템) */
  type?: 'normal' | 'rank' | 'event';
  creator: {
    id: number;
    nickname: string;
    tag?: string | null;
    profileImage?: string | null;
    profileImageUrl?: string | null; // API 응답 필드
    totalScore?: number;
  };
  participants: Participant[];
  isUserParticipant?: boolean;
  isClosed?: boolean;
  /** 취소된 매치(최소 인원 미달 등)면 false. 취소된 매치에서는 리뷰 모달 미오픈 */
  isActive?: boolean;
  isCompleted?: boolean;
  maxParticipants?: number | null;
  minParticipants?: number | null;
  meetingDateTime?: string | null;
  gameSettings?: GameSettings | null;
  hasFee?: boolean;
  feeAmount?: number | null;
  facilityId?: number | null;
  facility?: {
    id: number;
    name: string;
    address: string;
    type: string;
    image?: string | null;
  } | null;
  /** 가계약 1·2·3순위 시설 (인원 마감 전 또는 미확정 시) */
  provisionalFacilities?: Array<{
    priority: number;
    facilityId: number;
    facility: { id: number; name: string; address: string; type: string; image?: string | null } | null;
  }>;
  referees?: Array<{
    id: number;
    userId: number;
    appliedAt: string;
    user: { id: number; nickname: string; tag?: string };
  }>;
  isUserReferee?: boolean;
  isFavorited?: boolean;
  /** 예약 대기 등록 여부 */
  isUserOnWaitlist?: boolean;
  /** 예약 대기 순서 (1부터) */
  waitlistPosition?: number | null;
  /** 플레이어 구하기 매치 여부 */
  isMercenaryRecruit?: boolean;
}

const FOOTBALL_FEE_NORMAL = 10000;
const FOOTBALL_FEE_EARLY = 8000;

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return base + url;
};

/** 매치 당일이 아닌 이전날부터 참가 시 2,000P 할인 (축구) */
function getRequiredPoints(feeAmount: number, category: string, meetingDateTime: string | null | undefined): number {
  if (category !== '축구') return feeAmount;
  if (!meetingDateTime) return FOOTBALL_FEE_NORMAL;
  const meeting = new Date(meetingDateTime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  meeting.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((meeting.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays >= 1 ? FOOTBALL_FEE_EARLY : FOOTBALL_FEE_NORMAL;
}

/** 참가·일정 변경 가능 기한(매치 시작 1시간 전)까지 남은 시간 안내 문구 */
function getChangeDeadlineRemaining(meetingDateTime: string | null): { text: string; isPast: boolean } {
  if (!meetingDateTime) return { text: '', isPast: true };
  const start = new Date(meetingDateTime).getTime();
  const deadline = start - 60 * 60 * 1000; // 서버 규칙: 1시간 전까지 취소/변경 가능
  const now = Date.now();
  if (now >= deadline) return { text: '참가·일정 변경 가능 기한이 지났어요.', isPast: true };
  const diff = deadline - now;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return { text: `참가·일정 변경 가능 기한까지 ${days}일 ${hours}시간 남음`, isPast: false };
  if (hours > 0) return { text: `참가·일정 변경 가능 기한까지 ${hours}시간 ${minutes}분 남음`, isPast: false };
  return { text: `참가·일정 변경 가능 기한까지 ${minutes}분 남음`, isPast: false };
}

/** 상단 카드용: 날짜·시간 요약 (예: 2/8(수) 18:00) */
function formatMeetingShort(meetingDateTime: string | null | undefined): string {
  if (!meetingDateTime) return '';
  const d = new Date(meetingDateTime);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = weekdays[d.getDay()];
  const h = d.getHours();
  const min = d.getMinutes();
  return `${m}/${day}(${w}) ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

/** 준비물 문자열 → 아이콘 라벨 (그리드용) */
const EQUIPMENT_ICONS: Record<string, string> = {
  아대: '🥋',
  축구화: '👟',
  운동복: '👕',
  수건: '🧻',
  골키퍼장갑: '🧤',
  장갑: '🧤',
  음료: '🥤',
  공: '⚽',
};
function getEquipmentIcon(name: string): string {
  return EQUIPMENT_ICONS[name] ?? '✓';
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onClose, onParticipantChange }) => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(group?.memberCount || 0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [creator, setCreator] = useState<{ id: number; nickname: string; tag?: string; profileImage?: string | null } | null>(null);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  /** 취소된 매치(최소 인원 미달 등) 여부. false면 리뷰 모달 자동 오픈 안 함 */
  const [isActive, setIsActive] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [minParticipants, setMinParticipants] = useState<number | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [hasFee, setHasFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState<number | null>(null);
  const [facility, setFacility] = useState<{ id: number; name: string; address: string; type: string; image?: string | null } | null>(null);
  const [provisionalFacilities, setProvisionalFacilities] = useState<Array<{ priority: number; facilityId: number; facility: { id: number; name: string; address: string; type: string; image?: string | null } | null }>>([]);
  /** 가계약 시설 캐러셀 인덱스 (화살표로 1·2·3순위 전환) */
  const [provisionalFacilityIndex, setProvisionalFacilityIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [groupMeetingDateTime, setGroupMeetingDateTime] = useState<string | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  /** 전술 포지션 모달에서 보는 팀 (한 팀씩 크게 보기) */
  const [positionModalTeam, setPositionModalTeam] = useState<'red' | 'blue'>('red');
  /** 상세 페이지 인라인 포메이션에서 보는 팀 */
  const [inlineFormationTeam, setInlineFormationTeam] = useState<'red' | 'blue'>('red');
  /** 결제 모달에서 결제 후 참가할 포지션 (빈 슬롯 클릭 → 결제 → 해당 포지션으로 참가). 팀만 배정 시 positionCode 생략 */
  const [pendingJoinPosition, setPendingJoinPosition] = useState<{ positionCode?: string; team: 'red' | 'blue' } | null>(null);
  /** 이미 활동이 끝난 매치 여부 (종료된 매치는 수정/삭제/마감 불가) */
  const [isPastMatch, setIsPastMatch] = useState(false);
  const [referees, setReferees] = useState<Array<{ id: number; userId: number; user: { id: number; nickname: string; tag?: string } }>>([]);
  const [isUserReferee, setIsUserReferee] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMercenaryReviewModal, setShowMercenaryReviewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isMercenaryRecruit, setIsMercenaryRecruit] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  /** 매치 유형: normal=일반(매치장 진행), rank=랭크(심판), event=이벤트 */
  const [groupType, setGroupType] = useState<'normal' | 'rank' | 'event'>('normal');
  /** 예약 대기: 등록 여부 및 대기 순서 */
  const [isUserOnWaitlist, setIsUserOnWaitlist] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  /** Penalty Guard: 신뢰도 점수 임계값 미만이면 참가 제한 */
  const isMannerBlocked = user != null && (user.mannerScore ?? 80) < MANNER_SCORE_THRESHOLD;

  /** 매치 10분 전 이후면 참가 신청 불가 */
  const isJoinClosedByTime =
    !!groupMeetingDateTime &&
    new Date() > new Date(new Date(groupMeetingDateTime).getTime() - 10 * 60 * 1000);

  useEffect(() => {
    if (group) {
      setParticipantCount(group.memberCount || 0);
      fetchGroupDetail();
    }
  }, [group?.id, user?.id]); // user 변경 시 재요청 (로그인 후 isFavorited 갱신)

  // 매치 종료 후 참가자면 리뷰 모달 자동 오픈 (취소된 매치는 제외)
  const hasAutoOpenedReview = React.useRef(false);
  useEffect(() => {
    if (
      user &&
      group &&
      isActive &&
      isPastMatch &&
      (isParticipant || isCreator) &&
      !showReviewModal &&
      !hasAutoOpenedReview.current
    ) {
      hasAutoOpenedReview.current = true;
      setShowReviewModal(true);
    }
  }, [user, group, isActive, isPastMatch, isParticipant, isCreator, showReviewModal]);

  // 결제 모달 열릴 때 사용자 포인트 새로고침
  useEffect(() => {
    if (showPaymentModal) {
      checkAuth().then(() => {});
    }
  }, [showPaymentModal, checkAuth]);

  // localStorage에서 프로필 이미지 가져오기
  const getProfileImage = (userId: number, profileImage?: string | null): string | null => {
    if (profileImage) {
      return profileImage;
    }
    // localStorage에서 프로필 이미지 확인
    // 현재 로그인한 사용자의 프로필 사진만 사용 (다른 사용자의 사진 방지)
    const savedProfileImage = localStorage.getItem(`profileImage_${userId}`);
    // 현재 사용자 ID와 일치하는지 확인 (안전장치)
    if (savedProfileImage && user?.id === userId) {
      return savedProfileImage;
    }
    return null;
  };

  const fetchGroupDetail = async () => {
    if (!group) return;
    
    try {
      const groupData = await api.get<GroupDetailData>(`/api/groups/${group.id}`);
      
      // 참가 상태 확인: 실제 참가자 목록만 확인 (레코드 존재 = 참가, status 무시)
      const isUserInParticipants = user?.id && groupData.participants?.some(
        (p) => p.userId === user.id
      );
      // 실제 참가자 목록만 확인 (백엔드의 isUserParticipant는 무시)
      setIsParticipant(isUserInParticipants || false);
      
      // 매치장 정보 먼저 설정 (참가자 수 계산에 필요)
      let currentCreator: { id: number; nickname: string; profileImage?: string | null } | null = null;
      let currentCreatorId: number | null = null;
      if (groupData.creator) {
        const profileImage = groupData.creator.profileImage ?? (groupData.creator as { profileImageUrl?: string | null }).profileImageUrl;
        const creatorWithImage = {
          ...groupData.creator,
          profileImage: getProfileImage(groupData.creator.id, profileImage),
        };
        currentCreator = creatorWithImage;
        currentCreatorId = groupData.creatorId;
        setCreator(creatorWithImage);
        setCreatorId(groupData.creatorId);
        // 현재 사용자가 매치장인지 확인
        setIsCreator(user?.id === groupData.creatorId);
      }
      
      // 참가자 목록 설정 (매치장 포함)
      if (groupData.participants) {
        // localStorage에서 프로필 이미지 추가
        const participantsWithImages = groupData.participants.map((p) => ({
          ...p,
          user: {
            ...p.user,
            profileImage: getProfileImage(p.user.id, p.user.profileImage),
          },
        }));
        setParticipants(participantsWithImages);
      } else {
        setParticipants([]);
      }
      
      // 참가자 수는 백엔드의 participantCount를 그대로 사용 (백엔드에서 동기화됨)
      setParticipantCount(groupData.participantCount || (currentCreator ? 1 : 0));
      
      // 매치 마감·활성 상태 설정 (취소된 매치: isActive false → 리뷰 모달 미오픈)
      setIsClosed(groupData.isClosed || false);
      setIsActive((groupData as { isActive?: boolean }).isActive !== false);
      setMaxParticipants(groupData.maxParticipants || null);
      setMinParticipants(groupData.minParticipants ?? null);
      setIsCreator(user?.id === groupData.creatorId);
      setGameSettings(groupData.gameSettings || null);
      setHasFee(groupData.hasFee || false);
      setFeeAmount(groupData.feeAmount || null);
      setReferees(groupData.referees || []);
      setIsUserReferee(groupData.isUserReferee || false);
      setIsFavorited(groupData.isFavorited ?? false);
      setGroupType(groupData.type === 'rank' || groupData.type === 'event' ? groupData.type : 'normal');
      setIsUserOnWaitlist(groupData.isUserOnWaitlist ?? false);
      setWaitlistPosition(groupData.waitlistPosition ?? null);
      setIsMercenaryRecruit((groupData as { isMercenaryRecruit?: boolean }).isMercenaryRecruit ?? false);

      // 이미 활동이 끝난 매치 여부 (종료된 매치는 수정/삭제/마감 불가)
      const ended =
        groupData.isCompleted === true ||
        (groupData.meetingDateTime && new Date(groupData.meetingDateTime) < new Date()) ||
        (groupData.meetingTime && (() => {
          const s = groupData.meetingTime!.trim();
          const parsed = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)
            ? new Date(s)
            : /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)
              ? new Date(s.replace(' ', 'T'))
              : /^\d{4}-\d{2}-\d{2}$/.test(s)
                ? new Date(s + 'T23:59:59')
                : null;
          return parsed ? parsed < new Date() : false;
        })());
      setIsPastMatch(!!ended);

      // 시설(매치장) 정보: API에서 facility를 내려주면 사용, 없으면 facilityId로 별도 조회
      if (groupData.facility) {
        setFacility(groupData.facility);
      } else if (groupData.facilityId) {
        try {
          const facilityData = await api.get<{ id: number; name: string; address: string; type: string; image?: string | null }>(
            `/api/facilities/${groupData.facilityId}`
          );
          setFacility(facilityData);
        } catch (error) {
          console.error('시설 정보 조회 실패:', error);
          setFacility(null);
        }
      } else {
        setFacility(null);
      }

      const prov = Array.isArray((groupData as any).provisionalFacilities) ? (groupData as any).provisionalFacilities : [];
      setProvisionalFacilities(prov);
      setProvisionalFacilityIndex(0);
      const meetingDt = groupData.meetingDateTime ?? (groupData.meetingTime ? (() => {
        const s = String(groupData.meetingTime).trim();
        if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) return s.replace(' ', 'T') + ':00';
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T12:00:00';
        return null;
      })() : null);
      setGroupMeetingDateTime(meetingDt);
    } catch (error) {
      console.error('매치 상세 정보 조회 실패:', error);
    }
  };

  const handleJoin = async () => {
    if (!group || isLoading) return;

    if (isJoinClosedByTime) {
      await showInfo('매치 시작 10분 전까지만 참가 신청이 가능합니다.', '참가 마감');
      return;
    }
    if (isMannerBlocked) {
      await showInfo(`신뢰도 점수(${user?.mannerScore ?? 0}점)가 낮아 매치 참가가 제한되었습니다. 매너를 개선해 주세요.`, '참가 제한');
      return;
    }

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      await showInfo('매치에 참가하려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return;
    }

    // 타 지역 매치 확인: 내 지역(시/도)과 다르면 한 번 더 안내
    const matchAddress = (group.location || facility?.address || '').trim();
    if (matchAddress && user) {
      const matchCity = extractCityFromAddress(matchAddress);
      const userCity = getUserCityForJoin(user.id, {
        residenceAddress: user.residenceAddress,
        residenceSido: user.residenceSido,
      });
      if (matchCity && userCity && matchCity !== userCity) {
        const confirmed = await showConfirm(
          `${matchCity}의 매치에 참가하시겠습니까?`,
          '타 지역 매치',
          '참가하기',
          '취소'
        );
        if (!confirmed) return;
      }
    }

    // 레드/블루 팀 배정 매치: 랭크 평균 균형에 따라 배정될 팀 제안 후 확인
    const isTeamPositionMatch =
      (groupType === 'rank' && gameSettings?.positions?.length) ||
      (gameSettings?.gameType === 'team' && gameSettings?.positions?.length);
    let suggestedTeam: 'red' | 'blue' | null = null;
    if (isTeamPositionMatch && group?.id) {
      try {
        const res = await api.get<{ team: 'red' | 'blue' }>(`/api/groups/${group.id}/suggested-team`);
        suggestedTeam = res.team ?? 'red';
      } catch {
        suggestedTeam = 'red';
      }
      const teamLabel = suggestedTeam === 'red' ? '레드' : '블루';
      const confirmed = await showConfirm(
        `${teamLabel}팀에 배정됩니다. 참가하시겠습니까?`,
        '팀 배정',
        '참가',
        '취소'
      );
      if (!confirmed) return;
    }

    // 축구는 항상 포인트로 참가 (10,000P 또는 전일 이전 8,000P)
    const needsPayment = group?.category === '축구' || (hasFee && feeAmount && feeAmount > 0);
    if (needsPayment) {
      setPendingJoinPosition(suggestedTeam != null ? { team: suggestedTeam } : null);
      setShowPaymentModal(true);
      return;
    }

    await processJoin(undefined, suggestedTeam ?? undefined);
  };

  const handleJoinWithPosition = async (positionCode: string, team: 'red' | 'blue' = 'red'): Promise<boolean> => {
    if (!group || isLoading) return false;
    if (isJoinClosedByTime) {
      await showInfo('매치 시작 10분 전까지만 참가 신청이 가능합니다.', '참가 마감');
      return false;
    }
    if (isMannerBlocked) {
      await showInfo(`신뢰도 점수(${user?.mannerScore ?? 0}점)가 낮아 매치 참가가 제한되었습니다. 매너를 개선해 주세요.`, '참가 제한');
      return false;
    }
    if (!user) {
      await showInfo('매치에 참가하려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return false;
    }
    const needsPayment = group?.category === '축구' || (hasFee && feeAmount && feeAmount > 0);
    if (needsPayment) {
      setPendingJoinPosition({ positionCode, team });
      setShowPaymentModal(true);
      return false;
    }
    return processJoin(positionCode, team);
  };

  /** 포지션 모달에서 빈 자리 클릭 시: 확인 후 참가 */
  const handleSlotClickWithConfirm = async (positionCode: string, team: 'red' | 'blue') => {
    const confirmed = await showConfirm('해당 포지션에 참여하시겠습니까?', '포지션 참가', '참가', '취소');
    if (!confirmed) return;
    const success = await handleJoinWithPosition(positionCode, team);
    if (success) setShowPositionModal(false);
  };

  const processJoin = async (positionCode?: string, team?: 'red' | 'blue'): Promise<boolean> => {
    if (!group || isLoading) return false;

    setIsLoading(true);
    try {
      const body: { positionCode?: string; team?: 'red' | 'blue' } = {};
      if (positionCode) body.positionCode = positionCode;
      if (team) body.team = team;
      const updatedGroup = await api.post<GroupDetailData>(`/api/groups/${group.id}/join`, body);
      
      // 참가 상태를 즉시 true로 설정 (참가 성공했으므로)
      setIsParticipant(true);
      
      // 백엔드가 Group 객체를 반환하므로 participantCount 필드 확인
      if (updatedGroup.participantCount !== undefined) {
        setParticipantCount(updatedGroup.participantCount);
      }
      
      // 참가자 목록 새로고침 (상태는 이미 true로 설정했으므로 덮어쓰지 않도록 주의)
      const groupData = await api.get<GroupDetailData>(`/api/groups/${group.id}`);
      
      // 매치장 정보 먼저 설정 (참가자 수 계산에 필요)
      let currentCreator: { id: number; nickname: string; profileImage?: string | null } | null = null;
      let currentCreatorId: number | null = null;
      if (groupData.creator) {
        const profileImage = groupData.creator.profileImage ?? (groupData.creator as { profileImageUrl?: string | null }).profileImageUrl;
        const creatorWithImage = {
          ...groupData.creator,
          profileImage: getProfileImage(groupData.creator.id, profileImage),
        };
        currentCreator = creatorWithImage;
        currentCreatorId = groupData.creatorId;
        setCreator(creatorWithImage);
        setCreatorId(groupData.creatorId);
        setIsCreator(user?.id === groupData.creatorId);
      }
      
      // 참가자 목록 설정
      if (groupData.participants) {
        const participantsWithImages = groupData.participants.map((p) => ({
          ...p,
          user: {
            ...p.user,
            profileImage: getProfileImage(p.user.id, p.user.profileImage),
          },
        }));
        setParticipants(participantsWithImages);
      } else {
        setParticipants([]);
      }
      
      // 참가자 수는 백엔드의 participantCount를 그대로 사용 (백엔드에서 동기화됨)
      setParticipantCount(groupData.participantCount || (currentCreator ? 1 : 0));
      
      // 매치 마감·활성 상태 설정
      setIsClosed(groupData.isClosed || false);
      setIsActive((groupData as { isActive?: boolean }).isActive !== false);
      setMaxParticipants(groupData.maxParticipants || null);
      setMinParticipants(groupData.minParticipants ?? null);
      setReferees(groupData.referees || []);
      setIsUserReferee(groupData.isUserReferee || false);
      setIsFavorited(groupData.isFavorited ?? false);
      setGroupType(groupData.type === 'rank' || groupData.type === 'event' ? groupData.type : 'normal');
      
      // 참가 상태는 이미 true로 설정했으므로 유지 (isUserParticipant가 false여도 무시)
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
      
      // 결제 모달 닫기
      setShowPaymentModal(false);
      
      // 성공 메시지 표시
      await showSuccess('매치에 참가했습니다!', '매치 참가');
      return true;
    } catch (error: any) {
      console.error('매치 참가 실패:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '매치 참가에 실패했습니다.';
      const msgStr = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
      const isTimeConflict = typeof msgStr === 'string' && msgStr.includes('같은 시간대');
      await showError(
        Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
        isTimeConflict ? '해당 시간에 참여 중인 매치가 있습니다' : '매치 참가 실패'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    const effectiveFee = (group?.category === '축구' ? FOOTBALL_FEE_NORMAL : feeAmount) ?? 0;
    if (effectiveFee <= 0) return;
    const required = getRequiredPoints(effectiveFee, group?.category || '', groupMeetingDateTime);
    const myPoints = user?.points ?? 0;
    if (myPoints < required) {
      await showError(`보유 포인트가 부족합니다. (필요: ${required.toLocaleString()}P, 보유: ${myPoints.toLocaleString()}P)`, '포인트 부족');
      return;
    }
    const pending = pendingJoinPosition;
    setPendingJoinPosition(null);
    if (pending) {
      await processJoin(pending.positionCode, pending.team);
    } else {
      await processJoin();
    }
  };

  const handleLeave = async () => {
    if (!group || isLoading) return;

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      await showInfo('매치에서 나가려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return;
    }

    const confirmed = await showConfirm('정말 매치에서 나가시겠습니까?', '매치 나가기');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    
    try {
      // 백엔드 API 호출 (레코드 완전 삭제)
      await api.post(`/api/groups/${group.id}/leave`);
      
      // 백엔드가 성공 응답을 보냈으므로 참가 상태를 즉시 false로 설정
      setIsParticipant(false);
      
      // 참가자 목록에서 현재 사용자 제거
      if (user?.id) {
        setParticipants(prev => prev.filter(p => p.userId !== user.id));
        setParticipantCount(prev => Math.max(1, prev - 1));
      }
      
      // 부모 컴포넌트에 변경 알림 (먼저 알림)
      if (onParticipantChange) {
        onParticipantChange();
      }
      
      // 백엔드 삭제 완료 대기 후 최신 데이터로 새로고침 (트랜잭션 커밋 대기)
      setTimeout(async () => {
        try {
          await fetchGroupDetail();
        } catch (error) {
          console.error('매치 상세 정보 새로고침 실패:', error);
          // 새로고침 실패해도 이미 상태는 업데이트되었으므로 무시
        }
      }, 500);
      
      // 성공 메시지 표시 (비동기로 처리하여 UI 블로킹 방지)
      setTimeout(() => {
        showSuccess('매치에서 나갔습니다.', '매치 나가기');
      }, 100);
    } catch (error: any) {
      console.error('매치 탈퇴 실패:', error);
      
      // 에러 메시지 추출
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          '매치 탈퇴에 실패했습니다.';
      
      await showError(errorMessage, '매치 탈퇴 실패');
      
      // 에러 발생 시 참가자 목록 다시 로드하여 상태 동기화
      try {
        await fetchGroupDetail();
      } catch (fetchError) {
        console.error('매치 상세 정보 새로고침 실패:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyReferee = async () => {
    if (!group || isLoading || !user) return;
    setIsLoading(true);
    try {
      await api.post<{ success: boolean; message: string }>(`/api/groups/${group.id}/referee-apply`);
      await showSuccess('심판 신청이 완료되었습니다.', '심판 신청');
      await fetchGroupDetail();
      if (onParticipantChange) onParticipantChange();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '심판 신청에 실패했습니다.';
      await showError(msg, '심판 신청 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReferee = async () => {
    if (!group || isLoading || !user) return;
    const confirmed = await showConfirm('심판 신청을 취소하시겠습니까?', '심판 신청 취소');
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await api.delete<{ success: boolean; message: string }>(`/api/groups/${group.id}/referee-apply`);
      await showSuccess('심판 신청이 취소되었습니다.', '심판 신청 취소');
      await fetchGroupDetail();
      if (onParticipantChange) onParticipantChange();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '심판 신청 취소에 실패했습니다.';
      await showError(msg, '심판 신청 취소 실패');
    } finally {
      setIsLoading(false);
    }
  };

  /** 예약 대기 등록 */
  const handleAddWaitlist = async () => {
    if (!group || isLoading || !user) return;
    setIsLoading(true);
    try {
      const res = await api.post<{ position: number }>(`/api/groups/${group.id}/waitlist`);
      setIsUserOnWaitlist(true);
      setWaitlistPosition(res.position);
      await showSuccess(`예약 대기에 등록되었습니다. (대기 순서: ${res.position}번)`, '예약 대기');
      if (onParticipantChange) onParticipantChange();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '예약 대기 등록에 실패했습니다.';
      await showError(msg, '예약 대기 실패');
    } finally {
      setIsLoading(false);
    }
  };

  /** 예약 대기 취소 */
  const handleRemoveWaitlist = async () => {
    if (!group || isLoading || !user) return;
    const confirmed = await showConfirm('예약 대기를 취소하시겠습니까?', '예약 대기 취소');
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await api.delete(`/api/groups/${group.id}/waitlist`);
      setIsUserOnWaitlist(false);
      setWaitlistPosition(null);
      await showSuccess('예약 대기가 취소되었습니다.', '예약 대기 취소');
      if (onParticipantChange) onParticipantChange();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || '예약 대기 취소에 실패했습니다.';
      await showError(msg, '예약 대기 취소 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group || isLoading) return;
    if (isPastMatch) {
      await showInfo('이미 종료된 매치입니다. 삭제할 수 없습니다.', '삭제 불가');
      return;
    }

    const confirmed = await showConfirm('정말 매치를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', '매치 삭제');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete(`/api/groups/${group.id}`);
      await showSuccess('매치가 삭제되었습니다.', '매치 삭제');
      onClose();
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
    } catch (error) {
      console.error('매치 삭제 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 삭제에 실패했습니다.', '매치 삭제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseGroup = async () => {
    if (!group || isLoading) return;
    if (isPastMatch) {
      await showInfo('이미 종료된 매치입니다. 마감할 수 없습니다.', '마감 불가');
      return;
    }

    const confirmed = await showConfirm('매치 인원을 마감하시겠습니까? 다른 사용자는 참가할 수 없게 됩니다.', '매치 마감');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/groups/${group.id}/close`);
      setIsClosed(true);
      await fetchGroupDetail();
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
    } catch (error) {
      console.error('매치 마감 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 마감에 실패했습니다.', '매치 마감 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenGroup = async () => {
    if (!group || isLoading) return;
    if (isPastMatch) {
      await showInfo('이미 종료된 매치입니다. 재개할 수 없습니다.', '재개 불가');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/groups/${group.id}/reopen`);
      setIsClosed(false);
      await fetchGroupDetail();
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
    } catch (error) {
      console.error('매치 재개 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 재개에 실패했습니다.', '매치 재개 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!group) return;

    try {
      // 현재 매치의 URL 생성 (현재 페이지 URL에 groupId 쿼리 파라미터 추가)
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('group', group.id.toString());
      const shareUrl = currentUrl.toString();
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      await showSuccess('매치 링크가 클립보드에 복사되었습니다!', '링크 복사');
    } catch (error) {
      console.error('링크 복사 실패:', error);
      // 클립보드 API가 지원되지 않는 경우 대체 방법
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('group', group.id.toString());
      const shareUrl = currentUrl.toString();
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        await showSuccess('매치 링크가 클립보드에 복사되었습니다!', '링크 복사');
      } catch (err) {
        await showInfo(`매치 링크: ${shareUrl}`, '링크 복사');
      }
      document.body.removeChild(textArea);
    }
  };

  /** 참가자 한 명 행 (매치장/일반 공통용) */
  const renderParticipantRow = (participant: Participant) => {
    const profileImage = getProfileImage(participant.user.id, participant.user.profileImage);
    const isCurrentUser = user?.id === participant.userId;
    const isCreator = participant.userId === creatorId;
    const isRanker = participant.user?.skillLevel === 'advanced';
    return (
      <div
        key={participant.id}
        onClick={() => {
          setSelectedParticipant({
            ...participant,
            isCreator: !!isCreator,
            isRanker: !!isRanker,
            rank: isRanker ? (participant.userId % 15) + 1 : undefined,
            score: isRanker ? 5000 + (participant.userId * 100) : undefined,
            sportCategory: group?.category || '전체',
          });
        }}
        className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
          isRanker
            ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-500/50 shadow-md'
            : isCreator
              ? 'bg-[var(--color-bg-secondary)] border-yellow-500/30'
              : isCurrentUser
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'bg-[var(--color-bg-primary)] border border-[var(--color-border-card)]'
        }`}
      >
        <div className="relative">
          {profileImage ? (
            <img
              src={profileImage}
              alt={participant.user.nickname}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white';
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white">
              <UserCircleIcon className="w-8 h-8" />
            </div>
          )}
          {isCreator && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 flex items-center justify-center">
              <StarIconSolid className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {isRanker && !isCreator && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-0.5 flex items-center justify-center">
              <span className="text-xs font-bold text-white">🏆</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {participant.user.nickname}{participant.user.tag || ''}
          </span>
          {isCreator && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
              <StarIconSolid className="w-3 h-3" />
              매치장
            </span>
          )}
          {isRanker && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              🏆 랭커
            </span>
          )}
          {isCurrentUser && !isCreator && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
              나
            </span>
          )}
        </div>
      </div>
    );
  };

  /** 매치장 한 명 행 (팀 구분 없을 때만 사용) */
  const renderCreatorRow = () => {
    if (!creator) return null;
    const creatorProfileImage = getProfileImage(creator.id, creator.profileImage ?? (creator as { profileImageUrl?: string | null }).profileImageUrl);
    const creatorParticipant = participants.find((p) => p.userId === creator.id);
    const isCreatorRanker = creatorParticipant?.user?.skillLevel === 'advanced';
    return (
      <div
        onClick={() => {
          const base = creatorParticipant
            ? {
                ...creatorParticipant,
                isCreator: true,
                isRanker: !!isCreatorRanker,
                rank: isCreatorRanker ? (creatorParticipant.userId % 15) + 1 : undefined,
                score: isCreatorRanker ? 5000 + (creatorParticipant.userId * 100) : undefined,
                sportCategory: group?.category || '전체',
              }
            : {
                id: 0,
                userId: creator.id,
                user: {
                  id: creator.id,
                  nickname: creator.nickname,
                  tag: creator.tag,
                  profileImage: creator.profileImage ?? (creator as { profileImageUrl?: string | null }).profileImageUrl,
                  totalScore: (creator as { totalScore?: number }).totalScore,
                },
                status: '',
                joinedAt: '',
                isCreator: true,
                isRanker: false,
                sportCategory: group?.category || '전체',
              } as Participant;
          setSelectedParticipant(base);
        }}
        className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
          isCreatorRanker
            ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-500/50 shadow-md'
            : 'bg-[var(--color-bg-secondary)] border-yellow-500/30'
        }`}
      >
        <div className="relative">
          {creatorProfileImage ? (
            <img
              src={creatorProfileImage}
              alt={creator.nickname}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white';
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white">
              <UserCircleIcon className="w-8 h-8" />
            </div>
          )}
          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 flex items-center justify-center">
            <StarIconSolid className="w-3.5 h-3.5 text-white" />
          </div>
          {isCreatorRanker && (
            <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-0.5 flex items-center justify-center">
              <span className="text-xs font-bold text-white">🏆</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{creator.nickname}{creator.tag || ''}</span>
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
              <StarIconSolid className="w-3 h-3" />
              매치장
            </span>
            {isCreatorRanker && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                🏆 랭커
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!group) return null;

  const handleFollow = async (userId: number) => {
    try {
      await api.post(`/api/users/follow/${userId}`);
      showToast('팔로우했습니다.', 'success');
      window.dispatchEvent(new CustomEvent('followStateChanged'));
    } catch (err) {
      console.error('팔로우 실패:', err);
      await showError(err instanceof Error ? err.message : '팔로우에 실패했습니다.', '팔로우 실패');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await api.delete(`/api/users/follow/${userId}`);
      showToast('언팔로우했습니다.', 'success');
      window.dispatchEvent(new CustomEvent('followStateChanged'));
    } catch (err) {
      console.error('언팔로우 실패:', err);
      await showError(err instanceof Error ? err.message : '언팔로우에 실패했습니다.', '언팔로우 실패');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !group || isFavoriteLoading) return;
    try {
      setIsFavoriteLoading(true);
      const res = await api.post<{ favorited: boolean }>(`/api/groups/${group.id}/favorite`);
      setIsFavorited(res.favorited);
      showToast(res.favorited ? '찜 목록에 추가되었습니다.' : '찜이 해제되었습니다.', 'success');
    } catch (err) {
      console.error('찜 토글 실패:', err);
      showError('찜 처리에 실패했습니다.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const meetingShort = formatMeetingShort(groupMeetingDateTime);
  const displayFee = (group?.category === '축구' || (hasFee && feeAmount && feeAmount > 0))
    ? (group?.category === '축구' ? getRequiredPoints(FOOTBALL_FEE_NORMAL, '축구', groupMeetingDateTime).toLocaleString() : (feeAmount ?? 0).toLocaleString())
    : null;

  return (
    <div className="group-detail-panel w-full min-w-0 flex-1 flex flex-col h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border-card)] shadow-xl rounded-r-xl overflow-hidden">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-3 flex items-center justify-between z-10 flex-shrink-0">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] truncate flex-1 min-w-0">{group.name}</h2>
        <div className="flex items-center gap-1 flex-shrink-0">
          {user && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors disabled:opacity-50"
              aria-label={isFavorited ? '찜 해제' : '찜하기'}
              title={isFavorited ? '찜 해제' : '찜하기'}
            >
              {isFavorited ? (
                <HeartIconSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>
      </div>

      {/* 내용: 스크롤 가능한 상세 (경기 정보 → 시설 → 참가자 순) */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
          {!isActive ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-[var(--color-text-secondary)] mb-4">이 매치는 최소 인원 미달 등으로 취소되었습니다.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] font-medium hover:opacity-90"
              >
                닫기
              </button>
            </div>
          ) : (
          <>
          {/* 상태 배지 (상단) */}
          {isClosed && (
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <LockClosedIcon className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-red-500">인원 마감</span>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-semibold rounded-md">
                        모집 중단
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      현재 새로운 참가자를 받지 않습니다
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상단 히어로 카드: 제목·날짜·장소·참가비 한눈에 (컴팩트) */}
          <div className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] p-3 space-y-2 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight truncate">{group.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {meetingShort && (
                <span className="flex items-center gap-1 text-[var(--color-text-primary)] font-medium">
                  <span className="text-[var(--color-text-secondary)]">날짜·시간</span>
                  <span>{meetingShort}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-[var(--color-text-primary)] min-w-0">
                <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-secondary)]" />
                <span className="truncate">{group.location}</span>
              </span>
            </div>
            {(displayFee != null || group.category || participantCount != null) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[var(--color-border-card)]">
                {displayFee != null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 font-semibold text-xs">
                    <CurrencyDollarIcon className="w-3.5 h-3.5" />
                    {displayFee}P
                  </span>
                )}
                {group.category && (
                  <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-md">
                    {group.category}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border-card)] text-xs">
                  <UsersIcon className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {minParticipants != null ? `${participantCount}/${minParticipants}` : participantCount + '명'}
                    {minParticipants == null && maxParticipants ? ` / ${maxParticipants}명` : ''}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* PC 전용: QR로 모바일에서 바로 보기 (터치 시 확대) */}
          {typeof window !== 'undefined' && (
            <div className="hidden md:flex flex-col items-center py-4 px-3 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]">
              <DevicePhoneMobileIcon className="w-5 h-5 text-[var(--color-text-secondary)] mb-2" />
              <ExpandableQRCode
                value={`${window.location.origin}/matches?group=${group.id}`}
                size={120}
                caption="카메라로 QR 찍고 핸드폰에서 보기"
                className="!rounded-lg"
              />
              <p className="text-xs text-[var(--color-text-secondary)] text-center mt-2 max-w-[140px]">
                터치하면 크게 보기
              </p>
            </div>
          )}

          {/* 상세 정보 */}
          <div className="border-t border-[var(--color-border-card)] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">상세 정보</h3>
            </div>
            <div className="space-y-2 text-sm">
              {group.description && (
                <p className="text-[var(--color-text-primary)] leading-relaxed">{group.description}</p>
              )}
              {group.meetingTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-secondary)]">매치 시간:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{group.meetingTime}</span>
                </div>
              )}
              {groupMeetingDateTime && (() => {
                const { text, isPast } = getChangeDeadlineRemaining(groupMeetingDateTime);
                if (!text) return null;
                return (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--color-text-secondary)]">변경 가능 기한:</span>
                    <span className={isPast ? 'text-[var(--color-text-secondary)]' : 'font-medium text-[var(--color-text-primary)]'}>
                      {text}
                    </span>
                  </div>
                );
              })()}
              {group.contact && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-secondary)]">문의:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{group.contact}</span>
                </div>
              )}
            </div>
          </div>

          {/* 전술 포지션: 랭크/이벤트매치 — 상세에서 포메이션 보기·빈 자리 클릭으로 참가 */}
          {groupType !== 'normal' && gameSettings?.gameType === 'team' && group.category === '축구' && (() => {
            const withTeam = participants.map((p) => ({
              userId: p.userId,
              nickname: p.user.nickname,
              tag: p.user.tag,
              positionCode: p.positionCode ?? null,
              slotLabel: p.slotLabel ?? null,
              isCreator: p.userId === creatorId,
              team: (p.team ?? 'red') as 'red' | 'blue',
              profileImageUrl: getProfileImage(p.user.id, p.user.profileImage),
              rankScore: p.user.totalScore ?? null,
              positionWinRate: null as number | null,
            }));
            if (creatorId && creator && !withTeam.some((p) => p.userId === creatorId)) {
              const creatorScore = (creator as { totalScore?: number }).totalScore ?? participants.find((p) => p.userId === creatorId)?.user?.totalScore ?? null;
              withTeam.push({
                userId: creatorId,
                nickname: creator.nickname,
                tag: creator.tag,
                positionCode: null,
                slotLabel: null,
                isCreator: true,
                team: 'red',
                profileImageUrl: getProfileImage(creatorId, creator.profileImage ?? (creator as { profileImageUrl?: string | null }).profileImageUrl),
                rankScore: creatorScore,
                positionWinRate: null as number | null,
              });
            }
            const redList = withTeam.filter((p) => p.team === 'red').map(({ team: _t, ...rest }) => rest);
            const blueList = withTeam.filter((p) => p.team === 'blue').map(({ team: _t, ...rest }) => rest);
            const recruitPositions = gameSettings.positions?.length ? gameSettings.positions : ['GK', 'DF', 'MF', 'FW'];
            const inlineList = inlineFormationTeam === 'red' ? redList : blueList;
            return (
              <div className="border-t border-[var(--color-border-card)] pt-4">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1.5">전술 포지션</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                  &quot;내 포지션&quot; 칩을 드래그해 빈 자리에 놓거나, 빈 자리를 클릭하면 해당 포지션으로 참가할 수 있습니다. (참가비 결제 후 확정)
                </p>
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-primary)] w-fit mb-2">
                  <button
                    type="button"
                    onClick={() => setInlineFormationTeam('red')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background: inlineFormationTeam === 'red' ? 'rgba(199,54,54,0.25)' : 'transparent',
                      color: inlineFormationTeam === 'red' ? '#fca5a5' : 'var(--color-text-secondary)',
                    }}
                  >
                    레드팀
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineFormationTeam('blue')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background: inlineFormationTeam === 'blue' ? 'rgba(59,108,184,0.25)' : 'transparent',
                      color: inlineFormationTeam === 'blue' ? '#93c5fd' : 'var(--color-text-secondary)',
                    }}
                  >
                    블루팀
                  </button>
                </div>
                <div className="w-full rounded-lg overflow-visible border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] min-h-[260px] flex items-center justify-center">
                  <FootballPitch
                    mode="match"
                    participants={inlineList}
                    onSlotClick={(pos, _slotLabel) => handleSlotClickWithConfirm(pos, inlineFormationTeam)}
                    isUserParticipant={isParticipant}
                    recruitPositions={recruitPositions}
                    size="default"
                    teamAccent={inlineFormationTeam}
                    enableDragDrop={!isParticipant && !!user}
                    dragItemLabel="내 포지션"
                    dragItemImageUrl={user ? getProfileImage(user.id, (user as { profileImage?: string | null }).profileImage ?? (user as { profileImageUrl?: string | null }).profileImageUrl) : null}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPositionModal(true)}
                  className="mt-2 w-full py-2 px-3 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserGroupIcon className="w-4 h-4" />
                  크게 보기
                </button>
              </div>
            );
          })()}

          {/* 랭크 매치 전용: 게임 설정 */}
          {groupType === 'rank' && gameSettings && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <UserGroupIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">게임 설정</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-secondary)]">매치 진행 방식:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {gameSettings.gameType === 'team' ? '포지션 지정 매치' : '자유 매칭'}
                  </span>
                </div>
                {gameSettings.positions && gameSettings.positions.length > 0 && (
                  <div>
                    <span className="text-sm text-[var(--color-text-secondary)] mb-2 block">모집 포지션:</span>
                    <div className="flex flex-wrap gap-2">
                      {gameSettings.positions.map((position, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg border border-blue-500/20"
                        >
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {gameSettings.minPlayersPerTeam && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--color-text-secondary)]">팀당 최소 인원:</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{gameSettings.minPlayersPerTeam}명</span>
                  </div>
                )}
                {(gameSettings.balanceByExperience || gameSettings.balanceByRank) && (
                  <div className="space-y-2">
                    <span className="text-sm text-[var(--color-text-secondary)] block">밸런스 조정:</span>
                    <div className="flex flex-wrap gap-2">
                      {gameSettings.balanceByExperience && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
                          <TrophyIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          <span className="text-sm text-[var(--color-text-primary)]">선수 출신 고려</span>
                        </div>
                      )}
                      {gameSettings.balanceByRank && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
                          <StarIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                          <span className="text-sm text-[var(--color-text-primary)]">랭커 고려</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 준비물: 아이콘 그리드 (라인·여백 통일, 필수/대여 색상 구분) */}
          {group.equipment && group.equipment.length > 0 && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <WrenchScrewdriverIcon className="w-4 h-4 text-[var(--color-text-secondary)]" strokeWidth={2} />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">준비물</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {group.equipment.map((item, index) => {
                  const isRentable = /대여|렌탈|빌려/.test(item);
                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border min-h-[72px] ${
                        isRentable
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-card)]'
                      }`}
                    >
                      <span className="text-xl mb-1.5 inline-flex items-center justify-center w-8 h-8 shrink-0" aria-hidden>{getEquipmentIcon(item)}</span>
                      <span className={`text-xs font-medium text-center truncate w-full ${isRentable ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-text-primary)]'}`}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 시설 정보 */}
          {(facility || provisionalFacilities.length > 0) && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <BuildingOfficeIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">시설</h3>
              </div>
              {facility ? (
                <div className="rounded-xl border border-[var(--color-border-card)] overflow-hidden bg-[var(--color-bg-secondary)]">
                  <div className="aspect-video w-full bg-[var(--color-bg-primary)]">
                    {(facility.image || (facility as { images?: string[] }).images?.[0]) ? (
                      <img
                        src={getImageUrl(facility.image ?? (facility as { images?: string[] }).images?.[0])}
                        alt={facility.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                        <BuildingOfficeIcon className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">시설 확정</span>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">{facility.name}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-1">{facility.address}</div>
                    {facility.type && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{facility.type}</div>}
                  </div>
                </div>
              ) : provisionalFacilities.length > 0 ? (
                <div className="rounded-xl border border-amber-500/30 overflow-hidden bg-amber-500/5">
                  <div className="relative">
                    {(() => {
                      const idx = Math.min(provisionalFacilityIndex, provisionalFacilities.length - 1);
                      const p = provisionalFacilities[idx];
                      const f = p?.facility;
                      const imgUrl = f?.image ?? (f as { images?: string[] })?.images?.[0];
                      return (
                        <>
                          <div className="aspect-video w-full bg-[var(--color-bg-primary)] relative">
                            {imgUrl ? (
                              <img
                                src={getImageUrl(imgUrl)}
                                alt={f?.name ?? `시설 #${p?.facilityId}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                                <BuildingOfficeIcon className="w-16 h-16" />
                              </div>
                            )}
                            {provisionalFacilities.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setProvisionalFacilityIndex((i) => (i <= 0 ? provisionalFacilities.length - 1 : i - 1))}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                                  aria-label="이전 시설"
                                >
                                  <ChevronLeftIcon className="w-6 h-6" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProvisionalFacilityIndex((i) => (i >= provisionalFacilities.length - 1 ? 0 : i + 1))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                                  aria-label="다음 시설"
                                >
                                  <ChevronRightIcon className="w-6 h-6" />
                                </button>
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium">
                                  {provisionalFacilityIndex + 1} / {provisionalFacilities.length}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="p-3">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">가계약 시설 (인원 마감 시 1→2→3순위로 확정)</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">{p.priority}순위</span>
                              <span className="text-base font-semibold text-[var(--color-text-primary)]">{f?.name ?? `시설 #${p?.facilityId}`}</span>
                            </div>
                            {f?.address && <div className="text-sm text-[var(--color-text-secondary)] mt-1">{f.address}</div>}
                            {f?.type && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{f.type}</div>}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 참가비 (별도 섹션) */}
          {(group?.category === '축구' || (hasFee && feeAmount && feeAmount > 0)) && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">참가비</h3>
              </div>
              <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
                <div className="text-base text-[var(--color-text-primary)] font-bold">
                  {group?.category === '축구'
                    ? getRequiredPoints(FOOTBALL_FEE_NORMAL, '축구', groupMeetingDateTime).toLocaleString()
                    : (feeAmount ?? 0).toLocaleString()}P
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {group?.category === '축구'
                    ? '참가 시 포인트로 결제됩니다. (매치 전일 이전 참가 시 2,000P 할인)'
                    : '참가 시 포인트로 결제됩니다.'}
                </div>
              </div>
            </div>
          )}

          {/* 참가자: 프로필 아이콘 가로 스크롤 + 명단 */}
          <div className="border-t border-[var(--color-border-card)] pt-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  참가자
                  {minParticipants != null ? (
                    <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">
                      ({participantCount}/{minParticipants})
                    </span>
                  ) : maxParticipants != null ? (
                    <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">
                      ({participantCount}/{maxParticipants}명)
                    </span>
                  ) : (
                    <span className="text-sm font-normal text-[var(--color-text-secondary)] ml-1">({participantCount}명)</span>
                  )}
                </h3>
              </div>
              {!isClosed && minParticipants != null && participantCount < minParticipants && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-[pulse_2.5s_ease-in-out_infinite]">
                  <span className="text-amber-700 dark:text-amber-400 text-sm font-semibold">
                    매치 성사까지 <span className="text-base font-bold">{minParticipants - participantCount}</span>명 남음
                  </span>
                </div>
              )}
            </div>
            {/* 프로필 아이콘 가로 스크롤 (컴팩트) */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 mb-3 scrollbar-thin">
              {creator && (
                <button
                  type="button"
                  onClick={() => {
                    const creatorParticipant = participants.find((p) => p.userId === creatorId);
                    const base = creatorParticipant
                      ? { ...creatorParticipant, isCreator: true, isRanker: !!(creatorParticipant?.user?.skillLevel === 'advanced'), rank: undefined, score: undefined, sportCategory: group?.category || '전체' }
                      : { id: 0, userId: creator.id, user: { id: creator.id, nickname: creator.nickname, tag: creator.tag, profileImage: creator.profileImage, totalScore: (creator as { totalScore?: number }).totalScore }, status: '', joinedAt: '', isCreator: true, isRanker: false, sportCategory: group?.category || '전체' } as Participant;
                    setSelectedParticipant(base);
                  }}
                  className="flex-shrink-0 flex flex-col items-center gap-0.5 group"
                >
                  <div className="relative">
                    {getProfileImage(creator.id, creator.profileImage) ? (
                      <img src={getProfileImage(creator.id, creator.profileImage)!} alt={creator.nickname} className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/60 group-hover:ring-2 group-hover:ring-amber-400/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-400/40"><UserCircleIcon className="w-7 h-7 text-[var(--color-text-primary)]" /></div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                      <StarIconSolid className="w-2 h-2 text-white" />
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--color-text-primary)] truncate max-w-14">매치장</span>
                </button>
              )}
              {participants.filter((p) => p.userId !== creatorId).map((participant) => {
                const isCreatorP = participant.userId === creatorId;
                const isRanker = participant.user?.skillLevel === 'advanced';
                const profileImage = getProfileImage(participant.user.id, participant.user.profileImage);
                return (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => setSelectedParticipant({ ...participant, isCreator: !!isCreatorP, isRanker: !!isRanker, rank: isRanker ? (participant.userId % 15) + 1 : undefined, score: isRanker ? 5000 + (participant.userId * 100) : undefined, sportCategory: group?.category || '전체' })}
                    className="flex-shrink-0 flex flex-col items-center gap-0.5 group"
                  >
                    <div className="relative">
                      {profileImage ? (
                        <img src={profileImage} alt={participant.user.nickname} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--color-border-card)] group-hover:ring-2 group-hover:ring-[var(--color-blue-primary)]/50" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-blue-primary)]/20 flex items-center justify-center border-2 border-[var(--color-border-card)]"><UserCircleIcon className="w-7 h-7 text-[var(--color-text-primary)]" /></div>
                      )}
                      {isRanker && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px]">🏆</span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-[var(--color-text-primary)] truncate max-w-14">{participant.user.nickname}</span>
                  </button>
                );
              })}
            </div>
            {groupType !== 'normal' && gameSettings?.gameType === 'team' ? (
              <div className="space-y-3">
                {/* 레드팀 */}
                <div>
                  <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> 레드팀
                  </h4>
                  <div className="space-y-2">
                    {participants.filter((p) => (p.team ?? 'red') === 'red').length === 0 ? (
                      <p className="text-sm text-[var(--color-text-secondary)] py-2">아직 참가자가 없습니다.</p>
                    ) : (
                      participants
                        .filter((p) => (p.team ?? 'red') === 'red')
                        .map((participant) => renderParticipantRow(participant))
                    )}
                  </div>
                </div>
                {/* 블루팀 */}
                <div>
                  <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 블루팀
                  </h4>
                  <div className="space-y-2">
                    {participants.filter((p) => p.team === 'blue').length === 0 ? (
                      <p className="text-sm text-[var(--color-text-secondary)] py-2">아직 참가자가 없습니다.</p>
                    ) : (
                      participants
                        .filter((p) => p.team === 'blue')
                        .map((participant) => renderParticipantRow(participant))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {creator && renderCreatorRow()}
                {participants
                  .filter((p) => p.userId !== creatorId)
                  .map((participant) => renderParticipantRow(participant))}
                {creator && participants.filter((p) => p.userId !== creatorId).length === 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">매치장 외 참가자가 없습니다.</p>
                )}
                {!creator && participants.length === 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">참가자가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 랭크 매치: 심판 | 일반/이벤트: 게임 진행 안내 */}
          {groupType === 'rank' ? (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">심판</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                경기 시작·종료 안내 및 결과 기록을 담당합니다. 심판은 경기에 참가할 수 없으며, 포인트가 지급됩니다.
              </p>
              {referees.length > 0 ? (
                <div className="space-y-1.5 mb-2">
                  {referees.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]"
                    >
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {r.user.nickname}
                        {r.user.tag && <span className="text-[var(--color-text-secondary)] ml-1">#{r.user.tag}</span>}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">심판</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)] py-1 mb-2">아직 심판 신청자가 없습니다.</p>
              )}
              {user && !isParticipant && (
                isUserReferee ? (
                  <button
                    type="button"
                    onClick={handleCancelReferee}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '처리 중...' : '심판 신청 취소'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyReferee}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-blue-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '처리 중...' : '심판 신청'}
                  </button>
                )
              )}
              {!user && (
                <p className="text-sm text-[var(--color-text-secondary)]">심판 신청은 로그인 후 가능합니다.</p>
              )}
            </div>
          ) : (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">게임 설정 · 매치 진행</h3>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <p>
                  자유 매칭입니다. 인원이 모이면 매치장의 오더 아래 자유롭게 진행합니다.
                </p>
                <p>
                  심판은 3파전일 때는 돌아가면서 남는 팀 인원 중 한 명이 봐주고, 2파전에서는 남는 후보 선수 중 한 명이 봐주는 방식으로 진행됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 매치장 전용 제어 버튼 */}
          {isCreator && (
            <div className="border-t border-[var(--color-border-card)] pt-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">매치 관리</h3>
              </div>
              {isPastMatch ? (
                <p className="text-sm text-[var(--color-text-secondary)] py-2">
                  이미 종료된 매치입니다. 수정·삭제·마감을 할 수 없습니다.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {isClosed ? (
                    <button
                      onClick={handleReopenGroup}
                      disabled={isLoading}
                      className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <LockOpenIcon className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">{isLoading ? '처리 중...' : '인원 모집 재개'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCloseGroup}
                      disabled={isLoading}
                      className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <LockClosedIcon className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">{isLoading ? '처리 중...' : '인원 마감하기'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowEditModal(true)}
                    disabled={isLoading}
                    className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <PencilSquareIcon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{isLoading ? '처리 중...' : '매치 수정'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="group relative flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <TrashIcon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{isLoading ? '처리 중...' : '매치 삭제하기'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼 (스크롤 영역 내 보조) */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--color-border-card)]">
            {isCreator && (
              <div className="flex-1 min-w-[80px] px-3 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5">
                <StarIconSolid className="w-4 h-4" />
                <span>매치장</span>
              </div>
            )}
            <button onClick={handleShare} className="px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg text-sm font-semibold hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border-card)]">
              공유하기
            </button>
          </div>
          </>
          )}
      </div>

      {/* 하단 스티키: 참가 신청하기 (컴팩트) - 취소된 매치가 아닐 때만 표시 */}
      {isActive && (
      <div className="sticky bottom-0 left-0 right-0 flex-shrink-0 p-3 bg-[var(--color-bg-card)] border-t border-[var(--color-border-card)] rounded-t-xl shadow-[0_-2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_8px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-1.5">
          {isCreator ? (
            <>
              {!isPastMatch && group && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/match-entry/${group.id}`)}
                    className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-colors"
                  >
                    매치 입장하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQRModal(true)}
                    className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-card)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <QrCodeIcon className="w-5 h-5" /> QR 인증 시작
                  </button>
                </>
              )}
              {isPastMatch && (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setShowReviewModal(true)} className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                    <PencilSquareIcon className="w-4 h-4" /> 리뷰 작성
                  </button>
                  {isMercenaryRecruit && (
                    <button type="button" onClick={() => setShowMercenaryReviewModal(true)} className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5">
                      <UserGroupIcon className="w-4 h-4" /> 플레이어 리뷰
                    </button>
                  )}
                </div>
              )}
            </>
          ) : isParticipant ? (
            <>
              {!isPastMatch && (
                <>
                  <button
                    type="button"
                    onClick={() => group && navigate(`/match-entry/${group.id}`)}
                    className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-colors"
                  >
                    매치 입장하기
                  </button>
                  <button onClick={handleLeave} disabled={isLoading || isClosed} className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? '처리 중...' : '매치 나가기'}
                  </button>
                </>
              )}
              {isPastMatch && (
                <button type="button" onClick={() => setShowReviewModal(true)} className="w-full py-2.5 px-3 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
                  <PencilSquareIcon className="w-4 h-4" /> 리뷰 작성
                </button>
              )}
            </>
          ) : (
            <>
              {isMannerBlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/20 border border-amber-500/40 rounded-lg px-3 py-2 mb-2">
                  신뢰도 점수({user?.mannerScore ?? 0}점)가 낮아 참가가 제한됩니다. 매너를 개선해 주세요.
                </p>
              )}
              <button
                onClick={handleJoin}
                disabled={isLoading || isClosed || isJoinClosedByTime || isMannerBlocked}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 ${
                  isClosed || isJoinClosedByTime || isMannerBlocked
                    ? 'bg-gray-400 text-white'
                    : 'bg-[var(--color-blue-primary)] text-white hover:opacity-95 shadow-lg shadow-[var(--color-blue-primary)]/30 hover:shadow-xl hover:shadow-[var(--color-blue-primary)]/40'
                }`}
              >
                {isLoading ? '처리 중...' : isClosed ? '인원 마감' : isJoinClosedByTime ? '참가 마감' : isMannerBlocked ? '참가 제한' : (() => {
                  if (group?.category === '축구' || (hasFee && feeAmount && feeAmount > 0)) {
                    const baseFee = group?.category === '축구' ? FOOTBALL_FEE_NORMAL : (feeAmount ?? 0);
                    const required = getRequiredPoints(baseFee, group?.category || '', groupMeetingDateTime);
                    return (
                      <>
                        <span>참가 신청하기</span>
                        <span className="font-bold">{required.toLocaleString()}P</span>
                      </>
                    );
                  }
                  return '참가 신청하기';
                })()}
              </button>
              {user && maxParticipants != null && participantCount >= maxParticipants && !isClosed && !isPastMatch && (
                <div className="flex gap-1.5">
                  {isUserOnWaitlist ? (
                    <>
                      <span className="flex-1 py-2 px-3 rounded-lg text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium flex items-center justify-center">예약 대기 ({waitlistPosition ?? 1}번째)</span>
                      <button type="button" onClick={handleRemoveWaitlist} disabled={isLoading} className="px-3 py-2 rounded-lg text-sm font-semibold border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50">취소</button>
                    </>
                  ) : (
                    <button type="button" onClick={handleAddWaitlist} disabled={isLoading} className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">예약 대기</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

      {/* 매치 리뷰 작성 모달 */}
      {group && showReviewModal && (
        <MatchReviewModal
          groupId={group.id}
          groupName={group.name}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* 플레이어 리뷰 모달 (플레이어 구하기 매치 호스트 전용) */}
      {group && showMercenaryReviewModal && (
        <MercenaryReviewModal
          groupId={group.id}
          groupName={group.name}
          isOpen={showMercenaryReviewModal}
          onClose={() => setShowMercenaryReviewModal(false)}
          onSubmitted={fetchGroupDetail}
        />
      )}

      {/* 호스트용 QR 인증 모달 */}
      {group && (
        <HostQRModal
          groupId={group.id}
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* 매치 수정 모달 */}
      {group && (
        <EditGroupModal
          groupId={group.id}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchGroupDetail}
        />
      )}

      {/* 참가자(매치장 포함) 상세 → 유저 프로필 모달 (2번 캡쳐와 동일) */}
      {selectedParticipant && (
        <UserDetailModal
          user={{
            id: selectedParticipant.user.id,
            nickname: selectedParticipant.user.nickname,
            tag: selectedParticipant.user.tag,
            profileImageUrl: selectedParticipant.user.profileImage ?? undefined,
            totalScore: selectedParticipant.user.totalScore,
          }}
          onClose={() => setSelectedParticipant(null)}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          showFollowButton={!!user && user.id !== selectedParticipant.userId}
        />
      )}

      {/* 참가비 결제 모달 — 포인트 결제 (축구는 항상, 그 외는 feeAmount 있을 때) */}
      {showPaymentModal && (group?.category === '축구' || (feeAmount != null && feeAmount > 0)) && (
        (() => {
          const baseFee = group?.category === '축구' ? FOOTBALL_FEE_NORMAL : (feeAmount ?? 0);
          const required = getRequiredPoints(baseFee, group?.category || '', groupMeetingDateTime);
          const myPoints = user?.points ?? 0;
          const canPay = myPoints >= required;
          const isEarlyDiscount = group?.category === '축구' && required === FOOTBALL_FEE_EARLY;
          return (
            <div className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center p-4">
              <div className="bg-[var(--color-bg-card)] rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">참가비 결제 (포인트)</h3>

                <div className="mb-6">
                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] mb-4">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">결제 포인트</div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {required.toLocaleString()}P
                    </div>
                    {isEarlyDiscount && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        매치 전일 이전 예약 2,000P 할인 적용
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] mb-4">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">보유 포인트</div>
                    <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {(user?.points ?? 0).toLocaleString()}P
                    </div>
                    {!canPay && (
                      <p className="text-xs text-red-500 mt-1">
                        포인트가 부족합니다. 리뷰 작성·시설 리뷰 등으로 적립하거나 충전해 주세요.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setPendingJoinPosition(null); setShowPaymentModal(false); }}
                    className="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
                  >
                    취소
                  </button>
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={!canPay || isLoading}
                    className="flex-1 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '처리 중...' : `${required.toLocaleString()}P 결제 및 참가`}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 전술 포지션 모달 — 새 매치 만들기(방장) 화면과 동일한 디자인 */}
      {showPositionModal && gameSettings?.gameType === 'team' && group?.category === '축구' && (() => {
        const withTeam = participants.map((p) => ({
          userId: p.userId,
          nickname: p.user.nickname,
          tag: p.user.tag,
          positionCode: p.positionCode ?? null,
          slotLabel: p.slotLabel ?? null,
          isCreator: p.userId === creatorId,
          team: p.team ?? 'red',
          profileImageUrl: getProfileImage(p.user.id, p.user.profileImage),
          rankScore: p.user.totalScore ?? null,
          positionWinRate: null as number | null,
        }));
        if (creatorId && creator && !withTeam.some((p) => p.userId === creatorId)) {
          const creatorScore = (creator as { totalScore?: number }).totalScore ?? participants.find((p) => p.userId === creatorId)?.user?.totalScore ?? null;
          withTeam.push({
            userId: creatorId,
            nickname: creator.nickname,
            tag: creator.tag,
            positionCode: null,
            slotLabel: null,
            isCreator: true,
            team: 'red',
            profileImageUrl: getProfileImage(creatorId, creator.profileImage ?? (creator as { profileImageUrl?: string | null }).profileImageUrl),
            rankScore: creatorScore,
            positionWinRate: null as number | null,
          });
        }
        const redList = withTeam.filter((p) => p.team === 'red').map(({ team: _t, ...rest }) => rest);
        const blueList = withTeam.filter((p) => p.team === 'blue').map(({ team: _t, ...rest }) => rest);
        const recruitPositions = gameSettings.positions?.length ? gameSettings.positions : ['GK', 'DF', 'MF', 'FW'];
        const currentList = positionModalTeam === 'red' ? redList : blueList;
        return (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/30"
            onClick={() => setShowPositionModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-modal-title"
          >
            <div
              className="relative w-full max-w-[92vw] max-h-[92vh] overflow-visible rounded-xl flex flex-col p-4 sm:p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] shadow-xl"
              style={{ maxWidth: 'min(92vw, 760px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="position-modal-title" className="text-sm font-semibold text-[var(--color-text-primary)]">
                  전술 포지션
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPositionModal(false)}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-colors"
                  aria-label="닫기"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                &quot;내 포지션&quot; 칩을 드래그해 빈 자리에 놓거나, 빈 포지션을 클릭하면 해당 팀·포지션으로 참가할 수 있습니다.
              </p>
              {/* 레드/블루 탭 — 새 매치 만들기와 동일한 스타일 */}
              <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-primary)] w-fit mb-4">
                <button
                  type="button"
                  onClick={() => setPositionModalTeam('red')}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: positionModalTeam === 'red' ? 'rgba(199,54,54,0.25)' : 'transparent',
                    color: positionModalTeam === 'red' ? '#fca5a5' : 'var(--color-text-secondary)',
                  }}
                >
                  레드팀
                </button>
                <button
                  type="button"
                  onClick={() => setPositionModalTeam('blue')}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: positionModalTeam === 'blue' ? 'rgba(59,108,184,0.25)' : 'transparent',
                    color: positionModalTeam === 'blue' ? '#93c5fd' : 'var(--color-text-secondary)',
                  }}
                >
                  블루팀
                </button>
              </div>
              {/* 구장 — 선수 카드 호버 툴팁이 잘리지 않도록 overflow-visible */}
              <div className="w-full rounded-xl overflow-visible border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] min-h-[340px] flex items-center justify-center">
                <FootballPitch
                  mode="match"
                  participants={currentList}
                  onSlotClick={(pos, _slotLabel) => handleSlotClickWithConfirm(pos, positionModalTeam)}
                  isUserParticipant={isParticipant}
                  recruitPositions={recruitPositions}
                  size="modal"
                  teamAccent={positionModalTeam}
                  enableDragDrop={!isParticipant && !!user}
                  dragItemLabel="내 포지션"
                  dragItemImageUrl={user ? getProfileImage(user.id, (user as { profileImage?: string | null }).profileImage ?? (user as { profileImageUrl?: string | null }).profileImageUrl) : null}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default GroupDetail;

