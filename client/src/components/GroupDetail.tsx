import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, UsersIcon, WrenchScrewdriverIcon, TrashIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, TrophyIcon, StarIcon, CurrencyDollarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ParticipantDetail from './ParticipantDetail';
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
  };
  status: string;
  joinedAt: string;
  isCreator?: boolean; // 매치장 여부
  isRanker?: boolean; // 랭커 여부
  rank?: number; // 랭킹 순위
  score?: number; // 활동 점수
  sportCategory?: string; // 운동 카테고리
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
  creator: {
    id: number;
    nickname: string;
    tag?: string; // 닉네임 태그
    profileImage?: string | null;
  };
  participants: Participant[];
  isUserParticipant?: boolean;
  isClosed?: boolean;
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
        const creatorWithImage = {
          ...groupData.creator,
          profileImage: getProfileImage(groupData.creator.id, groupData.creator.profileImage),
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
      
      // 모임 마감 상태 설정
      setIsClosed(groupData.isClosed || false);
      setMaxParticipants(groupData.maxParticipants || null);
      setIsCreator(user?.id === groupData.creatorId);
      setGameSettings(groupData.gameSettings || null);
      setHasFee(groupData.hasFee || false);
      setFeeAmount(groupData.feeAmount || null);
      
      // 시설 정보가 있으면 조회
      if (groupData.facilityId) {
        try {
          const facilityData = await api.get<{ id: number; name: string; address: string; type: string }>(
            `/api/facilities/${groupData.facilityId}`
          );
          setFacility(facilityData);
        } catch (error) {
          console.error('시설 정보 조회 실패:', error);
        }
      } else {
        setFacility(null);
      }
    } catch (error) {
      console.error('모임 상세 정보 조회 실패:', error);
    }
  };

  const handleJoin = async () => {
    if (!group || isLoading) return;

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
      await showInfo('모임에 참가하려면 로그인이 필요합니다.', '로그인 필요');
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

  const processJoin = async () => {
    if (!group || isLoading) return;

    setIsLoading(true);
    try {
      const updatedGroup = await api.post<GroupDetailData>(`/api/groups/${group.id}/join`);
      
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
        const creatorWithImage = {
          ...groupData.creator,
          profileImage: getProfileImage(groupData.creator.id, groupData.creator.profileImage),
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
      
      // 모임 마감 상태 설정
      setIsClosed(groupData.isClosed || false);
      setMaxParticipants(groupData.maxParticipants || null);
      
      // 참가 상태는 이미 true로 설정했으므로 유지 (isUserParticipant가 false여도 무시)
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
      
      // 결제 모달 닫기
      setShowPaymentModal(false);
      setPaymentMethod('');
      
      // 성공 메시지 표시
      await showSuccess('모임에 참가했습니다!', '모임 참가');
    } catch (error: any) {
      console.error('모임 참가 실패:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '모임 참가에 실패했습니다.';
      await showError(errorMessage, '모임 참가 실패');
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
      await showInfo('모임에서 나가려면 로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return;
    }

    const confirmed = await showConfirm('정말 모임에서 나가시겠습니까?', '모임 나가기');
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
          console.error('모임 상세 정보 새로고침 실패:', error);
          // 새로고침 실패해도 이미 상태는 업데이트되었으므로 무시
        }
      }, 500);
      
      // 성공 메시지 표시 (비동기로 처리하여 UI 블로킹 방지)
      setTimeout(() => {
        showSuccess('모임에서 나갔습니다.', '모임 나가기');
      }, 100);
    } catch (error: any) {
      console.error('모임 탈퇴 실패:', error);
      
      // 에러 메시지 추출
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          '모임 탈퇴에 실패했습니다.';
      
      await showError(errorMessage, '모임 탈퇴 실패');
      
      // 에러 발생 시 참가자 목록 다시 로드하여 상태 동기화
      try {
        await fetchGroupDetail();
      } catch (fetchError) {
        console.error('모임 상세 정보 새로고침 실패:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!group || isLoading) return;

    const confirmed = await showConfirm('정말 모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', '모임 삭제');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete(`/api/groups/${group.id}`);
      await showSuccess('모임이 삭제되었습니다.', '모임 삭제');
      onClose();
      
      // 부모 컴포넌트에 변경 알림
      if (onParticipantChange) {
        onParticipantChange();
      }
    } catch (error) {
      console.error('모임 삭제 실패:', error);
      await showError(error instanceof Error ? error.message : '모임 삭제에 실패했습니다.', '모임 삭제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseGroup = async () => {
    if (!group || isLoading) return;

    const confirmed = await showConfirm('모임 인원을 마감하시겠습니까? 다른 사용자는 참가할 수 없게 됩니다.', '모임 마감');
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
      console.error('모임 마감 실패:', error);
      await showError(error instanceof Error ? error.message : '모임 마감에 실패했습니다.', '모임 마감 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenGroup = async () => {
    if (!group || isLoading) return;

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
      console.error('모임 재개 실패:', error);
      await showError(error instanceof Error ? error.message : '모임 재개에 실패했습니다.', '모임 재개 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!group) return;

    try {
      // 현재 모임의 URL 생성 (현재 페이지 URL에 groupId 쿼리 파라미터 추가)
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('group', group.id.toString());
      const shareUrl = currentUrl.toString();
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      await showSuccess('모임 링크가 클립보드에 복사되었습니다!', '링크 복사');
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
        await showSuccess('모임 링크가 클립보드에 복사되었습니다!', '링크 복사');
      } catch (err) {
        await showInfo(`모임 링크: ${shareUrl}`, '링크 복사');
      }
      document.body.removeChild(textArea);
    }
  };

  if (!group) return null;

  return (
    <div className="group-detail-panel w-full md:w-[420px] bg-[var(--color-bg-card)] border-l border-[var(--color-border-card)] flex flex-col h-full shadow-xl">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 flex items-center justify-between z-10 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{group.name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
        </button>
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
                  <span className="text-[var(--color-text-secondary)]">모임 시간:</span>
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

          {/* 게임 설정 정보 */}
          {gameSettings && (
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

          {/* 참가자 목록 */}
          <div className="border-t border-[var(--color-border-card)] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                참가자 <span className="text-sm font-normal text-[var(--color-text-secondary)]">({participantCount}명)</span>
            </h3>
            </div>
            <div className="space-y-2">
              {/* 매치장 표시 */}
              {creator && (() => {
                const creatorProfileImage = getProfileImage(creator.id, creator.profileImage);
                // 매치장이 참가자 목록에 있는지 확인
                const creatorParticipant = participants.find(p => p.userId === creator.id);
                const isCreatorRanker = creatorParticipant?.user?.skillLevel === 'advanced';
                return (
                  <div 
                    onClick={() => {
                      if (creatorParticipant) {
                        setSelectedParticipant({
                          ...creatorParticipant,
                          isCreator: true,
                          isRanker: isCreatorRanker,
                          rank: isCreatorRanker ? (creatorParticipant.userId % 15) + 1 : undefined,
                          score: isCreatorRanker ? 5000 + (creatorParticipant.userId * 100) : undefined,
                          sportCategory: group?.category || '전체',
                        });
                      }
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
                            // 이미지 로드 실패 시 이니셜 표시
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
              })()}
              
              {/* 참가자 목록 (매치장 제외) - 레코드 존재 = 참가 */}
              {participants
                .filter((p) => p.userId !== creatorId)
                .map((participant) => {
                  const profileImage = getProfileImage(participant.user.id, participant.user.profileImage);
                  const isCurrentUser = user?.id === participant.userId;
                  const isRanker = participant.user?.skillLevel === 'advanced';
                  return (
                    <div 
                      key={participant.id}
                      onClick={() => {
                        setSelectedParticipant({
                          ...participant,
                          isCreator: false,
                          isRanker: isRanker,
                          rank: isRanker ? (participant.userId % 15) + 1 : undefined,
                          score: isRanker ? 5000 + (participant.userId * 100) : undefined,
                          sportCategory: group?.category || '전체',
                        });
                      }}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                        isRanker
                          ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-500/50 shadow-md'
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
                              // 이미지 로드 실패 시 이니셜 표시
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
                        {isRanker && (
                          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-0.5 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">🏆</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {participant.user.nickname}{participant.user.tag || ''}
                        </span>
                        {isRanker && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                            🏆 랭커
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                            나
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              
              {/* 매치장만 있고 다른 참가자가 없을 때 */}
              {creator && participants.filter((p) => p.userId !== creatorId).length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                  매치장 외 참가자가 없습니다.
                </p>
              )}
              
              {/* 매치장도 없고 참가자도 없을 때 */}
              {!creator && participants.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                  참가자가 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 매치장 전용 제어 버튼 */}
          {isCreator && (
            <div className="border-t border-[var(--color-border-card)] pt-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">모임 관리</h3>
              </div>
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
                  <span className="relative z-10">{isLoading ? '처리 중...' : '모임 삭제하기'}</span>
                </button>
              </div>
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
                {isLoading ? '처리 중...' : '모임 나가기'}
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

      {/* 참가자 상세 정보 모달 */}
      {selectedParticipant && (
        <ParticipantDetail
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {/* 참가비 결제 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
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
    </div>
  );
};

export default GroupDetail;

