import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, MapPinIcon, CalendarIcon, ClockIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { SPORTS_LIST } from '../constants/sports';
import { extractCityFromAddress } from '../utils/locationUtils';
import FootballStatsRadar from './FootballStatsRadar';

interface SportsStatisticsModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface GroupData {
  id: number;
  category: string;
  location: string;
  meetingTime: string | null;
  participantCount: number;
  createdAt: string;
}

const FOOTBALL_STAT_KEYS = ['멘탈', '수비', '공격', '피지컬', '스피드', '테크닉'] as const;
const defaultFootballStats: Record<string, number> = Object.fromEntries(FOOTBALL_STAT_KEYS.map((k) => [k, 0]));

const SportsStatisticsModal: React.FC<SportsStatisticsModalProps> = ({ userId, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [footballStats, setFootballStats] = useState<Record<string, number>>(defaultFootballStats);
  const [footballStatsLoading, setFootballStatsLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    categoryStats: {} as Record<string, number>,
    regionStats: {} as Record<string, number>,
    monthlyStats: {} as Record<string, number>,
    weeklyStats: {} as Record<string, number>,
    timeStats: {} as Record<string, number>,
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
      
      // 사용자가 참여한 모든 모임 가져오기
      // TODO: 백엔드에 사용자별 모임 조회 API가 있으면 사용
      const allGroupsResponse = await api.get<{ groups: GroupData[]; total: number }>('/api/groups?limit=1000');
      const allGroups = allGroupsResponse.groups || [];

      // 사용자가 참여한 모임 필터링 (병렬 처리로 성능 개선)
      const userGroupsPromises = allGroups.slice(0, 100).map(async (group) => {
        try {
          const groupDetail = await api.get<any>(`/api/groups/${group.id}`);
          if (groupDetail.isUserParticipant || groupDetail.creatorId === userId) {
            return group;
          }
        } catch (error) {
          // 개별 모임 조회 실패 시 무시
        }
        return null;
      });

      const userGroupsResults = await Promise.allSettled(userGroupsPromises);
      const userGroups = userGroupsResults
        .filter((result) => result.status === 'fulfilled' && result.value !== null)
        .map((result) => (result as PromiseFulfilledResult<GroupData>).value);

      // 통계 계산
      const categoryStats: Record<string, number> = {};
      const regionStats: Record<string, number> = {};
      const monthlyStats: Record<string, number> = {};
      const weeklyStats: Record<string, number> = {};
      const timeStats: Record<string, number> = {};

      userGroups.forEach((group) => {
        // 카테고리별 통계
        if (group.category) {
          categoryStats[group.category] = (categoryStats[group.category] || 0) + 1;
        }

        // 지역별 통계
        if (group.location) {
          const city = extractCityFromAddress(group.location);
          if (city && city !== '전체') {
            regionStats[city] = (regionStats[city] || 0) + 1;
          }
        }

        // 월별 통계
        if (group.createdAt) {
          const date = new Date(group.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
        }

        // 주별 통계 (요일)
        if (group.meetingTime) {
          try {
            const meetingDate = new Date(group.meetingTime);
            const dayOfWeek = meetingDate.getDay();
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            weeklyStats[days[dayOfWeek]] = (weeklyStats[days[dayOfWeek]] || 0) + 1;
          } catch (e) {
            // 날짜 파싱 실패 시 무시
          }
        }

        // 시간대별 통계
        if (group.meetingTime) {
          try {
            const meetingDate = new Date(group.meetingTime);
            const hour = meetingDate.getHours();
            let timeSlot = '';
            if (hour >= 6 && hour < 12) {
              timeSlot = '오전 (6-12시)';
            } else if (hour >= 12 && hour < 18) {
              timeSlot = '오후 (12-18시)';
            } else if (hour >= 18 && hour < 22) {
              timeSlot = '저녁 (18-22시)';
            } else {
              timeSlot = '밤 (22-6시)';
            }
            timeStats[timeSlot] = (timeStats[timeSlot] || 0) + 1;
          } catch (e) {
            // 날짜 파싱 실패 시 무시
          }
        }
      });

      // 가장 많이 참여한 카테고리
      const favoriteCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';
      
      // 가장 많이 참여한 지역
      const favoriteRegion = Object.entries(regionStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';
      
      // 가장 많이 참여한 시간대
      const favoriteTime = Object.entries(timeStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';

      setStatistics({
        categoryStats,
        regionStats,
        monthlyStats,
        weeklyStats,
        timeStats,
        totalGroups: userGroups.length,
        totalParticipations: userGroups.length,
        favoriteCategory,
        favoriteRegion,
        favoriteTime,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
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
