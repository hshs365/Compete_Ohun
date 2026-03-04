import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, MapPinIcon, ClockIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import NaverMap from './NaverMap';
import { useChat } from '../contexts/ChatContext';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { SPORT_ICONS, SPORT_POINT_COLORS } from '../constants/sports';
import { showError, showSuccess, showInfo, showConfirm } from '../utils/swal';
import type { MannerGradeConfig } from '../utils/mannerGrade';

interface MercenaryDetailDrawerProps {
  group: SelectedGroup | null;
  onClose: () => void;
  onParticipantChange?: (updated?: { id: number; participantCount: number }) => void;
  pointColor?: string;
}

/** 모집 급수/레벨 라벨 (sportSpecificData 키별) */
const LEVEL_LABELS: Record<string, Record<string, string>> = {
  skillLevel: {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
    '1': '1급(상)',
    '2': '2급(중상)',
    '3': '3급(중)',
    '4': '4급(중하)',
    '5': '5급(하)',
  },
  levelCategory: {
    A: 'A조',
    B: 'B조',
    C: 'C조',
    D: 'D조',
    E: 'E조',
  },
  matchType: {
    singles: '단식',
    men: '남자복식',
    women: '여자복식',
    mixed: '혼합복식',
    all: '상관없음',
  },
};

interface ParticipantUser {
  id: number;
  nickname: string;
  tag?: string | null;
  profileImageUrl?: string | null;
  profileImage?: string | null;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  mannerScore?: number;
}

interface ParticipantItem {
  id: number;
  userId: number;
  user: ParticipantUser;
}

interface GroupDetailData {
  id: number;
  location: string;
  meetingTime: string | null;
  meetingDateTime?: string | null;
  participantCount: number;
  /** 매치장 제외 참가자 수 (용병 구하기 등) */
  participantCountExcludingCreator?: number;
  maxParticipants?: number | null;
  creator?: { id: number; nickname: string; mannerScore?: number; noShowCount?: number };
  sportSpecificData?: Record<string, unknown> | null;
  contact?: string | null;
  isUserParticipant?: boolean;
  isClosed?: boolean;
  participants?: ParticipantItem[];
}

