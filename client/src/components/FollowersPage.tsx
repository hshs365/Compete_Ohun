import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/swal';
import LoadingSpinner from './LoadingSpinner';

interface User {
  id: number;
  nickname: string;
  tag?: string;
  profileImageUrl?: string;
  isFollowing?: boolean;
}

const FollowersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'played-together'>('following');
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [playedTogether, setPlayedTogether] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab, user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'following') {
        const data = await api.get<User[]>('/api/users/following');
        setFollowing(data);
      } else if (activeTab === 'followers') {
        const data = await api.get<User[]>('/api/users/followers');
        setFollowers(data);
      } else if (activeTab === 'played-together') {
        const data = await api.get<User[]>('/api/users/played-together');
        setPlayedTogether(data);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      await showError('데이터를 불러오는데 실패했습니다.', '로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      await api.post(`/api/users/follow/${userId}`);
      await showSuccess('팔로우했습니다.', '팔로우');
      // 같이 했던 유저 목록 업데이트
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
      // 목록에서 제거
      if (activeTab === 'following') {
        setFollowing((prev) => prev.filter((u) => u.id !== userId));
      } else if (activeTab === 'played-together') {
        const data = await api.get<User[]>('/api/users/played-together');
        setPlayedTogether(data);
      }
    } catch (error) {
      console.error('언팔로우 실패:', error);
      await showError(error instanceof Error ? error.message : '언팔로우에 실패했습니다.', '언팔로우 실패');
    }
  };

  const currentUsers = activeTab === 'following' ? following : activeTab === 'followers' ? followers : playedTogether;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6">팔로워</h1>

      {/* 탭 메뉴 */}
      <div className="flex space-x-2 border-b border-[var(--color-border-card)]">
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

      {/* 유저 목록 */}
      {loading ? (
        <LoadingSpinner fullScreen={false} message="로딩 중..." />
      ) : currentUsers.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>
            {activeTab === 'following'
              ? '팔로우한 유저가 없습니다.'
              : activeTab === 'followers'
              ? '팔로워가 없습니다.'
              : '같이 했던 유저가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <UserGroupIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {user.nickname}
                    {user.tag && <span className="text-[var(--color-text-secondary)] ml-1">#{user.tag}</span>}
                  </div>
                </div>
              </div>
              {activeTab !== 'followers' && (
                <button
                  onClick={() => (user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    user.isFollowing
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-blue-primary)] text-white hover:opacity-90'
                  }`}
                >
                  {user.isFollowing ? (
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
  );
};

export default FollowersPage;
