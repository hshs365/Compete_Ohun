import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, UserPlusIcon, UserMinusIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/swal';
import LoadingSpinner from './LoadingSpinner';
import UserDetailModal from './UserDetailModal';

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
}

const FollowersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'played-together'>('followers');
  const [recommended, setRecommended] = useState<User[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [playedTogether, setPlayedTogether] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  /** 메인 목록(팔로워/팔로잉/같이 했던 유저) 로드 실패 시 메시지. 빈 문자열이면 실패 아님 */
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab, user, navigate]);

  // 추천 유저는 별도 패널용 - 마운트 시 한 번 로드
  useEffect(() => {
    if (!user) return;
    const fetchRecommended = async () => {
      setRecommendedLoading(true);
      try {
        const data = await api.get<User[]>('/api/users/recommended?limit=10');
        setRecommended(data);
      } catch (err) {
        console.error('추천 유저 로드 실패:', err);
        setRecommended([]);
      } finally {
        setRecommendedLoading(false);
      }
    };
    fetchRecommended();
  }, [user]);

  // 전체 유저 검색 (닉네임, 태그) - 디바운스
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data);
      } catch (err) {
        console.error('검색 실패:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setLoadError(null);
    try {
      if (activeTab === 'followers') {
        const data = await api.get<User[]>('/api/users/followers');
        setFollowers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'following') {
        const data = await api.get<User[]>('/api/users/following');
        setFollowing(Array.isArray(data) ? data : []);
      } else if (activeTab === 'played-together') {
        const data = await api.get<User[]>('/api/users/played-together');
        setPlayedTogether(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 모달 대신 빈 목록으로 두고, 인라인 안내만 표시 (유저 없음과 동일한 빈 상태 UI)
      if (activeTab === 'followers') setFollowers([]);
      else if (activeTab === 'following') setFollowing([]);
      else setPlayedTogether([]);
      setLoadError('일시적으로 목록을 불러오지 못했습니다. 새로고침해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const updateSearchResultFollow = useCallback((userId: number, isFollowing: boolean) => {
    setSearchResults((prev) =>
      prev ? prev.map((u) => (u.id === userId ? { ...u, isFollowing } : u)) : null,
    );
  }, []);

  const updateRecommendedFollow = useCallback((userId: number, isFollowing: boolean) => {
    setRecommended((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing } : u)));
  }, []);

  const updateSelectedUserFollow = useCallback((userId: number, isFollowing: boolean) => {
    setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, isFollowing } : prev));
  }, []);

  const handleFollow = async (userId: number) => {
    try {
      await api.post(`/api/users/follow/${userId}`);
      await showSuccess('팔로우했습니다.', '팔로우');
      updateSearchResultFollow(userId, true);
      updateRecommendedFollow(userId, true);
      updateSelectedUserFollow(userId, true);
      if (activeTab === 'followers') {
        const data = await api.get<User[]>('/api/users/followers');
        setFollowers(data);
      }
      if (activeTab === 'following' || searchQuery.trim()) {
        const data = await api.get<User[]>('/api/users/following');
        setFollowing(data);
      }
      if (activeTab === 'played-together') {
        const data = await api.get<User[]>('/api/users/played-together');
        setPlayedTogether(data);
      }
    } catch (error) {
      console.error('팔로우 실패:', error);
      await showError(error instanceof Error ? error.message : '팔로우에 실패했습니다.', '팔로우 실패');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await api.delete(`/api/users/follow/${userId}`);
      await showSuccess('언팔로우했습니다.', '언팔로우');
      updateSearchResultFollow(userId, false);
      updateRecommendedFollow(userId, false);
      updateSelectedUserFollow(userId, false);
      if (activeTab === 'followers') {
        const data = await api.get<User[]>('/api/users/followers');
        setFollowers(data);
      }
      if (activeTab === 'following' || searchQuery.trim()) {
        setFollowing((prev) => prev.filter((u) => u.id !== userId));
      }
      if (activeTab === 'played-together') {
        const data = await api.get<User[]>('/api/users/played-together');
        setPlayedTogether(data);
      }
    } catch (error) {
      console.error('언팔로우 실패:', error);
      await showError(error instanceof Error ? error.message : '언팔로우에 실패했습니다.', '언팔로우 실패');
    }
  };

  const handleMatchInvite = async (userId: number) => {
    try {
      const res = await api.post<{ message?: string }>(`/api/users/match-invite/${userId}`);
      await showSuccess(res?.message || '매치 초대를 보냈습니다.', '초대 완료');
    } catch (error) {
      console.error('매치 초대 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 초대에 실패했습니다.', '초대 실패');
    }
  };

  const rawUsers =
    activeTab === 'followers' ? followers : activeTab === 'following' ? following : playedTogether;
  const isSearchMode = searchQuery.trim().length > 0;
  const tabUsers = rawUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nickname = (u.nickname || '').toLowerCase();
    const tag = (u.tag || '').toLowerCase();
    return nickname.includes(q) || tag.includes(q);
  });

  const displayUsers = isSearchMode ? (searchResults ?? []) : tabUsers;
  const showFollowButton = isSearchMode || activeTab !== 'followers'; // 팔로워 탭에서는 목록에 팔로우 버튼 숨김(이미 나를 팔로우한 사람)

  return (
    <div className="flex flex-1 w-full min-h-0 p-4 md:p-6">
      <div className="flex flex-1 gap-6 max-w-6xl mx-auto w-full min-w-0">
        {/* 메인: 검색 + 탭 + 유저 목록 */}
        <div className="flex-1 min-w-0 space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">팔로워</h1>

          {/* 유저 검색 */}
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="닉네임, 태그로 검색하여 팔로우..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-10 pr-4 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              />
            </div>
          </div>

          {/* 탭 메뉴: 팔로워(왼쪽) / 팔로잉(오른쪽) / 같이 했던 유저 */}
          <div className="flex flex-wrap gap-x-2 border-b border-[var(--color-border-card)]">
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'text-[var(--color-blue-primary)] border-b-2 border-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              팔로워 ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-[var(--color-blue-primary)] border-b-2 border-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              팔로잉 ({following.length})
            </button>
            <button
              onClick={() => setActiveTab('played-together')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'played-together'
                  ? 'text-[var(--color-blue-primary)] border-b-2 border-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              같이 했던 유저 ({playedTogether.length})
            </button>
          </div>

          {loadError && (
            <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => { setLoadError(null); fetchData(); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg font-medium bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              >
                새로고침
              </button>
            </div>
          )}

          {/* 유저 목록 */}
          {loading && !isSearchMode ? (
            <LoadingSpinner fullScreen={false} message="로딩 중..." />
          ) : isSearchMode && searchLoading ? (
            <LoadingSpinner fullScreen={false} message="검색 중..." />
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>
                {isSearchMode
                  ? '검색 조건에 맞는 유저가 없습니다.'
                  : activeTab === 'followers'
                  ? '팔로워가 없습니다.'
                  : activeTab === 'following'
                  ? '팔로우한 유저가 없습니다.'
                  : '같이 했던 유저가 없습니다.'}
              </p>
              {isSearchMode && (
                <p className="text-sm mt-2">닉네임, 태그로 검색해 보세요.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
          {displayUsers.map((listUser) => (
            <div
              key={listUser.id}
              className="flex items-center justify-between p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedUser(listUser)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(listUser)}
                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[var(--color-border-card)]">
                  {listUser.profileImageUrl ? (
                    <img src={listUser.profileImageUrl} alt={listUser.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-[var(--color-text-primary)]">
                      {(listUser.nickname || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {listUser.nickname}
                    {listUser.tag && <span className="text-[var(--color-text-secondary)] ml-1">{listUser.tag}</span>}
                  </div>
                  {listUser.commonSports && listUser.commonSports.length > 0 && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {listUser.commonSports.join(', ')}
                      {listUser.totalScore != null ? ` · ${listUser.totalScore.toLocaleString()}점` : ''}
                      {listUser.mutualCount != null && listUser.mutualCount > 0 ? ` · 친구 ${listUser.mutualCount}명` : ''}
                    </p>
                  )}
                </div>
              </div>
              {showFollowButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    listUser.isFollowing ? handleUnfollow(listUser.id) : handleFollow(listUser.id);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                    listUser.isFollowing
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-blue-primary)] text-white hover:opacity-90'
                  }`}
                >
                  {listUser.isFollowing ? (
                    <>
                      <UserMinusIcon className="w-5 h-5 inline mr-1" />
                      언팔로우
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-5 h-5 inline mr-1" />
                      팔로우
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
            </div>
          )}
        </div>

        {/* 추천 유저 패널 - 항상 노출 */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-4 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border-card)] flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
              <h2 className="font-semibold text-[var(--color-text-primary)]">함께할 유저 추천</h2>
            </div>
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              {recommendedLoading ? (
                <div className="py-8 text-center text-[var(--color-text-secondary)] text-sm">로딩 중...</div>
              ) : recommended.length === 0 ? (
                <div className="py-8 px-4 text-center text-[var(--color-text-secondary)] text-sm">
                  추천 유저가 없습니다.<br />프로필을 완성하고 관심 종목을 설정해 보세요!
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-card)]">
                  {recommended.map((recUser) => (
                    <div
                      key={recUser.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedUser(recUser)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(recUser)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[var(--color-border-card)]">
                        {recUser.profileImageUrl ? (
                          <img src={recUser.profileImageUrl} alt={recUser.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[var(--color-text-primary)]">
                            {(recUser.nickname || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--color-text-primary)] truncate">
                          {recUser.nickname}
                          {recUser.tag && <span className="text-[var(--color-text-secondary)] ml-0.5">{recUser.tag}</span>}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {recUser.commonSports?.length ? recUser.commonSports.join(', ') : ''}
                          {recUser.totalScore != null ? ` · ${recUser.totalScore.toLocaleString()}점` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 추천 패널 모바일: 하단 고정 슬라이드 또는 접이식 */}
      <div className="lg:hidden mt-4">
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border-card)] flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">함께할 유저 추천</h2>
          </div>
          <div className="overflow-x-auto flex gap-3 p-3 min-h-[100px]">
            {recommendedLoading ? (
              <div className="flex-1 py-6 text-center text-[var(--color-text-secondary)] text-sm">로딩 중...</div>
            ) : recommended.length === 0 ? (
              <div className="flex-1 py-6 text-center text-[var(--color-text-secondary)] text-sm">추천 유저가 없습니다.</div>
            ) : (
              recommended.map((recUser) => (
                <div
                  key={recUser.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedUser(recUser)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(recUser)}
                  className="flex-shrink-0 w-20 flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden ring-2 ring-[var(--color-border-card)]">
                    {recUser.profileImageUrl ? (
                      <img src={recUser.profileImageUrl} alt={recUser.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {(recUser.nickname || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] truncate w-full text-center">
                    {recUser.nickname}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 유저 상세 모달 */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          showFollowButton
          onMatchInvite={recommended.some((u) => u.id === selectedUser.id) ? handleMatchInvite : undefined}
        />
      )}
    </div>
  );
};

export default FollowersPage;
