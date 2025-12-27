import { useState, useEffect } from 'react';
import type { SelectedGroup } from './MapPanel';
import { api } from '../utils/api';

interface GroupListProps {
  selectedCategory: string | null;
  searchQuery?: string;
  onGroupClick: (group: SelectedGroup) => void;
  refreshTrigger?: number; // 목록 새로고침 트리거
}

interface GroupResponse {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string | null;
  meetingTime: string | null;
  contact: string | null;
  equipment: string[];
  participantCount: number;
  createdAt: string;
}

const GroupList = ({ selectedCategory, searchQuery, onGroupClick, refreshTrigger }: GroupListProps) => {
  const [groups, setGroups] = useState<SelectedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const category = selectedCategory === '전체' || selectedCategory === null ? undefined : selectedCategory;
        const queryParams = new URLSearchParams();
        
        if (category) {
          queryParams.append('category', category);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        queryParams.append('limit', '100'); // 충분히 많은 데이터 가져오기

        const response = await api.get<{ groups: GroupResponse[]; total: number }>(
          `/api/groups?${queryParams.toString()}`
        );

        const mappedGroups: SelectedGroup[] = response.groups.map((group) => ({
          id: group.id,
          name: group.name,
          location: group.location,
          coordinates: [parseFloat(group.latitude.toString()), parseFloat(group.longitude.toString())] as [number, number],
          memberCount: group.participantCount,
          category: group.category,
          description: group.description || undefined,
          meetingTime: group.meetingTime || undefined,
          contact: group.contact || undefined,
          equipment: group.equipment || [],
        }));

        setGroups(mappedGroups);
      } catch (err) {
        console.error('모임 목록 조회 실패:', err);
        setError(err instanceof Error ? err.message : '모임 목록을 불러오는데 실패했습니다.');
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [selectedCategory, searchQuery, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-[var(--color-text-secondary)]">모임 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4">
      <div className="space-y-3 md:space-y-4">
        {groups.length > 0 ? (
          groups.map((group) => (
            <button
              onClick={() => onGroupClick(group)}
              className="w-full text-left block p-3 md:p-4 bg-[var(--color-bg-card)] rounded-xl md:rounded-2xl border border-[var(--color-border-card)] transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-blue-primary)] cursor-pointer" 
              key={group.id}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                <h5 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] tracking-tight">{group.name}</h5>
                <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full self-start md:self-auto">
                  {group.location}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
                  참가자: <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full">{group.memberCount}명</span>
                </p>
                <span className="px-2 py-1 bg-[var(--color-blue-primary)] text-white text-xs font-semibold rounded-full self-start md:self-auto">
                  {group.category}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="p-4 text-[var(--color-text-secondary)] italic text-center">
            {searchQuery ? '검색 결과가 없습니다.' : '해당 카테고리의 모임이 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupList;
