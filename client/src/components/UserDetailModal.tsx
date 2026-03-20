import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  EnvelopeIcon,
  TrophyIcon,
  MapPinIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import { api } from '../utils/api';
import { getAllcourtplayRankStyle, getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getFollowerGrade, getFollowerGradeBadgeStyle } from '../constants/followerGrade';
import { SPORT_CHIP_STYLES, SPORT_ICONS } from '../constants/sports';
import FormatNumber from './FormatNumber';

interface User {
  id: number;
  nickname: string;
  tag?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
  totalScore?: number;
  participatedSports?: string[];
  mutualCount?: number;
  distanceKm?: number | null;
  commonSports?: string[];
  residenceSido?: string;
  residenceSigungu?: string;
  teamNames?: string[];
}

/** API 프로필 요약 응답 */
interface ProfileSummary {
  id: number;
  nickname: string;
  tag: string | null;
  profileImageUrl: string | null;
  residenceSido: string;
  residenceSigungu: string;
  interestedSports: string[];
  effectiveRanks?: Record<string, string>;
  athleteVerified: boolean;
  athleteData: { sport?: string } | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  totalScore: number;
  isFollowing: boolean;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
  mannerScore?: number;
  preferredPosition?: string;
  earnedTitles?: string[];
  recentCompletedActivities?: Array<{
    type: 'participated' | 'created';
    groupId: number;
    name: string;
    category: string;
    date: string;
  }>;
  teamNames?: string[];
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onFollow: (userId: number) => Promise<void>;
  onUnfollow: (userId: number) => Promise<void>;
  showFollowButton?: boolean;
  onMatchInvite?: (userId: number) => Promise<void>;
}