function formatMeetingTime(dt: string | null | undefined, meetingTime?: string | null): string {
  if (dt) {
    const d = new Date(dt);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = weekdays[d.getDay()];
    const h = d.getHours();
    const min = d.getMinutes();
    return `${m}/${day}(${w}) ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }
  if (meetingTime) {
    const match = meetingTime.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      const [, y, mo, d] = match;
      const date = new Date(Number(y), Number(mo) - 1, Number(d));
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      return `${Number(mo)}/${Number(d)}(${weekdays[date.getDay()]}) ${match[4]}:${match[5]}`;
    }
    return meetingTime;
  }
  return '-';
}

function getParticipantProfileImage(u: ParticipantUser): string | null {
  return u.profileImageUrl ?? u.profileImage ?? null;
}

function formatSkillLevelLabel(skillLevel?: string | null): string {
  if (!skillLevel) return '-';
  const map: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };
  return map[skillLevel] ?? skillLevel;
}

function formatSportLevel(category: string, sportSpecificData?: Record<string, unknown> | null): string {
  if (!sportSpecificData || typeof sportSpecificData !== 'object') return '-';
  const entries = Object.entries(sportSpecificData).filter(([, v]) => v != null && v !== '');
  const parts: string[] = [];
  for (const [key, val] of entries) {
    const labels = LEVEL_LABELS[key];
    if (labels && typeof val === 'string') {
      parts.push(labels[val] ?? val);
    } else if (Array.isArray(val) && val.length > 0) {
      const mapped = val.map((v) => labels?.[String(v)] ?? v).join(', ');
      parts.push(mapped);
    } else if (typeof val === 'string' && val) {
      parts.push(val);
    }
  }
  return parts.length > 0 ? parts.join(' · ') : '-';
}

const MercenaryDetailDrawer: React.FC<MercenaryDetailDrawerProps> = ({
  group,
  onClose,
  onParticipantChange,
  pointColor = '#8b5cf6',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChat } = useChat();
  const [detail, setDetail] = useState<GroupDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!group?.id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const res = await api.get<GroupDetailData>(`/api/groups/${group.id}`);
        if (!cancelled) setDetail(res);
      } catch {
        if (!cancelled) setDetail(null);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [group?.id]);

  const handleJoin = async () => {
    if (!group || !user) {
      showInfo('로그인이 필요합니다.', '로그인 필요');
      navigate('/login');
      return;
    }
    if (detail?.isUserParticipant) {
      showInfo('이미 참가한 매치입니다.', '알림');
      return;
    }
    if (detail?.isClosed) {
      showInfo('이미 마감된 매치입니다.', '마감');
      return;
    }
    setIsJoining(true);
    try {
      const updated = await api.post<{ participantCount?: number }>(`/api/groups/${group.id}/join`, {});
      await showSuccess('용병 참여 신청이 완료되었습니다!', '참여 완료');
      onParticipantChange?.(
        updated?.participantCount != null ? { id: group.id, participantCount: updated.participantCount } : undefined
      );
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const str = Array.isArray(msg) ? msg[0] : msg;
      showError(str ?? '참여 신청에 실패했습니다.', '실패');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    const ok = await showConfirm(
      '구인글을 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?',
      '구인글 삭제',
      '삭제',
      '취소',
    );
    if (!ok) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/groups/${group.id}`);
      await showSuccess('구인글이 삭제되었습니다.', '삭제 완료');
      onParticipantChange?.();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const str = Array.isArray(msg) ? msg[0] : msg;
      showError(str ?? '구인글 삭제에 실패했습니다.', '실패');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChatInquiry = () => {
    if (!user) {
      showInfo('로그인 후 채팅할 수 있습니다.', '로그인 필요');
      navigate('/login');
      return;
    }
    const creatorId = detail?.creator?.id ?? group?.creator?.id;
    const creatorNickname = detail?.creator?.nickname ?? group?.creator?.nickname ?? '매치장';
    const creatorManner = detail?.creator?.mannerScore ?? group?.creator?.mannerScore ?? 80;
    if (!creatorId) return;
    const meetingDt =
      detail?.meetingDateTime ??
      group?.parsedMeetingTime?.toISOString?.() ??
      null;
    openChat({
      groupId: group.id,
      creatorId,
      groupName: group.name,
      creatorNickname,
      creatorMannerScore: creatorManner,
      meetingDateTime: meetingDt,
    });
  };

  if (!group) return null;

  const loc = detail?.location ?? group.location;
  const meetingDisplay = formatMeetingTime(
    detail?.meetingDateTime ?? (group.parsedMeetingTime?.toISOString?.() ?? null),
    detail?.meetingTime ?? group.meetingTime
  );
  const memberCountRaw = detail?.participantCount ?? group.memberCount ?? 0;
  const maxCount = detail?.maxParticipants ?? group.maxParticipants;
  // 매치장 제외 참가자 수 (서버 participantCountExcludingCreator 우선, 없으면 participantCount - 1)
  const memberCount =
    detail?.participantCountExcludingCreator ?? Math.max(0, memberCountRaw - 1);
  const levelStr = formatSportLevel(group.category ?? '', detail?.sportSpecificData);
  const creatorManner = detail?.creator?.mannerScore ?? group.creator?.mannerScore ?? 80;
  const mannerConfig: MannerGradeConfig = getMannerGradeConfig(creatorManner);
  const canJoin = !detail?.isUserParticipant && !detail?.isClosed && user;
  const isCreator = Boolean(user && (user.id === detail?.creator?.id || user.id === group?.creator?.id));

  return (
    <>
      {/* 배경 오버레이 (블러 + 반투명) */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer 패널 (우측에서 슬라이드) */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[9999] w-full max-w-md flex flex-col shadow-2xl animate-drawer-slide-in"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,40,0.92) 0%, rgba(20,20,28,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <style>{`
          @keyframes drawer-slide-in {
            from { transform: translateX(100%); opacity: 0.8; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-drawer-slide-in { animation: drawer-slide-in 0.3s ease-out forwards; }
        `}</style>

        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white truncate pr-2">{group.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 종목 배지 */}
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{SPORT_ICONS[group.category ?? ''] ?? '🏃'}</span>
            <span className="text-sm font-semibold text-white/90">{group.category ?? '-'}</span>
          </div>

          {/* 장소 지점 */}
          <div className="rounded-xl p-3 bg-white/5 border border-white/10">
            <div className="flex items-start gap-2 mb-3">
              <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: pointColor }} />
              <div>
                <p className="text-xs text-white/60 mb-0.5">장소</p>
                <p className="text-sm font-medium text-white leading-relaxed">{loc || '-'}</p>
              </div>
            </div>
            {group.coordinates && group.coordinates[0] != null && group.coordinates[1] != null && !isNaN(group.coordinates[0]) && !isNaN(group.coordinates[1]) && (
              <div className="mt-2 rounded-lg overflow-hidden border border-white/10" style={{ height: '180px' }}>
                <NaverMap
                  center={[group.coordinates[0], group.coordinates[1]]}
                  zoom={10}
                  showCenterMarker={false}
                  showScaleControl={true}
                  markers={[{ lat: group.coordinates[0], lng: group.coordinates[1], name: group.name }]}
                />
              </div>
            )}
          </div>

          {/* 정확한 시간 */}
          <div className="rounded-xl p-3 bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 flex-shrink-0" style={{ color: pointColor }} />
              <div>
                <p className="text-xs text-white/60 mb-0.5">매치 시간</p>
                <p className="text-sm font-semibold text-white">{meetingDisplay}</p>
              </div>
            </div>
          </div>

          {/* 모집 급수/레벨 */}
          {levelStr !== '-' && (
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">모집 급수/레벨</p>
              <p className="text-sm font-medium text-white">{levelStr}</p>
            </div>
          )}

          {/* 참가자 현황 (프로필·급수·매너점수) */}
          <div className="rounded-xl p-3 bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="w-5 h-5 flex-shrink-0" style={{ color: pointColor }} />
              <div>
                <p className="text-xs text-white/60 mb-0.5">참가자</p>
                <p className="text-sm font-semibold text-white">
                  {memberCount}명{maxCount != null ? ` / ${maxCount}명` : ''}
                </p>
              </div>
            </div>
            {(() => {
              const participantsExcludingHost = (detail?.participants ?? []).filter(
                (p) => p.userId !== detail?.creator?.id,
              );
              return participantsExcludingHost.length > 0 ? (
              <div className="space-y-2">
                {participantsExcludingHost.map((p) => {
                  const isCreator = p.userId === detail?.creator?.id;
                  const imgUrl = getParticipantProfileImage(p.user);
                  const mannerScore = p.user.mannerScore ?? 80;
                  const mannerCfg = getMannerGradeConfig(mannerScore);
                  const skillLabel = formatSkillLevelLabel(p.user.skillLevel);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCreator ? 'bg-white/10 border border-white/20' : 'bg-white/5'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.user.nickname}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              const fallback = parent?.querySelector('.participant-fallback');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`participant-fallback w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white/20 ${
                            imgUrl ? 'hidden' : ''
                          }`}
                          style={{ backgroundColor: pointColor + '80' }}
                        >
                          {(p.user.nickname || '?').charAt(0)}
                        </div>
                        {isCreator && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                            style={{ backgroundColor: pointColor }}
                            title="매치장"
                          >
                            ★
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {p.user.nickname}
                          {p.user.tag ? (
                            <span className="text-white/60 ml-0.5">#{p.user.tag}</span>
                          ) : null}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {skillLabel !== '-' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/15 text-white/90">
                              {skillLabel}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${mannerCfg.badgeClass}`}
                          >
                            <span aria-hidden>{mannerCfg.icon}</span>
                            <span>{mannerScore}점</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/50 py-1">참가자가 없습니다.</p>
            );
            })()}
          </div>

          {/* 구인자 매너 점수 */}
          {group.creator && (
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1.5">매치장 신뢰도</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${mannerConfig.badgeClass}`}>
                <span aria-hidden>{mannerConfig.icon}</span>
                <span className={`font-bold ${mannerConfig.textColor}`}>{creatorManner}점</span>
                <span className="text-xs text-white/70">{mannerConfig.label}</span>
              </div>
              <p className="text-xs text-white/50 mt-1.5">
                {group.creator.nickname}
                {group.creator.tag ? ` #${group.creator.tag}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* 하단 고정 버튼 (모임 생성자: 삭제, 비생성자: 문의/참여) */}
        {isCreator ? (
          <div className="flex-shrink-0 p-4 pt-2 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/60 text-red-400 hover:bg-red-500/10"
            >
              {isDeleting ? '삭제 중...' : '구인글 삭제'}
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 p-4 pt-2 border-t border-white/10 bg-black/20 backdrop-blur-md space-y-2">
            <button
              type="button"
              onClick={handleChatInquiry}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-opacity hover:opacity-90"
              style={{ borderColor: pointColor, color: pointColor, backgroundColor: 'transparent' }}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              채팅으로 문의하기
            </button>
            <button
              type="button"
              onClick={handleJoin}
              disabled={!canJoin || isJoining}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: pointColor }}
            >
              {isJoining ? '신청 중...' : '용병 참여 신청'}
            </button>
            {!user && (
              <p className="text-center text-xs text-white/50">로그인 후 참여 신청이 가능합니다.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MercenaryDetailDrawer;
