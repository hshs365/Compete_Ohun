import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { PencilSquareIcon as PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import ExpandableQRCode from './ExpandableQRCode';
import ToggleSwitch from './ToggleSwitch';
import { SPORT_ICONS, SPORT_CHIP_STYLES, SPORT_POINT_COLORS } from '../constants/sports';
import { getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getMannerTrustColors } from '../utils/mannerTrustColors';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import ProfileAvatar from './ProfileAvatar';
import MercenaryProfileEditModal from './MercenaryProfileEditModal';
import AvailabilityScheduleManager from './AvailabilityScheduleManager';
import { showToast, showError } from '../utils/swal';

const MAIN_COLOR = '#22c55e'; // Mint/Green
const POINT_COLOR = '#6366f1'; // Purple/Indigo

interface ProfileSummary {
  mannerScore?: number;
  effectiveRanks?: Record<string, string>;
}

interface MyTeamItem {
  id: number;
  teamName: string;
  sport?: string;
  [key: string]: unknown;
}

const MercenaryJobseekerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [myTeams, setMyTeams] = useState<MyTeamItem[]>([]);

  useEffect(() => {
    if (!user) return;
    api
      .get<ProfileSummary>(`/api/users/${user.id}/profile-summary`)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    api
      .get<MyTeamItem[]>('/api/teams/me')
      .then((list) => setMyTeams(Array.isArray(list) ? list : []))
      .catch(() => setMyTeams([]));
  }, [user?.id]);

  const handleRefresh = () => {
    checkAuth();
  };

  const mannerScore = profile?.mannerScore ?? user?.mannerScore ?? 80;
  const noShowCount = user?.noShowCount ?? 0;
  const trustColors = getMannerTrustColors(mannerScore, noShowCount);
  const effectiveRanks = profile?.effectiveRanks ?? user?.effectiveRanks ?? user?.ohunRanks ?? {};
  const mainSports = user?.interestedSports ?? [];
  const sportPositions = user?.sportPositions ?? [];
  const sportEquipment = user?.sportEquipment ?? [];
  const activityStatus = user?.mercenaryActivityStatus ?? 'paused';
  const availability = user?.mercenaryAvailability ?? [];
  const activeBySport = user?.mercenaryActiveBySport ?? {};

  const hasProfile = mainSports.length > 0 || Object.keys(effectiveRanks).length > 0;

  /** 내정보에서 등록한 프로필 사진: API URL 우선, 없으면 localStorage (내정보 업로드 시 저장) */
  const profileImageUrl =
    user?.profileImageUrl ??
    (user?.id && typeof localStorage !== 'undefined' ? localStorage.getItem(`profileImage_${user.id}`) : null);

  const handleActivityStatusChange = async (next: 'active' | 'paused') => {
    try {
      await api.patch('/api/auth/me/mercenary-profile', {
        mercenaryActivityStatus: next,
      });
      showToast(
        next === 'active' ? '플레이어 활동이 활성화되었습니다. 구인자 검색에 노출됩니다.' : '플레이어 활동이 일시 중지되었습니다.',
        'success'
      );
      handleRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    }
  };

  const handleAvailabilitySave = async (
    next: Array<{ dayOfWeek: number; timeSlots: Array<{ start: string; end: string }> }>
  ) => {
    try {
      await api.patch('/api/auth/me/mercenary-profile', {
        mercenaryAvailability: next,
      });
      showToast('활동 시간표가 저장되었습니다.', 'success');
      handleRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    }
  };

  const handleSportActivityToggle = async (sport: string, active: boolean) => {
    try {
      const next = { ...activeBySport, [sport]: active };
      await api.patch('/api/auth/me/mercenary-profile', {
        mercenaryActiveBySport: next,
      });
      showToast(
        active ? `${sport} 플레이어 활동이 활성화되었습니다.` : `${sport} 플레이어 활동을 멈췄습니다.`,
        'success'
      );
      handleRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
        <UserCircleIcon className="w-20 h-20 text-[var(--color-text-secondary)] mb-6" />
        <p className="text-[var(--color-text-secondary)] text-center mb-6 px-4">로그인 후 플레이어 구직자 대시보드를 이용할 수 있습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-8 py-4 rounded-xl font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 min-h-[48px] touch-manipulation"
        >
          로그인
        </button>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
        <div className="max-w-sm w-full text-center">
          <div
            className="w-28 h-28 mx-auto flex items-center justify-center rounded-full mb-6"
            style={{ backgroundColor: `${MAIN_COLOR}25` }}
          >
            <UserCircleIcon className="w-14 h-14" style={{ color: MAIN_COLOR }} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 px-2">
            자신의 명함을 먼저 만들어보세요!
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 px-2">
            주력 종목, 실력 등급, 선호 포지션을 등록하면 구인자 검색에 노출됩니다.
          </p>
          <button
            type="button"
            onClick={() => setProfileEditOpen(true)}
            className="w-full py-4 px-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 min-h-[52px] touch-manipulation"
            style={{ backgroundColor: MAIN_COLOR }}
          >
            프로필 등록하기
          </button>
        </div>
        <MercenaryProfileEditModal
          isOpen={profileEditOpen}
          onClose={() => setProfileEditOpen(false)}
          user={user}
          onSuccess={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      {/* 내 명함 카드 — 컴팩트 명함 레이아웃, 8px 그리드 */}
      <section className="shrink-0 p-4 md:p-6">
        <div
          className="rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6 bg-emerald-50/90 dark:bg-emerald-900/15 shadow-md"
          style={{ borderLeftWidth: 4, borderLeftColor: trustColors.point }}
        >
          {/* 상단: 프로필 + 이름·주력 종목 강조 + 액션 버튼 */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div
                className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] border-2 flex items-center justify-center shadow-sm"
                style={{ borderColor: trustColors.point + '80' }}
              >
                <ProfileAvatar
                  profileImageUrl={profileImageUrl}
                  alt={user?.nickname ?? '프로필'}
                  className="w-full h-full object-cover"
                  iconClassName="w-8 h-8 md:w-10 md:h-10 text-[var(--color-text-secondary)]"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] truncate">
                  {user?.nickname ?? '내 명함'}
                </h1>
                {mainSports.length > 0 && (
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--sport-chip-text)' }}>
                    {mainSports[0]}
                    {mainSports.length > 1 && ` 외 ${mainSports.length - 1}종목`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setProfileEditOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 min-h-[44px] min-w-[44px] touch-manipulation shadow-sm"
                style={{ backgroundColor: MAIN_COLOR }}
                aria-label="명함 편집"
              >
                <PencilIcon className="w-5 h-5" />
                <span className="hidden sm:inline">편집</span>
              </button>
              <ExpandableQRCode
                value={typeof window !== 'undefined' ? `${window.location.origin}/mercenary-card/${user?.id ?? ''}` : ''}
                buttonLabel="QR 공유"
                caption="스캔하면 내 명함이 열려요"
                className="min-h-[44px] border-[var(--color-border-card)] bg-white dark:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          {/* 매너 점수 바 — 카드 전체 너비 사용 */}
          <div className="w-full py-4 border-t border-b border-[var(--color-border-card)]">
            {(() => {
              const mannerConfig = getMannerGradeConfig(mannerScore);
              const fillColor = mannerScore >= 60 ? '#22c55e' : mannerScore >= 20 ? '#eab308' : '#ef4444';
              return (
                <div className="w-full">
                  <div className="w-full h-3 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, mannerScore))}%`, backgroundColor: fillColor }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">{mannerScore}</span>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">{mannerConfig.label}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 종목별 급수·장비 — 슬림 블록 */}
          {(() => {
            const sportsWithData = Array.from(
              new Set([
                ...mainSports,
                ...Object.keys(effectiveRanks),
                ...sportEquipment.map((e) => e.sport),
              ])
            ).filter(Boolean);
            if (sportsWithData.length === 0) return null;
            return (
              <div className="space-y-3 pt-4">
                {sportsWithData.map((sport) => {
                  const grade = effectiveRanks[sport];
                  const equipment = sportEquipment.find((e) => e.sport === sport)?.equipment ?? [];
                  const sportColor = SPORT_POINT_COLORS[sport] ?? MAIN_COLOR;
                  const hasContent = grade || equipment.length > 0;
                  if (!hasContent) return null;
                  return (
                    <div key={sport} className="rounded-xl p-3 bg-white/70 dark:bg-white/5 border border-[var(--color-border-card)]">
                      <p className="text-xs font-semibold flex items-center gap-2 flex-wrap mb-2" style={{ color: 'var(--sport-chip-text)' }}>
                        <span>{SPORT_ICONS[sport] ?? '●'} {sport}</span>
                        {grade && (
                          <span
                            className="px-2 py-1 rounded-lg text-xs font-medium border"
                            style={{ borderColor: sportColor + '99', backgroundColor: sportColor + '15', color: 'var(--sport-chip-text)' }}
                          >
                            {getRankDisplayLabel(sport, grade)}
                          </span>
                        )}
                      </p>
                      {equipment.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {equipment.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-white/90 dark:bg-white/10"
                              style={{ borderColor: sportColor + '88', color: 'var(--sport-chip-text)' }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-text-secondary)]">준비물 등록 전</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {myTeams.length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-4 pt-3 border-t border-[var(--color-border-card)]">
              크루: {myTeams.map((t) => t.teamName).join(', ')}
            </p>
          )}
          {sportPositions.length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              선호 역할: {sportPositions.map((sp) => `${sp.sport} ${sp.positions.join(', ')}`).join(' / ')}
            </p>
          )}
        </div>
      </section>

      {/* 활동 가능 상태 — 토글 + 상단 인디케이터 + 슬림 리스트 카드, 8px 그리드 */}
      <section className="shrink-0 px-4 pb-4 md:px-6 md:pb-6">
        <div className="p-4 md:p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-sm">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
            활동 가능 상태
          </h3>

          {/* 현재 상태 인디케이터 */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--color-bg-secondary)]">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activityStatus === 'active' ? MAIN_COLOR : 'var(--color-text-secondary)' }}
              aria-hidden
            />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {activityStatus === 'active' ? '현재 매칭 가능' : '매칭 일시 중지'}
            </span>
            <span
              className="ml-1 p-1 rounded-full text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-fab)] min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              title="활동 중일 때만 구인자 검색에 노출됩니다. 멈춤 시 알림을 받지 않습니다."
              aria-label="활동 상태 안내"
            >
              <InformationCircleIcon className="w-5 h-5" />
            </span>
          </div>

          {/* 전체 활동 토글 (최소 44px 터치 영역) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 min-h-[44px]">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">전체 활동</span>
            <div className="min-h-[44px] flex items-center">
              <ToggleSwitch
                isOn={activityStatus === 'active'}
                handleToggle={() => handleActivityStatusChange(activityStatus === 'active' ? 'paused' : 'active')}
                label=""
              />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-center gap-1">
            <InformationCircleIcon className="w-4 h-4 shrink-0" />
            활동 중일 때만 구인자 검색에 노출됩니다. 멈춤 시 알림을 받지 않습니다.
          </p>

          {/* 종목별 활동 — 슬림 리스트 카드 */}
          {mainSports.length > 0 && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">종목별 활동 상태</p>
              <div className="space-y-2">
                {mainSports.map((sport) => {
                  const isActive = activeBySport[sport] !== false;
                  const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                  const disabled = activityStatus !== 'active';
                  return (
                    <div
                      key={sport}
                      className={`flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] min-h-[52px] touch-manipulation ${disabled ? 'opacity-60' : ''}`}
                    >
                      <span
                        className={`sport-chip-text inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border shrink-0 ${chip.bg} ${chip.border}`}
                        style={{ color: 'var(--sport-chip-text)' }}
                      >
                        {SPORT_ICONS[sport] ?? '●'} {sport}
                      </span>
                      <div className="flex rounded-xl p-1 bg-[var(--color-bg-secondary)] shrink-0">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && handleSportActivityToggle(sport, true)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] min-w-[72px] touch-manipulation ${
                            isActive ? 'text-white shadow-sm' : 'text-[var(--color-text-secondary)]'
                          }`}
                          style={isActive ? { backgroundColor: MAIN_COLOR } : undefined}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          활동
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && handleSportActivityToggle(sport, false)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium transition-all min-h-[44px] min-w-[72px] touch-manipulation ${
                            !isActive ? 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border-card)]' : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <XCircleIcon className="w-4 h-4" />
                          멈춤
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 활동 시간표 관리 */}
      <section className="shrink-0 px-4 pb-6 md:pb-8">
        <div className="p-4 md:p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">활동 가능 시간표</h3>
          <AvailabilityScheduleManager
            availability={availability}
            onSave={handleAvailabilitySave}
          />
        </div>
      </section>

      <MercenaryProfileEditModal
        isOpen={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        user={user}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default MercenaryJobseekerDashboard;