/** 프로필 정보·주요 업적용 데이터 (API + 보조 데이터) */
function getDetailFromProfile(summary: ProfileSummary | null, user: User) {
  const seed = user.id;
  const score = summary?.totalScore ?? user.totalScore ?? 0;
  const isHighScore = score > 100;
  const location = [summary?.residenceSido, summary?.residenceSigungu].filter(Boolean).join(' ') || user.residenceSido || user.residenceSigungu || '-';
  const teamNames = summary?.teamNames ?? user.teamNames ?? [];
  return {
    profile: {
      joinDate: summary?.createdAt ? new Date(summary.createdAt).toLocaleDateString('ko-KR') : '-',
      location: location || '-',
      level: isHighScore ? '고급' : ['초급', '중급', '고급'][Math.floor(seed / 3) % 3],
      followersCount: summary?.followersCount ?? 0,
      followingCount: summary?.followingCount ?? 0,
      teamNames,
    },
    achievements: isHighScore
      ? [
          { title: '활동왕', description: '매치 다수 참가', icon: '🔥' },
        ]
      : [
          { title: '첫 매치', description: '첫 매치 참가 완료', icon: '🎉' },
          { title: '활발한 참가자', description: `${5 + (seed % 10)}개 매치 참가`, icon: '🌟' },
        ],
  };
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onFollow,
  onUnfollow,
  showFollowButton = true,
  onMatchInvite,
}) => {
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileSummary(null);
      setSummaryError(false);
      return;
    }
    setSummaryLoading(true);
    setSummaryError(false);
    api
      .get<ProfileSummary>(`/api/users/${user.id}/profile-summary`)
      .then((data) => setProfileSummary(data))
      .catch(() => {
        setSummaryError(true);
        setProfileSummary(null);
      })
      .finally(() => setSummaryLoading(false));
  }, [user?.id]);

  if (!user) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (profileSummary?.isFollowing ?? user.isFollowing) {
        await onUnfollow(user.id);
        setProfileSummary((prev) => (prev ? { ...prev, isFollowing: false, followersCount: Math.max(0, prev.followersCount - 1) } : null));
      } else {
        await onFollow(user.id);
        setProfileSummary((prev) => (prev ? { ...prev, isFollowing: true, followersCount: prev.followersCount + 1 } : null));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMatchInviteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMatchInvite) return;
    setInviteLoading(true);
    try {
      await onMatchInvite(user.id);
    } finally {
      setInviteLoading(false);
    }
  };

  const isFollowing = profileSummary?.isFollowing ?? user.isFollowing;
  const rankEntries = profileSummary?.effectiveRanks ? Object.entries(profileSummary.effectiveRanks) : [];
  /** 플레이어 신청 명함에 등록한 종목들 (프로필·헤더 표시) */
  const interestedSports = profileSummary?.interestedSports ?? user.participatedSports ?? [];
  const detail = getDetailFromProfile(profileSummary, user);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] shadow-2xl overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10 text-white"
          aria-label="닫기"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[var(--color-blue-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 헤더 (2번 캡쳐 스타일: 그라데이션 + 아바타 + 이름 + 종목 뱃지) */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 text-3xl font-bold">
                  {(profileSummary?.profileImageUrl ?? user.profileImageUrl) ? (
                    <img
                      src={profileSummary?.profileImageUrl ?? user.profileImageUrl}
                      alt={user.nickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-14 h-14 text-white/90" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">
                      {profileSummary?.nickname ?? user.nickname}
                      {(profileSummary?.tag ?? user.tag) && (
                        <span className="font-normal opacity-90 ml-1">{profileSummary?.tag ?? user.tag}</span>
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 flex-wrap">
                    {interestedSports.length > 0 ? (
                      interestedSports.map((sport) => (
                        <span key={sport} className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold flex items-center gap-1">
                          <span>{SPORT_ICONS[sport] ?? '●'}</span>
                          <span>{sport}</span>
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">전체</span>
                    )}
                    {(() => {
                      const grade = getFollowerGrade(detail.profile.followersCount);
                      return grade ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getFollowerGradeBadgeStyle(grade)}`}>
                          {grade}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 본문: 프로필 정보 · 활동 통계 · 주요 업적 · 보유 뱃지 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 프로필 정보 (팔로워/팔로잉 포함) */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  프로필 정보
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1">팔로워 / 팔로잉</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      <FormatNumber value={detail.profile.followersCount} /> / <FormatNumber value={detail.profile.followingCount} />
                    </p>
                  </div>
                  {detail.profile.teamNames?.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-xs text-[var(--color-text-secondary)] mb-1">크루</p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{detail.profile.teamNames.join(', ')}</p>
                    </div>
                  )}
                </div>
                {interestedSports.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border-card)]">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">플레이어 신청 명함에 등록한 종목</p>
                    <div className="flex flex-wrap gap-1.5">
                      {interestedSports.map((sport) => {
                        const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                        return (
                          <span
                            key={sport}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${chip.bg} ${chip.border} !text-gray-900 dark:!text-gray-100`}
                          >
                            {SPORT_ICONS[sport] ?? '●'} {sport}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 주요 업적 */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <TrophySolidIcon className="w-5 h-5 text-yellow-500" />
                  주요 업적
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detail.achievements.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-[var(--color-bg-card)] border-[var(--color-border-card)]">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{a.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 보유 뱃지 (올코트플레이 랭크 + 선수 + 타이틀 뱃지) */}
              <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">보유 뱃지</h3>
                <div className="flex flex-wrap gap-2">
                  {rankEntries.map(([sport, rank]) => (
                    <span
                      key={sport}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${getAllcourtplayRankStyle(rank)}`}
                    >
                      {sport} {getRankDisplayLabel(sport, rank)}
                    </span>
                  ))}
                  {profileSummary?.athleteVerified && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <TrophyIcon className="w-3.5 h-3.5" />
                      선수
                      {profileSummary.athleteData?.sport && <span className="opacity-90">({profileSummary.athleteData.sport})</span>}
                    </span>
                  )}
                  {(profileSummary?.earnedTitles ?? []).map((title) => (
                    <span
                      key={title}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full"
                    >
                      {title}
                    </span>
                  ))}
                  {!rankEntries.length && !profileSummary?.athleteVerified && !(profileSummary?.earnedTitles?.length) && (
                    <span className="text-sm text-[var(--color-text-secondary)]">보유 뱃지가 없습니다.</span>
                  )}
                </div>
              </div>

              {/* 최근 활동 (완료된 참가/생성 매치만) */}
              {(profileSummary?.recentCompletedActivities?.length ?? 0) > 0 && (
                <div className="bg-[var(--color-bg-primary)] rounded-xl p-4 mb-4 border border-[var(--color-border-card)]">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    최근 활동
                  </h3>
                  <ul className="space-y-2">
                    {profileSummary!.recentCompletedActivities!.map((item, i) => (
                      <li key={`${item.groupId}-${item.date}-${i}`} className="p-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">{item.date}</span>
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {item.type === 'participated' ? '참가' : '생성'} · {item.category}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 액션 버튼 (채팅 미지원으로 함께 매치하고 싶어요 버튼 제거) */}
            <div className="px-6 pb-6 pt-2 space-y-3 border-t border-[var(--color-border-card)]">
              {showFollowButton && (
                <button
                  type="button"
                  onClick={handleFollowClick}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    isFollowing
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                  } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinusIcon className="w-5 h-5" />
                      언팔로우
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-5 h-5" />
                      팔로우
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
