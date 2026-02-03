import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, UsersIcon, WrenchScrewdriverIcon, TrashIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, TrophyIcon, StarIcon, CurrencyDollarIcon, BuildingOfficeIcon, ClipboardDocumentCheckIcon, HeartIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import UserDetailModal from './UserDetailModal';
import FootballPitch from './FootballPitch';
import { showError, showSuccess, showInfo, showConfirm } from '../utils/swal';

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
  /** 매치 유형: normal 일반매치(매치장 진행), rank 랭크매치(심판 시스템) */
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
  } | null;
  referees?: Array<{
    id: number;
    userId: number;
    appliedAt: string;
    user: { id: number; nickname: string; tag?: string };
  }>;
  isUserReferee?: boolean;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onClose, onParticipantChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(group?.memberCount || 0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [creator, setCreator] = useState<{ id: number; nickname: string; tag?: string; profileImage?: string | null } | null>(null);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [hasFee, setHasFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState<number | null>(null);
  const [facility, setFacility] = useState<{ id: number; name: string; address: string; type: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPositionModal, setShowPositionModal] = useState(false);
  /** 전술 포지션 모달에서 보는 팀 (한 팀씩 크게 보기) */
  const [positionModalTeam, setPositionModalTeam] = useState<'red' | 'blue'>('red');
  /** 이미 활동이 끝난 매치 여부 (종료된 매치는 수정/삭제/마감 불가) */
  const [isPastMatch, setIsPastMatch] = useState(false);
  const [referees, setReferees] = useState<Array<{ id: number; userId: number; user: { id: number; nickname: string; tag?: string } }>>([]);
  const [isUserReferee, setIsUserReferee] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  /** 매치 유형: normal=일반(매치장 진행), rank=랭크(심판), event=이벤트 */
  const [groupType, setGroupType] = useState<'normal' | 'rank' | 'event'>('normal');

  useEffect(() => {
    if (group) {
      setParticipantCount(group.memberCount || 0);
      fetchGroupDetail();
    }
  }, [group]);

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
      
      // 매치 마감 상태 설정
      setIsClosed(groupData.isClosed || false);
      setMaxParticipants(groupData.maxParticipants || null);
      setIsCreator(user?.id === groupData.creatorId);
      setGameSettings(groupData.gameSettings || null);
      setHasFee(groupData.hasFee || false);
      setFeeAmount(groupData.feeAmount || null);
      setReferees(groupData.referees || []);
      setIsUserReferee(groupData.isUserReferee || false);
      setIsFavorited(groupData.isFavorited ?? false);
      setGroupType(groupData.type === 'rank' || groupData.type === 'event' ? groupData.type : 'normal');

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
          const facilityData = await api.get<{ id: number; name: string; address: string; type: string }>(
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
    } catch (error) {
      console.error('매치 상세 정보 조회 실패:', error);
    }
  };

  const handleJoin = async () => {
    if (!group || isLoading) return;

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      await showInfo('매치에 참가하려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return;
    }

    // 참가비가 있으면 결제 모달 표시
    if (hasFee && feeAmount && feeAmount > 0) {
      setShowPaymentModal(true);
      return;
    }

    // 참가비가 없으면 바로 참가
    await processJoin();
  };

  const handleJoinWithPosition = async (positionCode: string, team: 'red' | 'blue' = 'red'): Promise<boolean> => {
    if (!group || isLoading) return false;
    if (!user) {
      await showInfo('매치에 참가하려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return false;
    }
    if (hasFee && feeAmount && feeAmount > 0) {
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
      
      // 매치 마감 상태 설정
      setIsClosed(groupData.isClosed || false);
      setMaxParticipants(groupData.maxParticipants || null);
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
      setPaymentMethod('');
      
      // 성공 메시지 표시
      await showSuccess('매치에 참가했습니다!', '매치 참가');
      return true;
    } catch (error: any) {
      console.error('매치 참가 실패:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '매치 참가에 실패했습니다.';
      await showError(errorMessage, '매치 참가 실패');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!paymentMethod.trim()) {
      await showError('결제 수단을 선택해주세요.', '결제 수단 선택');
      return;
    }
    
    // 결제 처리 (향후 실제 결제 시스템 연동)
    await processJoin();
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
                  fallback.className = 'w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white font-semibold';
                  fallback.textContent = participant.user.nickname.charAt(0);
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white font-semibold">
              {participant.user.nickname.charAt(0)}
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
                  fallback.className = 'w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white font-semibold';
                  fallback.textContent = creator.nickname.charAt(0);
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--color-blue-primary)] flex items-center justify-center text-white font-semibold">
              {creator.nickname.charAt(0)}
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
      await showSuccess('팔로우했습니다.', '팔로우');
    } catch (err) {
      console.error('팔로우 실패:', err);
      await showError(err instanceof Error ? err.message : '팔로우에 실패했습니다.', '팔로우 실패');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await api.delete(`/api/users/follow/${userId}`);
      await showSuccess('언팔로우했습니다.', '언팔로우');
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
      showSuccess(res.favorited ? '찜 목록에 추가되었습니다.' : '찜이 해제되었습니다.');
    } catch (err) {
      console.error('찜 토글 실패:', err);
      showError('찜 처리에 실패했습니다.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <div className="group-detail-panel w-full min-w-0 flex-1 flex flex-col h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border-card)] shadow-xl">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 flex items-center justify-between z-10 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] truncate flex-1 min-w-0">{group.name}</h2>
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

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* 상태 배지 (상단 고정) */}
          {isClosed && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <LockClosedIcon className="w-5 h-5 text-red-500" />
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

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
              <MapPinIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </div>
              <span className="text-[var(--color-text-primary)] font-medium leading-relaxed">{group.location}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-lg">
                <UsersIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-text-primary)]">{participantCount}명</span>
                  {maxParticipants && (
                    <>
                      <span className="mx-1 text-[var(--color-text-secondary)]">/</span>
                      <span className="text-[var(--color-text-secondary)]">{maxParticipants}명</span>
                    </>
                  )}
                </span>
              </div>
              
              {group.category && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm">
                    {group.category}
                  </span>
              )}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="border-t border-[var(--color-border-card)] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">상세 정보</h3>
            </div>
            <div className="space-y-3">
              {group.description && (
                <p className="text-[var(--color-text-primary)] leading-relaxed">{group.description}</p>
              )}
              {group.meetingTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-secondary)]">매치 시간:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{group.meetingTime}</span>
                </div>
              )}
              {group.contact && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-secondary)]">문의:</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{group.contact}</span>
                </div>
              )}
            </div>
          </div>

          {/* 전술 포지션: 랭크/이벤트매치에서만 표시 (일반매치는 자유매치로 매치장 오더 하 진행) */}
          {groupType !== 'normal' && gameSettings?.gameType === 'team' && group.category === '축구' && (
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">전술 포지션</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                포지션 확인 버튼을 누르면 구장을 볼 수 있으며, 빈 자리를 클릭하면 해당 포지션으로 참가할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setShowPositionModal(true)}
                className="w-full py-3 px-4 rounded-lg border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] font-medium hover:bg-[var(--color-blue-primary)]/10 transition-colors flex items-center justify-center gap-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                포지션 확인
              </button>
            </div>
          )}

          {/* 랭크매치 전용: 게임 설정 (포지션 지정 등) */}
          {groupType === 'rank' && gameSettings && (
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">게임 설정</h3>
              </div>
              <div className="space-y-3">
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

          {/* 준비물 정보 */}
          {group.equipment && group.equipment.length > 0 && (
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <WrenchScrewdriverIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">준비물</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm font-medium rounded-lg border border-[var(--color-border-card)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 참가비 및 시설 정보 */}
          {(hasFee || facility) && (
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CurrencyDollarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">참가비 및 시설</h3>
              </div>
              <div className="space-y-3">
                {facility && (
                  <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
                    <div className="flex items-center gap-2 mb-2">
                      <BuildingOfficeIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">시설</span>
                    </div>
                    <div className="text-sm text-[var(--color-text-primary)] font-semibold">
                      {facility.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {facility.address}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {facility.type}
                    </div>
                  </div>
                )}
                {hasFee && feeAmount && feeAmount > 0 && (
                  <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
                    <div className="flex items-center gap-2 mb-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">참가비</span>
                    </div>
                    <div className="text-lg text-[var(--color-text-primary)] font-bold">
                      {feeAmount.toLocaleString()}원
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      참가 시 결제가 필요합니다.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 참가자 목록 (일반매치는 단일 목록, 랭크/이벤트 포지션 매치일 때만 레드/블루 구분) */}
          <div className="border-t border-[var(--color-border-card)] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                참가자 <span className="text-sm font-normal text-[var(--color-text-secondary)]">({participantCount}명)</span>
              </h3>
            </div>
            {groupType !== 'normal' && gameSettings?.gameType === 'team' ? (
              <div className="space-y-4">
                {/* 레드팀 */}
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
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
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
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

          {/* 랭크매치: 심판 신청 블록 | 일반/이벤트매치: 게임 설정·매치 진행 통합 (자유매치 + 심판 안내) */}
          {groupType === 'rank' ? (
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">심판</h3>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                경기 시작·종료 안내 및 결과 기록을 담당합니다. 심판은 경기에 참가할 수 없으며, 포인트가 지급됩니다.
              </p>
              {referees.length > 0 ? (
                <div className="space-y-2 mb-4">
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
                <p className="text-sm text-[var(--color-text-secondary)] py-2 mb-4">아직 심판 신청자가 없습니다.</p>
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
            <div className="border-t border-[var(--color-border-card)] pt-6">
              <div className="flex items-center gap-2 mb-3">
                <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">게임 설정 · 매치 진행</h3>
              </div>
              <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <p>
                  자유 매칭입니다. 인원이 모이면 매치장의 오더 아래 자유롭게 진행합니다.
                </p>
                <p>
                  심판은 3파전일 때는 돌아가면서 남는 팀 인원 중 한 명이 봐주고, 2파전에서는 남는 후보 선수 중 한 명이 봐주는 방식으로 진행됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 매치장 전용 제어 버튼 (이미 종료된 매치에서는 숨김) */}
          {isCreator && (
            <div className="border-t border-[var(--color-border-card)] pt-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">매치 관리</h3>
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

          {/* 액션 버튼 */}
          <div className="flex gap-2.5 pt-6 border-t border-[var(--color-border-card)]">
            {isCreator ? (
              <div className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-blue-500 rounded-lg font-semibold flex items-center justify-center gap-2">
                <StarIconSolid className="w-5 h-5" />
                <span>매치장</span>
              </div>
            ) : isParticipant ? (
              <button
                onClick={handleLeave}
                disabled={isLoading || isClosed}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '매치 나가기'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isLoading || isClosed}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isClosed
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md'
                }`}
              >
                {isLoading ? '처리 중...' : isClosed ? '인원 마감' : '참가하기'}
              </button>
            )}
            <button 
              onClick={handleShare}
              className="px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:bg-[var(--color-bg-card)] transition-colors border border-[var(--color-border-card)]"
            >
              공유하기
            </button>
        </div>
      </div>

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

      {/* 참가비 결제 모달 — 전술 포지션 모달보다 위에 표시 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">참가비 결제</h3>
            
            <div className="mb-6">
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] mb-4">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">결제 금액</div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {feeAmount?.toLocaleString()}원
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  결제 수단 선택
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                >
                  <option value="">결제 수단을 선택하세요</option>
                  <option value="card">신용카드</option>
                  <option value="bank">계좌이체</option>
                  <option value="kakao">카카오페이</option>
                  <option value="toss">토스페이</option>
                </select>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  💳 결제 시스템은 향후 실제 결제 게이트웨이와 연동 예정입니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                }}
                className="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
              >
                취소
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={!paymentMethod.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '결제 및 참가'}
              </button>
            </div>
          </div>
        </div>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60"
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
                빈 포지션을 클릭하면 해당 팀·포지션으로 참가할 수 있습니다.
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

