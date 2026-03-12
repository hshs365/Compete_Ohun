import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { SPORT_ICONS, SPORT_CHIP_STYLES, SPORT_POINT_COLORS } from '../constants/sports';
import { getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { showError } from '../utils/swal';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const POINT_COLOR = '#22c55e';

interface MercenaryCardData {
  id: number;
  nickname: string;
  tag: string | null;
  profileImageUrl: string | null;
  mannerScore: number;
  interestedSports: string[];
  effectiveRanks?: Record<string, string>;
  sportPositions: Array<{ sport: string; positions: string[] }>;
  sportEquipment?: Array<{ sport: string; equipment: string[] }>;
  mercenaryAvailability: Array<{ dayOfWeek: number; timeSlots: Array<{ start: string; end: string }> }>;
  mercenaryActiveBySport: Record<string, boolean>;
  mercenaryActivityStatus: 'active' | 'paused';
  isFollowing?: boolean;
}

const MercenaryCardPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [card, setCard] = useState<MercenaryCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('잘못된 경로입니다.');
      setLoading(false);
      return;
    }
    const id = parseInt(userId, 10);
    if (Number.isNaN(id)) {
      setError('잘못된 사용자입니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<MercenaryCardData>(`/api/users/${id}/mercenary-card`)
      .then(setCard)
      .catch((e) => {
        setError(e?.message ?? '명함 정보를 불러오지 못했습니다.');
        setCard(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!card || !currentUser || currentUser.id === card.id) return;
    setFollowLoading(true);
    try {
      if (card.isFollowing) {
        await api.delete(`/api/users/follow/${card.id}`);
        setCard((prev) => (prev ? { ...prev, isFollowing: false } : null));
      } else {
        await api.post(`/api/users/follow/${card.id}`);
        setCard((prev) => (prev ? { ...prev, isFollowing: true } : null));
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : '팔로우 처리에 실패했습니다.', '오류');
    } finally {
      setFollowLoading(false);
    }
  };

  const goLogin = () => {
    navigate('/login', { state: { returnTo: `/mercenary-card/${userId}` }, replace: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-10 h-10 border-2 border-[var(--color-blue-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)]">
        <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-primary)]">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-secondary)]" aria-label="뒤로">
            <ChevronLeftIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">플레이어 명함</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <p className="text-[var(--color-text-secondary)] text-center">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 rounded-xl font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  const mannerConfig = getMannerGradeConfig(card.mannerScore);
  const isActive = card.mercenaryActivityStatus === 'active';
  const activeSports =
    card.interestedSports.filter((s) => card.mercenaryActiveBySport[s] !== false) ?? card.interestedSports;
  const displaySports = isActive && activeSports.length > 0 ? activeSports : card.interestedSports;

  const availabilityTexts: string[] = [];
  card.mercenaryAvailability
    .sort((a, b) => (a.dayOfWeek + 6) % 7 - (b.dayOfWeek + 6) % 7)
    .forEach((day) => {
      const dayLabel = DAY_LABELS[day.dayOfWeek];
      day.timeSlots.forEach((slot) => {
        availabilityTexts.push(`${dayLabel} ${slot.start}–${slot.end}`);
      });
    });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-primary)]">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-bg-secondary)]" aria-label="뒤로">
          <ChevronLeftIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">플레이어 명함</h1>
      </header>

      <main className="flex-1 px-4 pt-6 max-w-lg mx-auto w-full">
        <div className="rounded-2xl border-2 border-l-4 p-5 bg-[var(--color-bg-card)] border-[var(--color-border-card)] shadow-sm" style={{ borderLeftColor: POINT_COLOR }}>
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] border-2 flex items-center justify-center" style={{ borderColor: POINT_COLOR + '60' }}>
              <ProfileAvatar
                profileImageUrl={card.profileImageUrl}
                alt={card.nickname}
                className="w-full h-full object-cover"
                iconClassName="w-14 h-14 text-[var(--color-text-secondary)]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                {card.nickname}
                {card.tag && <span className="font-normal text-[var(--color-text-secondary)] ml-1">{card.tag}</span>}
              </h2>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border mt-2 ${mannerConfig.bg} ${mannerConfig.border}`}>
                <span className="text-xl" aria-hidden>{mannerConfig.icon}</span>
                <div>
                  <span className="badge-text-contrast text-lg font-bold">{card.mannerScore}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] ml-1">점 · {mannerConfig.label}</span>
                </div>
              </div>
            </div>
          </div>

          {displaySports.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">활동 중인 운동</p>
              <div className="flex flex-wrap gap-2">
                {displaySports.map((sport) => {
                  const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                  return (
                    <span
                      key={sport}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${chip.bg} ${chip.border} ${chip.text}`}
                    >
                      {SPORT_ICONS[sport] ?? '●'} {sport}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {availabilityTexts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">활동 가능 시간대</p>
              <p className="text-sm text-[var(--color-text-primary)]">
                {availabilityTexts.join(', ')}
              </p>
            </div>
          )}

          {card.effectiveRanks && Object.keys(card.effectiveRanks).length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">종목별 등급</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(card.effectiveRanks).map(([sport, grade]) => {
                  const rankBadgeColor = SPORT_POINT_COLORS[sport] ?? POINT_COLOR;
                  const displayGrade = getRankDisplayLabel(sport, grade);
                  return (
                    <span
                      key={sport}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                      style={{ borderColor: rankBadgeColor + '99' }}
                    >
                      {SPORT_ICONS[sport] ?? ''} {displayGrade}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {card.sportPositions.length > 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-card)]">
              선호 역할: {card.sportPositions.map((sp) => `${sp.sport} ${sp.positions.join(', ')}`).join(' / ')}
            </p>
          )}
          {card.sportEquipment && card.sportEquipment.length > 0 && (
            <div className="pt-4 mt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">종목별 보유 장비</p>
              <div className="space-y-3">
                {card.sportEquipment.map(({ sport, equipment }) =>
                  equipment.length > 0 ? (
                    <div key={sport}>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{SPORT_ICONS[sport] ?? '●'} {sport} · </span>
                      <span className="text-sm text-[var(--color-text-secondary)]">{equipment.join(', ')}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          {currentUser && currentUser.id !== card.id ? (
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                card.isFollowing
                  ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                  : 'text-white'
              } ${followLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={!card.isFollowing ? { backgroundColor: POINT_COLOR } : undefined}
            >
              {followLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : card.isFollowing ? (
                <>
                  <UserMinusIcon className="w-5 h-5" />
                  언팔로우
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  팔로우하기
                </>
              )}
            </button>
          ) : !currentUser ? (
            <button
              type="button"
              onClick={goLogin}
              className="w-full py-3 rounded-xl font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] flex items-center justify-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              로그인하면 팔로우할 수 있어요
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default MercenaryCardPage;
