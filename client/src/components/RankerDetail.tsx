import React from 'react';
import { XMarkIcon, TrophyIcon, StarIcon, FireIcon, ChartBarIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';

interface Ranker {
  id: number;
  rank: number;
  nickname: string;
  score: number;
  sportCategory: string;
  badge?: string;
  avatar?: string;
}

interface RankerDetailProps {
  ranker: Ranker | null;
  onClose: () => void;
}

// 임의의 상세 정보 생성 함수
const generateRankerDetail = (ranker: Ranker) => {
  // 랭커 ID 기반으로 일관된 데이터 생성
  const seed = ranker.id;
  
  return {
    profile: {
      nickname: ranker.nickname,
      rank: ranker.rank,
      score: ranker.score,
      sportCategory: ranker.sportCategory,
      joinDate: new Date(2024, 0, 1 + (seed % 30)).toLocaleDateString('ko-KR'),
      location: ['서울', '부산', '대전', '대구', '인천', '광주'][seed % 6],
      level: ['초급', '중급', '고급', '프로'][Math.floor(seed / 4) % 4],
    },
    stats: {
      totalMeetings: 45 + (seed * 3),
      winRate: 65 + (seed % 20),
      averageScore: 8.5 + (seed % 10) / 10,
      totalParticipants: 120 + (seed * 5),
      consecutiveWins: 5 + (seed % 10),
      favoriteTime: ['오전', '오후', '저녁'][seed % 3],
    },
    achievements: [
      { title: '연속 우승', description: `${5 + (seed % 10)}회 연속 우승`, icon: '🏆' },
      { title: '모임 마스터', description: `${45 + (seed * 3)}개 모임 주최`, icon: '👑' },
      { title: '인기왕', description: '가장 많은 참가자 유치', icon: '⭐' },
      { title: '활동왕', description: '이번 달 최다 활동', icon: '🔥' },
    ],
    recentActivity: [
      { date: '2026-01-03', event: '모임 주최', location: '서울 강남구', score: 150 },
      { date: '2026-01-02', event: '모임 참가', location: '서울 서초구', score: 120 },
      { date: '2026-01-01', event: '모임 우승', location: '서울 송파구', score: 200 },
      { date: '2025-12-31', event: '모임 주최', location: '서울 마포구', score: 140 },
      { date: '2025-12-30', event: '모임 참가', location: '서울 종로구', score: 110 },
    ],
    badges: [
      { name: '골드 랭커', color: 'from-yellow-400 to-yellow-600' },
      { name: '활동 마스터', color: 'from-blue-400 to-blue-600' },
      { name: '인기 스타', color: 'from-pink-400 to-pink-600' },
      { name: '연속 우승자', color: 'from-purple-400 to-purple-600' },
    ],
  };
};

const RankerDetail: React.FC<RankerDetailProps> = ({ ranker, onClose }) => {
  if (!ranker) return null;

  const detail = generateRankerDetail(ranker);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 모달 내용 영역 클릭은 무시
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] shadow-2xl overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${getRankColor(ranker.rank)} p-6 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30">
              {ranker.nickname.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{ranker.nickname}</h2>
                {ranker.badge && <span className="text-3xl">{ranker.badge}</span>}
                {ranker.rank <= 3 && <FireIcon className="w-6 h-6" />}
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {ranker.rank}위
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {ranker.sportCategory}
                </span>
                <span className="text-lg font-bold">
                  {ranker.score.toLocaleString()}점
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 프로필 정보 */}
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              프로필 정보
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">가입일</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{detail.profile.joinDate}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">지역</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {detail.profile.location}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">레벨</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{detail.profile.level}</p>
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
              활동 통계
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">총 모임 수</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.totalMeetings}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">승률</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.winRate}%</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">평균 점수</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">총 참가자</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.totalParticipants}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">연속 우승</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.consecutiveWins}회</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-card)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">선호 시간</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.favoriteTime}</p>
              </div>
            </div>
          </div>

          {/* 업적 */}
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <TrophySolidIcon className="w-5 h-5 text-yellow-500" />
              주요 업적
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {detail.achievements.map((achievement, index) => (
                <div key={index} className="p-3 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{achievement.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 뱃지 */}
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">보유 뱃지</h3>
            <div className="flex flex-wrap gap-2">
              {detail.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 bg-gradient-to-r ${badge.color} text-white text-xs font-semibold rounded-full`}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 border border-[var(--color-border-card)]">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-green-500" />
              최근 활동
            </h3>
            <div className="space-y-2">
              {detail.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{activity.event}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">{activity.date}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      {activity.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">+{activity.score}점</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankerDetail;
