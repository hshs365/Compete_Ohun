import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { PencilSquareIcon as PencilIcon } from '@heroicons/react/24/outline';
import ExpandableQRCode from './ExpandableQRCode';
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

const POINT_COLOR = '#22c55e';

interface ProfileSummary {
  mannerScore?: number;
  effectiveRanks?: Record<string, string>;
}

const MercenaryJobseekerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<ProfileSummary>(`/api/users/${user.id}/profile-summary`)
      .then(setProfile)
      .catch(() => setProfile(null));
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
            style={{ backgroundColor: `${POINT_COLOR}25` }}
          >
            <UserCircleIcon className="w-14 h-14" style={{ color: POINT_COLOR }} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 px-2">
            자신의 플레이어 명함을 먼저 만들어보세요!
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 px-2">
            주력 종목, 실력 등급, 선호 포지션을 등록하면 구인자 검색에 노출됩니다.
          </p>
          <button
            type="button"
            onClick={() => setProfileEditOpen(true)}
            className="w-full py-4 px-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 min-h-[52px] touch-manipulation"
            style={{ backgroundColor: POINT_COLOR }}
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
      {/* 내 플레이어 명함 카드 — 화이트모드: 부드러운 중성 배경, 뱃지는 명함과 구분 */}
      <section className="shrink-0 p-4 md:p-5">
        <div
          className="rounded-2xl border-2 border-l-4 p-5 md:p-6 bg-slate-50/95 dark:bg-emerald-900/20 border-slate-200/90 dark:border-emerald-500/30"
          style={{ borderLeftColor: trustColors.point }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--color-text-secondary)]">
              내 플레이어 명함
            </h3>
            <button
              type="button"
              onClick={() => setProfileEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] touch-manipulation border border-[var(--color-border-card)] bg-[var(--color-bg-primary)]"
              style={{ color: POINT_COLOR }}
            >
              <PencilIcon className="w-4 h-4" />
              편집
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] border-2 flex items-center justify-center" style={{ borderColor: trustColors.point + '60' }}>
              <ProfileAvatar
                profileImageUrl={profileImageUrl}
                alt={user?.nickname ?? '프로필'}
                className="w-full h-full object-cover"
                iconClassName="w-12 h-12 text-[var(--color-text-secondary)]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {(() => {
                  const mannerConfig = getMannerGradeConfig(mannerScore);
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${mannerConfig.bg} ${mannerConfig.border} min-h-[44px]`}>
                      <span className="text-xl" aria-hidden>{mannerConfig.icon}</span>
                      <div>
                        <span className="badge-text-contrast text-lg font-bold">{mannerScore}</span>
                        <span className="badge-text-contrast text-sm ml-1 opacity-90">점 · {mannerConfig.label}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {mainSports.length > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)] mb-2">플레이어 가능 종목</p>
              )}
              <div className="flex flex-wrap gap-2">
                {mainSports.map((sport) => {
                  const sportColor = SPORT_POINT_COLORS[sport] ?? POINT_COLOR;
                  return (
                    <span
                      key={sport}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white/95 dark:bg-white/10 shadow-sm text-[var(--color-text-primary)]"
                      style={{ borderColor: sportColor + '99' }}
                    >
                      {SPORT_ICONS[sport] ?? '●'} {sport}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          {Object.keys(effectiveRanks).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-[var(--color-text-secondary)] w-full">종목별 등급</span>
              {Object.entries(effectiveRanks).map(([sport, grade]) => {
                const rankBadgeColor = SPORT_POINT_COLORS[sport] ?? POINT_COLOR;
                const displayGrade = getRankDisplayLabel(sport, grade);
                return (
                  <span
                    key={sport}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white/95 dark:bg-white/10 shadow-sm text-[var(--color-text-primary)]"
                    style={{ borderColor: rankBadgeColor + '99' }}
                  >
                    {SPORT_ICONS[sport] ?? ''} {displayGrade}
                  </span>
                );
              })}
            </div>
          )}
          {sportPositions.length > 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-card)]">
              선호 역할: {sportPositions.map((sp) => `${sp.sport} ${sp.positions.join(', ')}`).join(' / ')}
            </p>
          )}
          {sportEquipment.length > 0 && (
            <div className="pt-4 mt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">종목별 보유 장비</p>
              <div className="space-y-2">
                {sportEquipment.map(({ sport, equipment }) =>
                  equipment.length > 0 ? (
                    <p key={sport} className="text-sm text-[var(--color-text-primary)]">
                      {SPORT_ICONS[sport] ?? '●'} {sport}: {equipment.join(', ')}
                    </p>
                  ) : null
                )}
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[var(--color-border-card)] flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">QR로 명함 공유</p>
              <p className="text-sm text-[var(--color-text-primary)]">스캔하면 내 플레이어 명함이 열려요</p>
            </div>
            <div className="shrink-0">
              <ExpandableQRCode
                value={typeof window !== 'undefined' ? `${window.location.origin}/mercenary-card/${user?.id ?? ''}` : ''}
                size={80}
                caption="스캔하면 내 플레이어 명함이 열려요"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 플레이어 활동 가능 상태 — 모바일에서 세로 배치·터치 영역 확대 */}
      <section className="shrink-0 px-4 pb-4">
        <div className="p-4 md:p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
            플레이어 활동 가능 상태
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <p className="text-sm text-[var(--color-text-secondary)] sm:order-2 sm:flex-1">
              활동 중일 때만 구인자 검색에 노출됩니다.
            </p>
            <div className="flex rounded-xl p-1 bg-[var(--color-bg-secondary)] w-full sm:w-auto sm:min-w-[240px]">
              <button
                type="button"
                onClick={() => handleActivityStatusChange('active')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] touch-manipulation ${
                  activityStatus === 'active' ? 'text-white shadow' : 'text-[var(--color-text-secondary)]'
                }`}
                style={activityStatus === 'active' ? { backgroundColor: POINT_COLOR } : undefined}
              >
                <CheckCircleIcon className="w-5 h-5" />
                전체 활동 중
              </button>
              <button
                type="button"
                onClick={() => handleActivityStatusChange('paused')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] touch-manipulation ${
                  activityStatus === 'paused' ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] shadow' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <XCircleIcon className="w-5 h-5" />
                잠시 멈춤
              </button>
            </div>
          </div>

          {mainSports.length > 0 && (
            <div className="border-t border-[var(--color-border-card)] pt-4">
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">종목별 활동 상태</p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                멈춤으로 둔 종목은 검색에 노출되지 않고, 플레이어 구하기 알림도 받지 않습니다.
              </p>
              <div className="space-y-3">
                {mainSports.map((sport) => {
                  const isActive = activeBySport[sport] !== false;
                  const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                  const disabled = activityStatus !== 'active';
                  return (
                    <div
                      key={sport}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-[var(--color-border-card)] last:border-0 ${disabled ? 'opacity-60' : ''}`}
                    >
                      <span className={`badge-text-contrast inline-flex items-center w-fit px-3 py-1.5 rounded-lg text-sm font-medium border ${chip.bg} ${chip.border}`}>
                        {SPORT_ICONS[sport] ?? '●'} {sport}
                      </span>
                      <div className="flex rounded-xl p-1 bg-[var(--color-bg-secondary)] w-full sm:w-auto sm:min-w-[180px]">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && handleSportActivityToggle(sport, true)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
                            isActive ? 'text-white shadow' : 'text-[var(--color-text-secondary)]'
                          }`}
                          style={isActive ? { backgroundColor: POINT_COLOR } : undefined}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          활동 중
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && handleSportActivityToggle(sport, false)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
                            !isActive ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] shadow' : 'text-[var(--color-text-secondary)]'
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
