import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, MapPinIcon, CalendarIcon, ClockIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import FootballStatsRadar from './FootballStatsRadar';

interface SportsStatisticsModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  /** 종목별 보기 시 선택된 종목 (축구, 풋살 등). 없으면 전체 통계 */
  currentSport?: string;
}

const FOOTBALL_STAT_KEYS = ['멘탈', '수비', '공격', '피지컬', '스피드', '테크닉'] as const;
const defaultFootballStats: Record<string, number> = Object.fromEntries(FOOTBALL_STAT_KEYS.map((k) => [k, 0]));

const SportsStatisticsModal: React.FC<SportsStatisticsModalProps> = ({ userId, isOpen, onClose, currentSport }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [footballStats, setFootballStats] = useState<Record<string, number>>(defaultFootballStats);
  const [footballStatsLoading, setFootballStatsLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    categoryStats: {} as Record<string, number>,
    regionStats: {} as Record<string, number>,
    monthlyStats: {} as Record<string, number>,
    weeklyStats: {} as Record<string, number>,
    timeStats: {} as Record<string, number>,
    matchTypeStats: {} as Record<string, number>,
    totalGroups: 0,
    totalParticipations: 0,
    favoriteCategory: '',
    favoriteRegion: '',
    favoriteTime: '',
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchStatistics();
    }
  }, [isOpen, userId]);

  // 내 스탯(매치 리뷰 기반) — 레이더 차트용
  useEffect(() => {
    if (!isOpen || !userId) return;
    setFootballStatsLoading(true);
    api
      .get<Record<string, number>>('/api/users/me/football-stats')
      .then((data) => setFootballStats((prev) => ({ ...defaultFootballStats, ...data })))
      .catch(() => setFootballStats(defaultFootballStats))
      .finally(() => setFootballStatsLoading(false));
  }, [isOpen, userId]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{
        matchTypeStats: Record<string, number>;
        monthlyStats: Record<string, number>;
        categoryStats: Record<string, number>;
        regionStats: Record<string, number>;
        weeklyStats: Record<string, number>;
        timeStats: Record<string, number>;
        totalParticipations: number;
        totalCreations: number;
        totalGroups: number;
      }>('/api/groups/my-activity-stats');

      const favoriteCategory = Object.entries(res.categoryStats || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';
      const favoriteRegion = Object.entries(res.regionStats || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';
      const favoriteTime = Object.entries(res.timeStats || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';

      setStatistics({
        categoryStats: res.categoryStats || {},
        regionStats: res.regionStats || {},
        monthlyStats: res.monthlyStats || {},
        weeklyStats: res.weeklyStats || {},
        timeStats: res.timeStats || {},
        totalGroups: res.totalGroups ?? 0,
        totalParticipations: res.totalParticipations ?? 0,
        favoriteCategory,
        favoriteRegion,
        favoriteTime,
        matchTypeStats: res.matchTypeStats || {},
      });
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
      onClick={handleOverlayClick}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] shadow-2xl overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
              <ChartBarIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">운동 통계</h2>
              <p className="text-white/90">나의 운동 활동을 한눈에 확인하세요</p>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">통계 데이터를 불러오는 중...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <TrophyIcon className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">총 참여 모임</h3>
                  </div>
                  <div className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {statistics.totalParticipations}개
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <FireIcon className="w-6 h-6 text-purple-500" />
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">선호 운동</h3>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text-primary)]">
                    {statistics.favoriteCategory}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPinIcon className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">주요 활동 지역</h3>
                  </div>
                  <div className="text-xl font-bold text-[var(--color-text-primary)]">
                    {statistics.favoriteRegion}
                  </div>
                </div>
              </div>

              {/* 매치 유형별 비율 (도넛 차트) */}
              {Object.keys(statistics.matchTypeStats || {}).length > 0 && (() => {
                const mt = statistics.matchTypeStats;
                const labels: Record<string, string> = {
                  participated_normal: '참여 일반매치',
                  participated_rank: '참여 랭크매치',
                  participated_event: '참여 이벤트매치',
                  created_normal: '생성 일반매치',
                  created_rank: '생성 랭크매치',
                  created_event: '생성 이벤트매치',
                };
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
                const entries = Object.entries(mt).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
                const total = entries.reduce((s, [, v]) => s + v, 0);
                let acc = 0;
                const circumference = 2 * Math.PI * 40;
                const segments = entries.map(([k, v], i) => {
                  const pct = total > 0 ? (v / total) * 100 : 0;
                  const start = acc;
                  acc += pct;
                  return { key: k, count: v, pct, start, color: colors[i % colors.length] };
                });
                return (
                  <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-blue-500" />
                      매치 유형별 비율
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="relative w-40 h-40 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {segments.map((s) => (
                            <circle
                              key={s.key}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={s.color}
                              strokeWidth="20"
                              strokeDasharray={`${(s.pct / 100) * circumference} ${circumference}`}
                              strokeDashoffset={`${-(s.start / 100) * circumference}`}
                              className="transition-all"
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-[var(--color-text-primary)]">{total}</span>
                          <span className="text-sm text-[var(--color-text-secondary)] ml-0.5">건</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {segments.map((s) => (
                          <div key={s.key} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-sm text-[var(--color-text-primary)] truncate">{labels[s.key] ?? s.key}</span>
                            <span className="text-sm font-bold text-[var(--color-text-primary)]">{s.count} ({Math.round(s.pct)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 운동 카테고리별 통계 */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-500" />
                  운동 카테고리별 참여
                </h3>
                {Object.keys(statistics.categoryStats).length === 0 ? (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">
                    참여한 모임이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(statistics.categoryStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => {
                        const total = Object.values(statistics.categoryStats).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">
                                  {count}회
                                </span>
                                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* 지역별 통계 */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-green-500" />
                  지역별 활동
                </h3>
                {Object.keys(statistics.regionStats).length === 0 ? (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">
                    지역별 통계 데이터가 없습니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(statistics.regionStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([region, count]) => (
                        <div
                          key={region}
                          className="p-3 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {region}
                            </span>
                            <span className="text-lg font-bold text-[var(--color-text-primary)]">
                              {count}회
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* 요일별 통계 */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  요일별 활동
                </h3>
                {Object.keys(statistics.weeklyStats).length === 0 ? (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">
                    요일별 통계 데이터가 없습니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day) => {
                      const count = statistics.weeklyStats[day] || 0;
                      const maxCount = Math.max(...Object.values(statistics.weeklyStats), 1);
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={day} className="flex flex-col items-center">
                          <div className="w-full bg-[var(--color-bg-secondary)] rounded-t-lg h-32 flex items-end">
                            <div
                              className="w-full bg-gradient-to-t from-purple-500 to-purple-600 rounded-t-lg transition-all"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <div className="mt-2 text-center">
                            <div className="text-lg font-bold text-[var(--color-text-primary)]">
                              {count}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{day}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 시간대별 통계 */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-orange-500" />
                  시간대별 활동
                </h3>
                {Object.keys(statistics.timeStats).length === 0 ? (
                  <p className="text-[var(--color-text-secondary)] text-center py-4">
                    시간대별 통계 데이터가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(statistics.timeStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([timeSlot, count]) => {
                        const total = Object.values(statistics.timeStats).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={timeSlot} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                {timeSlot}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--color-text-secondary)]">
                                  {count}회
                                </span>
                                <span className="text-sm font-bold text-[var(--color-text-primary)]">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* 월별 통계 */}
              {Object.keys(statistics.monthlyStats).length > 0 && (
                <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    월별 활동 추이
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(statistics.monthlyStats)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([month, count]) => (
                        <div
                          key={month}
                          className="flex items-center justify-between p-2 bg-[var(--color-bg-card)] rounded-lg"
                        >
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {month}
                          </span>
                          <span className="text-sm font-bold text-[var(--color-text-primary)]">
                            {count}회
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportsStatisticsModal;
