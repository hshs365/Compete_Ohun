import type { SelectedGroup } from './MapPanel';

interface GroupListProps {
  selectedCategory: string | null;
  onGroupClick: (group: SelectedGroup) => void;
}

const GroupList = ({ selectedCategory, onGroupClick }: GroupListProps) => {
  // Sample data for various groups with categories (위치 좌표 추가)
  const allGroups: SelectedGroup[] = [
    { id: 1, name: '강남 스매셔', location: '서울시 강남구', coordinates: [37.5172, 127.0473], memberCount: 25, category: '배드민턴', description: '강남 지역 배드민턴 모임입니다. 매주 토요일 오전 10시에 모입니다.', meetingTime: '매주 토요일 10:00', contact: '010-1234-5678' },
    { id: 2, name: '서초 배드민턴 클럽', location: '서울시 서초구', coordinates: [37.4837, 127.0324], memberCount: 40, category: '배드민턴', description: '서초 지역 배드민턴 클럽입니다.', meetingTime: '매주 일요일 14:00', contact: '010-2345-6789' },
    { id: 3, name: '송파 위너스', location: '서울시 송파구', coordinates: [37.5145, 127.1066], memberCount: 32, category: '배드민턴', description: '송파 지역 배드민턴 모임입니다.', meetingTime: '매주 수요일 19:00', contact: '010-3456-7890' },
    { id: 4, name: '성남 FC 팬클럽', location: '성남시', coordinates: [37.4201, 127.1266], memberCount: 100, category: '축구', description: '성남 FC 팬클럽입니다. 함께 응원하며 축구를 즐깁니다.', meetingTime: '경기일 및 매주 금요일 20:00', contact: '010-4567-8901' },
    { id: 5, name: '서울 농구 동호회', location: '서울시', coordinates: [37.5665, 126.9780], memberCount: 55, category: '농구', description: '서울 지역 농구 동호회입니다.', meetingTime: '매주 화요일, 목요일 19:00', contact: '010-5678-9012' },
    { id: 6, name: '광교 테니스 클럽', location: '수원시', coordinates: [37.2975, 127.0473], memberCount: 30, category: '테니스', description: '광교 지역 테니스 클럽입니다.', meetingTime: '매주 토요일, 일요일 09:00', contact: '010-6789-0123' },
    { id: 7, name: '북한산 등산 크루', location: '서울시', coordinates: [37.6584, 126.9920], memberCount: 70, category: '등산', description: '북한산 등산 크루입니다. 정기적으로 등산을 합니다.', meetingTime: '매월 첫째, 셋째 주 토요일 07:00', contact: '010-7890-1234' },
    { id: 8, name: '용인 배드민턴 짱', location: '용인시', coordinates: [37.2411, 127.1776], memberCount: 20, category: '배드민턴', description: '용인 지역 배드민턴 모임입니다.', meetingTime: '매주 금요일 20:00', contact: '010-8901-2345' },
    { id: 9, name: '수원 축구 매니아', location: '수원시', coordinates: [37.2636, 127.0286], memberCount: 80, category: '축구', description: '수원 지역 축구 모임입니다.', meetingTime: '매주 일요일 15:00', contact: '010-9012-3456' },
  ];

  const filteredGroups = selectedCategory === null || selectedCategory === '전체'
    ? allGroups
    : allGroups.filter((group) => group.category === selectedCategory);

  return (
    <div className="p-2 md:p-4">
      <div className="space-y-3 md:space-y-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
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
                  현재 인원: <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full">{group.memberCount}명</span>
                </p>
                <span className="px-2 py-1 bg-[var(--color-blue-primary)] text-white text-xs font-semibold rounded-full self-start md:self-auto">
                  카테고리: {group.category}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="p-4 text-[var(--color-text-secondary)] italic text-center">해당 카테고리의 모임이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default GroupList;
