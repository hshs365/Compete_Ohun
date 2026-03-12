import React, { useState, useEffect, useMemo } from 'react';
import {
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import SportsStatisticsModal from './SportsStatisticsModal';
import MatchReviewModal from './MatchReviewModal';
import SportStatsRadar from './SportStatsRadar';
import { getEarnedTitles, getCountByCategory } from '../utils/titles';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { MAIN_CATEGORIES, SPORT_STATS_SPORTS, MIN_MATCHES_FOR_STATS } from '../constants/sports';

type ActivityItem = {
  id: number;
  name: string;
  category: string;
  meetingTime?: string | null;
  meetingDateTime?: string | null;
  location: string;
  participantCount: number;
  creator?: { nickname: string };
  /** 포지션 지정 매치 참가 시 선택한 포지션 (내 참가 목록에서만) */
  myPositionCode?: string | null;
  /** normal | rank | event (활동 카드 필터용) */
  type?: 'normal' | 'rank' | 'event';
  /** 랭크 매치 결과 (참가 목록에서만, myTeam 기반) */
  finalScoreRed?: number | null;
  finalScoreBlue?: number | null;
  myTeam?: 'red' | 'blue' | null;
};

const MyActivityPage = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [myParticipations, setMyParticipations] = useState<ActivityItem[]>([]);
  const [myCreations, setMyCreations] = useState<
    Array<Omit<ActivityItem, 'creator'>>
  >([]);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showStatsRadarModal, setShowStatsRadarModal] = useState(false);
  /** 모달에 표시할 종목 (축구, 풋살 등) */
  const [statsModalSport, setStatsModalSport] = useState<string>('축구');
  /** 종목별 스텟 API 응답 */
  const [sportStats, setSportStats] = useState<{
    stats: Record<string, number>;
    matchCount: number;
    overall: number;
    statKeys: string[];
    prevMonthStats?: Record<string, number>;
  } | null>(null);
  const [sportStatsLoading, setSportStatsLoading] = useState(false);
  /** 전체 | 축구 | 풋살 | ... (종목별 필터). 축구만 실제 데이터, 나머지는 없음 */
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  /** 대시보드용: 매너점수, 이번 달 활동 시간 */
  const [mannerScore, setMannerScore] = useState<number | null>(null);
  /** 리뷰 쓰기 모달: 열린 매치 { id, name } */
  const [reviewModalGroup, setReviewModalGroup] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!authUser) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [participations, creations] = await Promise.all([
          api.get<ActivityItem[]>('/api/groups/my-participations'),
          api.get<Array<Omit<ActivityItem, 'creator'>>>(
            '/api/groups/my-creations'
          ),
        ]);
        setMyParticipations(Array.isArray(participations) ? participations : []);
        setMyCreations(Array.isArray(creations) ? creations : []);
      } catch (error) {
        console.error('용병 기록 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, [authUser]);

  // 대시보드: 매너점수 (본인 프로필 요약)
  useEffect(() => {
    if (!authUser?.id) return;
    api
      .get<{ mannerScore?: number }>(`/api/users/${authUser.id}/profile-summary`)
      .then((res) => setMannerScore(res.mannerScore ?? null))
      .catch(() => setMannerScore(null));
  }, [authUser?.id]);

  // 획득 타이틀: 참여·생성 매치 종목별 횟수 기반 (일반 + 애호가/마스터)
  const earnedTitles = useMemo(() => {
    const countByCategory = getCountByCategory(myParticipations, myCreations);
    return getEarnedTitles(countByCategory);
  }, [myParticipations, myCreations]);

  // 필터 적용: 축구/풋살/농구/테니스 등 종목별 데이터
  const hasDataForCategory = (cat: string) => {
    if (cat === '전체') return true;
    return ['축구', '풋살', '농구', '테니스'].includes(cat);
  };

  const filteredParticipations = useMemo(() => {
    if (categoryFilter === '전체') return myParticipations;
    if (!hasDataForCategory(categoryFilter)) return [];
    return myParticipations.filter((g) => g.category === categoryFilter);
  }, [myParticipations, categoryFilter]);

  const filteredCreations = useMemo(() => {
    if (categoryFilter === '전체') return myCreations;
    if (!hasDataForCategory(categoryFilter)) return [];
    return myCreations.filter((g) => g.category === categoryFilter);
  }, [myCreations, categoryFilter]);

  /** 용병 활동 전체 목록 (참여 + 생성 통합, 일정순 정렬) */
  const allActivities = useMemo(() => {
    const participations = filteredParticipations.map((g) => ({ ...g, _activityType: 'participated' as const }));
    const creations = filteredCreations.map((g) => ({ ...g, _activityType: 'created' as const }));
    const merged = [...participations, ...creations];
    merged.sort((a, b) => {
      const aTime = a.meetingDateTime ?? a.meetingTime;
      const bTime = b.meetingDateTime ?? b.meetingTime;
      if (!aTime || !bTime) return 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    return merged;
  }, [filteredParticipations, filteredCreations]);

  /** 이번 달 누적 활동 시간 (참여+생성 매치 * 2시간 추정) */
  const thisMonthActivityHours = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const toDate = (g: ActivityItem) => {
      const raw = g.meetingTime ?? (g as any).meetingDateTime;
      if (!raw || typeof raw !== 'string') return null;
      const m = raw.match(/^\d{4}-\d{2}-\d{2}/);
      if (!m) return null;
      return new Date(m[0] + 'T12:00:00');
    };
    let count = 0;
    for (const g of [...myParticipations, ...myCreations]) {
      const d = toDate(g);
      if (!d) continue;
      if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) count++;
    }
    return count * 2; // 매치당 2시간 추정
  }, [myParticipations, myCreations]);

  /** 매치 날짜 짧은 형식 (2/12) */
  const matchDateShort = (g: ActivityItem) => {
    const raw = g.meetingTime ?? (g as any).meetingDateTime;
    if (!raw || typeof raw !== 'string') return '-';
    const m = raw.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
    if (!m) return '-';
    return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
  };

  /** 랭크 매치 결과: 승/무/패 (finalScoreRed, finalScoreBlue, myTeam 기반) */
  const getMatchResult = (g: ActivityItem): 'win' | 'draw' | 'loss' | null => {
    if (g.type !== 'rank') return null;
    const red = (g as any).finalScoreRed;
    const blue = (g as any).finalScoreBlue;
    const team = (g as any).myTeam;
    if (red == null || blue == null || !team) return null;
    const redWins = red > blue;
    const draw = red === blue;
    if (draw) return 'draw';
    const isRed = team === 'red';
    return (isRed && redWins) || (!isRed && !redWins) ? 'win' : 'loss';
  };

  /** 랭크 매치 결과 문자열 (예: 3:2 승) */
  const getMatchResultStr = (g: ActivityItem): string | null => {
    const result = getMatchResult(g);
    if (result == null) return null;
    const red = (g as any).finalScoreRed;
    const blue = (g as any).finalScoreBlue;
    if (red == null || blue == null) return result === 'win' ? '승' : result === 'loss' ? '패' : '무';
    const scoreStr = `${red}:${blue}`;
    return `${scoreStr} ${result === 'win' ? '승' : result === 'loss' ? '패' : '무'}`;
  };

  const meetingTimeDisplay = (g: ActivityItem) => {
    const raw = g.meetingTime ?? (g as any).meetingDateTime;
    if (!raw) return '일시 미정';
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const d = new Date(raw);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return String(raw);
  };

  const fetchSportStats = React.useCallback(async (sport: string) => {
    if (!authUser) return;
    setSportStatsLoading(true);
    try {
      const data = await api.get<{
        stats: Record<string, number>;
        matchCount: number;
        overall: number;
        statKeys: string[];
        prevMonthStats?: Record<string, number>;
      }>(`/api/users/me/sport-stats?sport=${encodeURIComponent(sport)}`);
      setSportStats(data);
    } catch {
      setSportStats(null);
    } finally {
      setSportStatsLoading(false);
    }
  }, [authUser]);

  // 내 스텟 모달 열릴 때 해당 종목 스텟 로드
  useEffect(() => {
    if (!showStatsRadarModal || !authUser) return;
    fetchSportStats(statsModalSport);
  }, [showStatsRadarModal, authUser, statsModalSport, fetchSportStats]);


  if (!authUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 w-full bg-[var(--color-bg-primary)] items-center justify-center min-h-[320px]">
        <LoadingSpinner fullScreen={false} message="용병 기록을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 배너 (스포츠용품 페이지와 동일 톤) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                용병 활동 내역
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2 max-w-2xl">
                참여·생성한 용병 활동과 획득한 타이틀을 한눈에 확인하세요.
              </p>
            </div>
          </div>
          {/* 대시보드 게이지: 이번 달 활동시간 + 매너등급 */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-xl">⏱</span>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">이번 달 누적 활동</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{thisMonthActivityHours}시간</p>
              </div>
            </div>
            {mannerScore != null && (() => {
              const config = getMannerGradeConfig(mannerScore);
              return (
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${config.bg} border ${config.border}`}>
                  <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">{config.label}</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="badge-text-contrast text-xl font-bold">{mannerScore}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">점 · {config.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          {earnedTitles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {earnedTitles.map((title) => (
                <span
                  key={title}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm shadow-sm"
                >
                  {title}
                </span>
              ))}
            </div>
          )}
          {/* 종목별 필터: 드롭다운 스타일 */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">종목별 보기</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('전체')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  categoryFilter === '전체'
                    ? 'bg-[var(--color-blue-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/40'
                }`}
              >
                전체
              </button>
              {MAIN_CATEGORIES.filter((c) => c !== '전체').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    categoryFilter === cat
                      ? 'bg-[var(--color-blue-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        <section className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-[var(--color-border-card)] bg-[var(--color-bg-primary)]/50">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {categoryFilter === '전체'
                ? '용병 기록'
                : `${categoryFilter} 용병 기록`}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {SPORT_STATS_SPORTS.includes(categoryFilter) && (
                <button
                  onClick={() => {
                    setStatsModalSport(categoryFilter);
                    setShowStatsRadarModal(true);
                  }}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white transition-colors text-sm"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  내 스텟 보기
                </button>
              )}
              <button
                onClick={() => setShowStatisticsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity text-sm shadow-sm"
              >
                <ChartBarIcon className="w-5 h-5" />
                {categoryFilter === '전체' ? '운동 통계 보기' : `${categoryFilter} 운동 통계`}
              </button>
            </div>
          </div>

          <div className="p-6">
            {!hasDataForCategory(categoryFilter) ? (
              <div className="py-16 text-center text-[var(--color-text-secondary)]">
                <FunnelIcon className="w-14 h-14 mx-auto mb-4 opacity-40" />
                <p className="font-medium text-[var(--color-text-primary)]">해당 종목의 용병 기록이 없습니다.</p>
                <p className="text-sm mt-1">용병 매치에 참여해 보세요.</p>
              </div>
            ) : (
              <>
                {/* 용병 활동 요약: 참여 N건 · 생성 N건 */}
                <div className="flex items-center gap-4 mb-6 px-1">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    참여 {filteredParticipations.length}건 · 생성 {filteredCreations.length}건
                  </span>
                </div>

                {/* 용병 활동 전체 목록 */}
                {allActivities.length > 0 ? (
                  <ul className="space-y-3">
                    {allActivities.map((g) => {
                      const activityKey = `${(g as { _activityType?: string })._activityType}-${g.id}`;
                        const result = getMatchResult(g);
                        const isRank = g.type === 'rank';
                        const resultStr = getMatchResultStr(g);
                        const leftBarColor =
                          result === 'win' ? 'bg-emerald-500' :
                          result === 'loss' ? 'bg-gray-500' : '';
                        return (
                          <li key={activityKey}>
                            <div
                              className={`w-full rounded-xl border transition-all flex overflow-hidden hover:shadow-md hover:border-[var(--color-blue-primary)]/20 ${
                                isRank && result === 'win' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                isRank && result === 'loss' ? 'bg-gray-500/5 border-gray-500/20' :
                                'bg-[var(--color-bg-primary)] border-[var(--color-border-card)]'
                              }`}
                            >
                              {leftBarColor ? (
                                <div className={`w-1 shrink-0 ${leftBarColor}`} style={{ minWidth: '4px' }} aria-hidden />
                              ) : null}
                              <div className="flex-1 min-w-0 py-4 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-[var(--color-text-primary)] truncate">{g.name}</div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-sm text-[var(--color-text-secondary)]">
                                    <span>{matchDateShort(g)}</span>
                                    <span>·</span>
                                    <span className="truncate max-w-[200px]">{g.location || '-'}</span>
                                    {resultStr && (
                                      <>
                                        <span>·</span>
                                        <span className={`font-medium ${result === 'win' ? 'text-emerald-600 dark:text-emerald-400' : result === 'loss' ? 'text-[var(--color-text-secondary)] dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                          {resultStr}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setReviewModalGroup({ id: g.id, name: g.name })}
                                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                  리뷰 쓰기
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                ) : (
                  <div className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--color-bg-secondary)] mb-6">
                      <UserGroupIcon className="w-12 h-12 text-[var(--color-text-secondary)] opacity-60" />
                    </div>
                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                      용병 활동 내역이 없습니다.
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                      용병 매치를 찾아 참가해 보거나, 직접 모임을 만들어 보세요.
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-8 px-8 py-4 rounded-xl text-lg font-bold bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-opacity shadow-lg"
                    >
                      용병 매치 찾아보기
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {showStatisticsModal && authUser?.id && (
        <SportsStatisticsModal
          userId={authUser.id}
          isOpen={showStatisticsModal}
          onClose={() => setShowStatisticsModal(false)}
          currentSport={categoryFilter !== '전체' ? categoryFilter : undefined}
        />
      )}

      {/* 종목별 스텟(레이더 차트) 모달 */}
      {showStatsRadarModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30"
          onClick={() => setShowStatsRadarModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stats-radar-modal-title"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
              <h3 id="stats-radar-modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                {statsModalSport} 스텟 (최근 20경기 평균, 1~10단계)
              </h3>
              <button
                type="button"
                onClick={() => setShowStatsRadarModal(false)}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="닫기"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {sportStatsLoading ? (
                <div className="py-12 text-center text-[var(--color-text-secondary)]">스텟을 불러오는 중...</div>
              ) : sportStats && sportStats.matchCount < MIN_MATCHES_FOR_STATS ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-4 opacity-50">📊</div>
                  <p className="text-[var(--color-text-primary)] font-medium">데이터 수집 중입니다</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    최소 {MIN_MATCHES_FOR_STATS}경기 이상 참여 후 스텟이 표시됩니다.
                    <br />
                    (현재 {sportStats.matchCount}경기)
                  </p>
                </div>
              ) : sportStats ? (
                <>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    최근 20경기 평균 기준, 전체 유저 대비 상대 평가(1~10)입니다. 매치 리뷰에서 동료들이 뽑아준 항목을 반영합니다.
                  </p>
                  <SportStatsRadar
                    stats={sportStats.stats}
                    statKeys={sportStats.statKeys}
                    overall={sportStats.overall}
                    prevMonthStats={sportStats.prevMonthStats}
                    height={340}
                    theme="dark"
                  />
                </>
              ) : (
                <div className="py-12 text-center text-[var(--color-text-secondary)]">스텟을 불러올 수 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 매치 리뷰 (선수/시설) 작성 모달 */}
      {reviewModalGroup && (
        <MatchReviewModal
          groupId={reviewModalGroup.id}
          groupName={reviewModalGroup.name}
          isOpen={!!reviewModalGroup}
          onClose={() => setReviewModalGroup(null)}
          onSubmitted={() => {
            setReviewModalGroup(null);
            if (SPORT_STATS_SPORTS.includes(categoryFilter)) {
              fetchSportStats(categoryFilter).catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
};

export default MyActivityPage;
