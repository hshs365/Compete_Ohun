import React, { useState, useEffect, useMemo } from 'react';
import {
  UserGroupIcon,
  PlusCircleIcon,
  HeartIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import SportsStatisticsModal from './SportsStatisticsModal';
import FootballStatsRadar from './FootballStatsRadar';
import { getEarnedTitles, getCountByCategory } from '../utils/titles';
import { MAIN_CATEGORIES } from '../constants/sports';

type ActivityItem = {
  id: number;
  name: string;
  category: string;
  meetingTime: string | null;
  location: string;
  participantCount: number;
  creator?: { nickname: string };
  /** 포지션 지정 매치 참가 시 선택한 포지션 (내 참가 목록에서만) */
  myPositionCode?: string | null;
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
  /** 전체 | 축구 | 풋살 | ... (종목별 필터). 축구만 실제 데이터, 나머지는 없음 */
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');

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
        console.error('활동 기록 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, [authUser]);

  // 획득 타이틀: 참여·생성 매치 종목별 횟수 기반 (일반 + 애호가/마스터)
  const earnedTitles = useMemo(() => {
    const countByCategory = getCountByCategory(myParticipations, myCreations);
    return getEarnedTitles(countByCategory);
  }, [myParticipations, myCreations]);

  // 필터 적용: 축구만 실제 데이터, 그 외 종목은 "없음"
  const hasDataForCategory = (cat: string) => {
    if (cat === '전체') return true;
    return cat === '축구'; // 현재 축구만 UI 구현
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

  // 축구 육각형 스텟 (멘탈/수비/공격/피지컬/스피드/테크닉, 각 1~10) — 추후 API 연동
  const footballStats = useMemo(() => {
    // TODO: 백엔드에서 사용자별 축구 스텟 API 연동 시 교체
    return {
      멘탈: 0,
      수비: 0,
      공격: 0,
      피지컬: 0,
      스피드: 0,
      테크닉: 0,
    };
  }, [filteredParticipations]);

  const statsForCurrentFilter = useMemo(() => {
    if (!hasDataForCategory(categoryFilter)) {
      return {
        joinedGroups: 0,
        createdGroups: 0,
        favoriteGroups: 0,
        upcomingGroups: 0,
      };
    }
    return {
      joinedGroups: filteredParticipations.length,
      createdGroups: filteredCreations.length,
      favoriteGroups: 0,
      upcomingGroups: 0,
    };
  }, [
    categoryFilter,
    filteredParticipations.length,
    filteredCreations.length,
  ]);

  if (!authUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 w-full bg-[var(--color-bg-primary)] items-center justify-center min-h-[320px]">
        <LoadingSpinner fullScreen={false} message="활동 기록을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 배너 (스포츠용품 페이지와 동일 톤) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                활동 기록
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2 max-w-2xl">
                참여·생성한 매치와 획득한 타이틀을 한눈에 확인하세요.
              </p>
            </div>
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
                ? '매치 활동'
                : `${categoryFilter} 활동`}
            </h2>
            {categoryFilter === '전체' && (
              <button
                onClick={() => setShowStatisticsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity text-sm shadow-sm"
              >
                <ChartBarIcon className="w-5 h-5" />
                운동 통계 보기
              </button>
            )}
            {categoryFilter === '축구' && (
              <button
                onClick={() => setShowStatsRadarModal(true)}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white transition-colors text-sm"
              >
                <ChartBarIcon className="w-5 h-5" />
                내 스텟 보기
              </button>
            )}
          </div>

          <div className="p-6">
            {!hasDataForCategory(categoryFilter) ? (
              <div className="py-16 text-center text-[var(--color-text-secondary)]">
                <FunnelIcon className="w-14 h-14 mx-auto mb-4 opacity-40" />
                <p className="font-medium text-[var(--color-text-primary)]">해당 종목의 활동 기록이 없습니다.</p>
                <p className="text-sm mt-1">현재 축구만 활동 기록을 제공합니다.</p>
              </div>
            ) : (
              <>
                {/* 통계 카드 그리드 (세련된 카드 스타일) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="group flex flex-col p-5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all">
                    <UserGroupIcon className="w-9 h-9 text-[var(--color-blue-primary)] mb-3 opacity-90" />
                    <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
                      {statsForCurrentFilter.joinedGroups}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      참여한 매치
                    </div>
                  </div>
                  <div className="group flex flex-col p-5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all">
                    <PlusCircleIcon className="w-9 h-9 text-[var(--color-blue-primary)] mb-3 opacity-90" />
                    <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
                      {statsForCurrentFilter.createdGroups}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      생성한 매치
                    </div>
                  </div>
                  <div className="group flex flex-col p-5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all">
                    <HeartIcon className="w-9 h-9 text-[var(--color-blue-primary)] mb-3 opacity-90" />
                    <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
                      {statsForCurrentFilter.favoriteGroups}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      찜한 매치
                    </div>
                  </div>
                  <div className="group flex flex-col p-5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all">
                    <CalendarIcon className="w-9 h-9 text-[var(--color-blue-primary)] mb-3 opacity-90" />
                    <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
                      {statsForCurrentFilter.upcomingGroups}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      참여 예정
                    </div>
                  </div>
                </div>

                {/* 참여한 매치 목록 */}
                {filteredParticipations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                      참여한 매치
                    </h3>
                    <ul className="space-y-3">
                      {filteredParticipations.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/?group=${g.id}`)}
                            className="w-full text-left px-5 py-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-blue-primary)] transition-colors truncate">
                                {g.name}
                              </div>
                              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {g.category} · {g.meetingTime || '일시 미정'} · {g.participantCount}명
                                {g.creator?.nickname && ` · 매치장 ${g.creator.nickname}`}
                              </div>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-blue-primary)] flex-shrink-0 ml-3 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 생성한 매치 목록 */}
                {filteredCreations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                      생성한 매치
                    </h3>
                    <ul className="space-y-3">
                      {filteredCreations.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/?group=${g.id}`)}
                            className="w-full text-left px-5 py-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:shadow-md hover:border-[var(--color-blue-primary)]/20 transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-blue-primary)] transition-colors truncate">
                                {g.name}
                              </div>
                              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {g.category} · {g.meetingTime || '일시 미정'} · {g.participantCount}명
                              </div>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-blue-primary)] flex-shrink-0 ml-3 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 빈 상태 */}
                {filteredParticipations.length === 0 &&
                  filteredCreations.length === 0 &&
                  hasDataForCategory(categoryFilter) && (
                    <div className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-bg-secondary)] mb-4">
                        <UserGroupIcon className="w-10 h-10 text-[var(--color-text-secondary)] opacity-60" />
                      </div>
                      <p className="text-[var(--color-text-primary)] font-medium">
                        {categoryFilter === '전체'
                          ? '아직 참여하거나 생성한 매치가 없습니다.'
                          : `${categoryFilter} 매치에 참여한 기록이 없습니다.`}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        매치를 찾아 참가해 보거나, 직접 매치를 만들어 보세요.
                      </p>
                      <button
                        onClick={() => navigate('/')}
                        className="mt-5 px-5 py-2.5 rounded-xl font-semibold border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white transition-colors"
                      >
                        매치 찾아보기
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
        />
      )}

      {/* 축구: 육각형 스텟(레이더 차트) 모달 */}
      {showStatsRadarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
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
                축구 스텟 (1~10단계)
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
              <FootballStatsRadar
                stats={footballStats}
                height={340}
                theme="dark"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivityPage;
