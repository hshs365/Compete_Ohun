import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import GroupList from './GroupList';
import DateFilterChips from './DateFilterChips';
import { SPORT_ICONS, SPORT_CHIP_STYLES } from '../constants/sports';
import { getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getMannerTrustColors } from '../utils/mannerTrustColors';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { getUserCity, getCityCoordinates } from '../utils/locationUtils';
import type { SelectedGroup } from '../types/selected-group';
import MercenaryDetailDrawer from './MercenaryDetailDrawer';

interface ProfileSummary {
  mannerScore?: number;
  effectiveRanks?: Record<string, string>;
  rankMatchStats?: { totalGames: number; wins: number; losses: number; winRate: number };
}

interface MercenaryApplyTabProps {
  selectedRegion?: string;
  onRecruitFormOpen?: () => void;
  refreshTrigger?: number;
}

const MercenaryApplyTab: React.FC<MercenaryApplyTabProps> = ({
  selectedRegion: propSelectedRegion = '전체',
  onRecruitFormOpen,
  refreshTrigger: propRefreshTrigger = 0,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const selectedRegion = propSelectedRegion;
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const refreshTrigger = propRefreshTrigger + localRefreshTrigger;

  const userCoords = useMemo(() => {
    if (!user) return null;
    const userCity = getUserCity(user.id, { residenceAddress: user.residenceAddress, residenceSido: user.residenceSido });
    if (!userCity || userCity === '전체') return null;
    return getCityCoordinates(userCity);
  }, [user?.id, user?.residenceAddress, user?.residenceSido]);

  useEffect(() => {
    if (!user) return;
    api
      .get<ProfileSummary>(`/api/users/${user.id}/profile-summary`)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user?.id]);

  const mannerScore = profile?.mannerScore ?? user?.mannerScore ?? 80;
  const noShowCount = user?.noShowCount ?? 0;
  const trustColors = getMannerTrustColors(mannerScore, noShowCount);
  const totalGames = profile?.rankMatchStats?.totalGames ?? 0;
  const effectiveRanks = profile?.effectiveRanks ?? {};

  const handleParticipantChange = () => setLocalRefreshTrigger((prev) => prev + 1);

  const handleApplyClick = (group: SelectedGroup) => {
    setSelectedGroup(group);
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <UserCircleIcon className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
        <p className="text-[var(--color-text-secondary)] mb-4">로그인 후 용병 프로필을 확인할 수 있습니다.</p>
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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 내 용병 명함 카드 */}
      <section className="flex-shrink-0 p-4">
        <div
          className={`rounded-xl border p-4 ${trustColors.bg} ${trustColors.border}`}
          style={{ borderColor: trustColors.point + '50' }}
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">내 용병 명함</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5" style={{ color: trustColors.point }} />
              <span className={`font-bold ${trustColors.text}`}>{mannerScore}점</span>
              <span className="text-xs text-[var(--color-text-secondary)]">매너</span>
            </div>
            <div>
              <span className="font-bold text-[var(--color-text-primary)]">{totalGames}</span>
              <span className="text-xs text-[var(--color-text-secondary)] ml-1">경기</span>
            </div>
            {Object.keys(effectiveRanks).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
          </div>
        </div>
      </section>

      {/* 용병 요청 리스트 */}
      <section className="flex-shrink-0 px-4 pb-2">
        <DateFilterChips selectedDate={filterDate} onDateChange={setFilterDate} daysCount={14} />
      </section>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
        <GroupList
          selectedCategory={null}
          selectedRegion={selectedRegion}
          filterDate={filterDate ?? undefined}
          hideClosed={true}
          onGroupClick={handleApplyClick}
          refreshTrigger={refreshTrigger}
          matchType="general"
          userCoords={userCoords}
          mercenaryOnly={true}
          emptyStateSport="전체"
          onEmptyWriteClick={onRecruitFormOpen ? () => onRecruitFormOpen() : undefined}
        />
      </div>

      {selectedGroup && (
        <MercenaryDetailDrawer
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onParticipantChange={handleParticipantChange}
          pointColor="#8b5cf6"
        />
      )}
    </div>
  );
};

export default MercenaryApplyTab;
