import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/outline';

interface MapControlPanelProps {
  selectedCity?: string | null; // 좌측 사이드바에서 선택된 지역
  onToggleRankerMeetings?: (enabled: boolean) => void;
  onToggleEventMatches?: (enabled: boolean) => void;
  onTogglePopularSpots?: (enabled: boolean) => void;
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  selectedCity,
  onToggleRankerMeetings,
  onToggleEventMatches,
  onTogglePopularSpots,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rankersEnabled, setRankersEnabled] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const [popularSpotsEnabled, setPopularSpotsEnabled] = useState(false);

  const handleToggleRankers = (enabled: boolean) => {
    setRankersEnabled(enabled);
    if (onToggleRankerMeetings) {
      onToggleRankerMeetings(enabled);
    }
  };

  const handleToggleEvents = (enabled: boolean) => {
    setEventsEnabled(enabled);
    if (onToggleEventMatches) {
      onToggleEventMatches(enabled);
    }
  };

  const handleTogglePopularSpots = (enabled: boolean) => {
    setPopularSpotsEnabled(enabled);
    if (onTogglePopularSpots) {
      onTogglePopularSpots(enabled);
    }
  };

  return (
    <>
      {/* 패널 */}
      {isOpen && (
        <div className="fixed top-20 right-6 z-[9998] bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-xl w-64 p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">지도 옵션</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
              aria-label="패널 닫기"
            >
              <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>

          {/* 랭커가 참가한 모임 위치 */}
          <label className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg cursor-pointer transition-colors group">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-[var(--color-text-primary)]">랭커 참가 모임</span>
            </div>
            <input
              type="checkbox"
              checked={rankersEnabled}
              onChange={(e) => handleToggleRankers(e.target.checked)}
              className="w-4 h-4 text-[var(--color-blue-primary)] border-[var(--color-border-card)] rounded focus:ring-2 focus:ring-[var(--color-blue-primary)] cursor-pointer"
            />
          </label>

          {/* 이벤트매치 위치 */}
          <label className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg cursor-pointer transition-colors group">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-[var(--color-text-primary)]">이벤트매치</span>
            </div>
            <input
              type="checkbox"
              checked={eventsEnabled}
              onChange={(e) => handleToggleEvents(e.target.checked)}
              className="w-4 h-4 text-[var(--color-blue-primary)] border-[var(--color-border-card)] rounded focus:ring-2 focus:ring-[var(--color-blue-primary)] cursor-pointer"
            />
          </label>

          {/* 인기 장소 */}
          <label className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg cursor-pointer transition-colors group">
            <div className="flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-[var(--color-text-primary)]">인기 장소</span>
            </div>
            <input
              type="checkbox"
              checked={popularSpotsEnabled}
              onChange={(e) => handleTogglePopularSpots(e.target.checked)}
              className="w-4 h-4 text-[var(--color-blue-primary)] border-[var(--color-border-card)] rounded focus:ring-2 focus:ring-[var(--color-blue-primary)] cursor-pointer"
            />
          </label>

          {/* 현재 선택된 지역 표시 */}
          {selectedCity && selectedCity !== '전체' && (
            <>
              <div className="border-t border-[var(--color-border-card)] my-2" />
              <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">현재 지역</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{selectedCity}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  옵션 체크 시 {selectedCity} 지역의 정보가 표시됩니다.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 토글 버튼 - 패널이 열려있을 때는 숨김 */}
      {!isOpen && (
        <div className="fixed top-20 right-6 z-[9998]">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg flex items-center justify-center hover:bg-[var(--color-bg-secondary)] transition-colors"
            aria-label="지도 옵션"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>
      )}

    </>
  );
};

export default MapControlPanel;

