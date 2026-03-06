import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { PencilSquareIcon as PencilIcon } from '@heroicons/react/24/outline';
import { SPORT_ICONS, SPORT_CHIP_STYLES } from '../constants/sports';
import { getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getMannerTrustColors } from '../utils/mannerTrustColors';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import MercenaryProfileEditModal from './MercenaryProfileEditModal';
import AvailabilityScheduleManager from './AvailabilityScheduleManager';
import { showSuccess, showError } from '../utils/swal';

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
  const activityStatus = user?.mercenaryActivityStatus ?? 'paused';
  const availability = user?.mercenaryAvailability ?? [];
  const activeBySport = user?.mercenaryActiveBySport ?? {};

  const hasProfile = mainSports.length > 0 || Object.keys(effectiveRanks).length > 0;

  const handleActivityStatusChange = async (next: 'active' | 'paused') => {
    try {
      await api.patch('/api/auth/me/mercenary-profile', {
        mercenaryActivityStatus: next,
      });
      await showSuccess(
        next === 'active' ? '용병 활동이 활성화되었습니다. 구인자 검색에 노출됩니다.' : '용병 활동이 일시 중지되었습니다.',
        '저장 완료'
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
      await showSuccess('활동 시간표가 저장되었습니다.', '저장 완료');
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
      await showSuccess(
        active ? `${sport} 용병 활동이 활성화되었습니다.` : `${sport} 용병 활동을 멈췄습니다.`,
        '저장 완료'
      );
      handleRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <UserCircleIcon className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <p className="text-[var(--color-text-secondary)] mb-4">로그인 후 용병 구직자 대시보드를 이용할 수 있습니다.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90"
        >
          로그인
        </button>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-sm w-full text-center">
          <div
            className="w-24 h-24 mx-auto flex items-center justify-center rounded-full mb-6"
            style={{ backgroundColor: `${POINT_COLOR}25` }}
          >
            <UserCircleIcon className="w-12 h-12" style={{ color: POINT_COLOR }} />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            자신의 용병 명함을 먼저 만들어보세요!
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            주력 종목, 실력 등급, 선호 포지션을 등록하면 구인자 검색에 노출됩니다.
          </p>
          <button
            type="button"
            onClick={() => setProfileEditOpen(true)}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* 내 용병 명함 카드 */}
      <section className="shrink-0 p-4">
        <div
          className={`rounded-2xl border-2 p-5 ${trustColors.bg} ${trustColors.border}`}
          style={{ borderColor: trustColors.point + '60' }}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              내 용병 명함
            </h3>
            <button
              type="button"
              onClick={() => setProfileEditOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: POINT_COLOR }}
            >
              <PencilIcon className="w-4 h-4" />
              편집
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            {/* 프로필 사진 */}
            <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] border-2 flex items-center justify-center" style={{ borderColor: trustColors.point + '60' }}>
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.nickname ?? '프로필'} className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-[var(--color-text-secondary)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {/* 매너 점수 - 카드 형태 (그린/옐로/레드) */}
                {(() => {
                  const mannerConfig = getMannerGradeConfig(mannerScore);
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${mannerConfig.bg} ${mannerConfig.border}`}>
                      <span className="text-lg" aria-hidden>{mannerConfig.icon}</span>
                      <div>
                        <span className={`font-bold ${mannerConfig.textColor}`}>{mannerScore}</span>
                        <span className="text-xs text-[var(--color-text-secondary)] ml-1">점 · {mannerConfig.label}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {mainSports.length > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">용병 가능 종목</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {mainSports.map((sport) => {
                  const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                  return (
                    <span
                      key={sport}
                      className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${chip.bg} ${chip.border} ${chip.text}`}
                    >
                      {SPORT_ICONS[sport] ?? '●'} {sport}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          {Object.keys(effectiveRanks).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs text-[var(--color-text-secondary)] w-full mb-1">종목별 등급</span>
              {Object.entries(effectiveRanks).map(([sport, grade]) => {
                const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                const displayGrade = getRankDisplayLabel(sport, grade);
                return (
                  <span
                    key={sport}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${chip.bg} ${chip.border} ${chip.text}`}
                  >
                    {SPORT_ICONS[sport] ?? ''} {displayGrade}
                  </span>
                );
              })}
            </div>
          )}
          {sportPositions.length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              선호 역할:{' '}
              {sportPositions
                .map((sp) => `${sp.sport} ${sp.positions.join(', ')}`)
                .join(' / ')}
            </p>
          )}
        </div>
      </section>

      {/* 용병 활동 가능 상태 (전체 + 종목별) */}
      <section className="shrink-0 px-4 pb-3">
        <div className="p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              용병 활동 가능 상태
            </span>
            <div className="flex rounded-full p-0.5 bg-[var(--color-bg-secondary)]">
              <button
                type="button"
                onClick={() => handleActivityStatusChange('active')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityStatus === 'active'
                    ? 'text-white shadow'
                    : 'text-[var(--color-text-secondary)]'
                }`}
                style={
                  activityStatus === 'active'
                    ? { backgroundColor: POINT_COLOR }
                    : undefined
                }
              >
                <CheckCircleIcon className="w-4 h-4" />
                전체 활동 중
              </button>
              <button
                type="button"
                onClick={() => handleActivityStatusChange('paused')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activityStatus === 'paused'
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] shadow'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <XCircleIcon className="w-4 h-4" />
                잠시 멈춤
              </button>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            활동 중일 때만 구인자 검색에 노출됩니다. 종목별로 특정 운동만 멈춤 설정할 수 있습니다.
          </p>

          {/* 종목별 활동 가능 상태 */}
          {mainSports.length > 0 && (
            <div className="border-t border-[var(--color-border-card)] pt-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                종목별 활동 상태
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                멈춤으로 둔 종목은 검색에 노출되지 않고, 용병 구하기 알림도 받지 않습니다.
              </p>
              <div className="space-y-2">
                {mainSports.map((sport) => {
                  const isActive = activeBySport[sport] !== false;
                  const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                  const disabled = activityStatus !== 'active';
                  return (
                    <div
                      key={sport}
                      className={`flex items-center justify-between py-2 border-b border-[var(--color-border-card)] last:border-0 ${disabled ? 'opacity-60' : ''}`}
                    >
                      <span className={`text-sm px-2 py-0.5 rounded-lg border ${chip.bg} ${chip.border} ${chip.text}`}>
                        {SPORT_ICONS[sport] ?? '●'} {sport}
                      </span>
                      <div className="flex rounded-full p-0.5 bg-[var(--color-bg-secondary)]">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && handleSportActivityToggle(sport, true)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
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
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
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
      <section className="shrink-0 px-4 pb-4">
        <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
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
