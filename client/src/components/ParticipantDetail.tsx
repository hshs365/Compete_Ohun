import React from 'react';
import { XMarkIcon, TrophyIcon, StarIcon, FireIcon, ChartBarIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';

interface Participant {
  id: number;
  userId: number;
  user: {
    id: number;
    nickname: string;
    tag?: string; // 닉네임 태그
    profileImage?: string | null;
  };
  status: string;
  joinedAt: string;
  isCreator?: boolean;
  isRanker?: boolean; // 랭커 여부
  rank?: number; // 랭킹 순위 (랭커인 경우)
  score?: number; // 활동 점수 (랭커인 경우)
  sportCategory?: string; // 운동 카테고리
}

interface ParticipantDetailProps {
  participant: Participant | null;
  onClose: () => void;
}

// 임의의 상세 정보 생성 함수
const generateParticipantDetail = (participant: Participant) => {
  const seed = participant.userId;
  const isRanker = participant.isRanker || false;
  
  return {
    profile: {
      nickname: participant.user.nickname,
      rank: participant.rank || null,
      score: participant.score || null,
      sportCategory: participant.sportCategory || '전체',
      joinDate: new Date(2024, 0, 1 + (seed % 30)).toLocaleDateString('ko-KR'),
      location: ['서울', '부산', '대전', '대구', '인천', '광주'][seed % 6],
      level: isRanker ? '고급' : ['초급', '중급', '고급'][Math.floor(seed / 3) % 3],
    },
    stats: {
      totalMeetings: isRanker ? 45 + (seed * 3) : 10 + (seed * 2),
      winRate: isRanker ? 65 + (seed % 20) : 40 + (seed % 30),
      averageScore: isRanker ? 8.5 + (seed % 10) / 10 : 6.0 + (seed % 20) / 10,
      totalParticipants: isRanker ? 120 + (seed * 5) : 30 + (seed * 3),
      consecutiveWins: isRanker ? 5 + (seed % 10) : 1 + (seed % 3),
      favoriteTime: ['오전', '오후', '저녁'][seed % 3],
    },
    achievements: isRanker ? [
      { title: '연속 우승', description: `${5 + (seed % 10)}회 연속 우승`, icon: '🏆' },
      { title: '매치 마스터', description: `${45 + (seed * 3)}개 매치 주최`, icon: '👑' },
      { title: '인기왕', description: '가장 많은 참가자 유치', icon: '⭐' },
      { title: '활동왕', description: '이번 달 최다 활동', icon: '🔥' },
    ] : [
      { title: '첫 매치', description: '첫 매치 참가 완료', icon: '🎉' },
      { title: '활발한 참가자', description: `${10 + (seed * 2)}개 매치 참가`, icon: '🌟' },
    ],
    recentActivity: [
      { date: '2026-01-03', event: '매치 참가', location: '서울 강남구', score: isRanker ? 150 : 50 },
      { date: '2026-01-02', event: '매치 참가', location: '서울 서초구', score: isRanker ? 120 : 40 },
      { date: '2026-01-01', event: isRanker ? '매치 우승' : '매치 참가', location: '서울 송파구', score: isRanker ? 200 : 60 },
      { date: '2025-12-31', event: '매치 참가', location: '서울 마포구', score: isRanker ? 140 : 45 },
      { date: '2025-12-30', event: '매치 참가', location: '서울 종로구', score: isRanker ? 110 : 35 },
    ],
    badges: isRanker ? [
      { name: '골드 랭커', color: 'from-yellow-400 to-yellow-600' },
      { name: '활동 마스터', color: 'from-blue-400 to-blue-600' },
      { name: '인기 스타', color: 'from-pink-400 to-pink-600' },
      { name: '연속 우승자', color: 'from-purple-400 to-purple-600' },
    ] : [
      { name: '신규 회원', color: 'from-green-400 to-green-600' },
      { name: '활발한 참가자', color: 'from-blue-400 to-blue-600' },
    ],
  };
};

const ParticipantDetail: React.FC<ParticipantDetailProps> = ({ participant, onClose }) => {
  if (!participant) return null;

  const detail = generateParticipantDetail(participant);
  const isRanker = participant.isRanker || false;
  const rank = participant.rank || null;

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'from-blue-400 to-blue-600';
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
        className={`relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] shadow-2xl overflow-hidden flex flex-col m-4 ${
          isRanker ? 'ring-4 ring-yellow-400/50' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${getRankColor(rank)} p-6 text-white relative ${isRanker ? 'shadow-lg' : ''}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30 ${
              isRanker ? 'ring-4 ring-yellow-300/50' : ''
            }`}>
              {participant.user.profileImage ? (
                <img
                  src={participant.user.profileImage}
                  alt={participant.user.nickname}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                participant.user.nickname.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{participant.user.nickname}{participant.user.tag || ''}</h2>
                {participant.isCreator && (
                  <span className="px-2 py-1 bg-yellow-500/30 rounded-full text-xs font-semibold flex items-center gap-1">
                    <StarIcon className="w-3 h-3" />
                    매치장
                  </span>
                )}
                {isRanker && rank && rank <= 3 && <FireIcon className="w-6 h-6" />}
                {isRanker && (
                  <span className="px-3 py-1 bg-white/30 rounded-full text-sm font-semibold flex items-center gap-1">
                    <TrophySolidIcon className="w-4 h-4" />
                    랭커
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/90 flex-wrap">
                {isRanker && rank && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    {rank}위
                  </span>
                )}
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {detail.profile.sportCategory}
                </span>
                {isRanker && detail.profile.score && (
                  <span className="text-lg font-bold">
                    {detail.profile.score.toLocaleString()}점
                  </span>
                )}
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
                <p className={`text-sm font-semibold ${
                  detail.profile.level === '고급' ? 'text-yellow-500' : 'text-[var(--color-text-primary)]'
                }`}>
                  {detail.profile.level}
                </p>
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
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">총 매치 수</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.totalMeetings}</p>
              </div>
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">승률</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.winRate}%</p>
              </div>
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">평균 점수</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.averageScore.toFixed(1)}</p>
              </div>
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">총 참가자</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.totalParticipants}</p>
              </div>
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">연속 우승</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{detail.stats.consecutiveWins}회</p>
              </div>
              <div className={`p-3 rounded-lg ${isRanker ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border border-yellow-400/20' : 'bg-[var(--color-bg-card)]'}`}>
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
                <div key={index} className={`p-3 rounded-lg border ${
                  isRanker 
                    ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/20' 
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border-card)]'
                }`}>
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
                  className={`px-3 py-1 bg-gradient-to-r ${badge.color} text-white text-xs font-semibold rounded-full ${
                    isRanker ? 'shadow-md' : ''
                  }`}
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
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isRanker 
                    ? 'bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/20' 
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border-card)]'
                }`}>
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

export default ParticipantDetail;
