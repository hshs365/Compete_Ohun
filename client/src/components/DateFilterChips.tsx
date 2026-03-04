import React, { useRef, useState, useEffect, useCallback } from 'react';

interface DateFilterChipsProps {
  /** 선택된 날짜 YYYY-MM-DD, null이면 전체 */
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  /** 초기 표시 일수 (오늘부터), 오른쪽 끝 도달 시 7일씩 추가 */
  daysCount?: number;
  /** 배경색 (App 대시보드 테마용) */
  themeBackground?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayKey(): string {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return getDateKey(t);
}

function buildDateEntry(d: Date, indexFromToday: number): { key: string; label: string; date: Date } {
  const key = getDateKey(d);
  let label: string;
  if (indexFromToday === 0) label = '오늘';
  else if (indexFromToday === 1) label = '내일';
  else label = `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
  return { key, label, date: new Date(d) };
}

const DateFilterChips: React.FC<DateFilterChipsProps> = ({
  selectedDate,
  onDateChange,
  daysCount = 14,
  themeBackground,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayChipRef = useRef<HTMLButtonElement>(null);
  const chipRefs = useRef<Map<string | null, HTMLButtonElement>>(new Map());
  const isLoadingMore = useRef(false);
  const lastClickTime = useRef<number>(0);
  const [dates, setDates] = useState<{ key: string; label: string; date: Date }[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arr: { key: string; label: string; date: Date }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      arr.push(buildDateEntry(d, i));
    }
    return arr;
  });
  const [showTodayBtn, setShowTodayBtn] = useState(false);
  const todayKey = getTodayKey();
  const loadMoreThreshold = 0.85;

  /** 오른쪽 끝 근처에서 7일 추가 */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMore.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const threshold = (scrollWidth - clientWidth) * loadMoreThreshold;
    if (scrollWidth > clientWidth && scrollLeft >= threshold) {
      isLoadingMore.current = true;
      setDates((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const base = new Date(last.date);
        base.setDate(base.getDate() + 1);
        const next: typeof prev = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(base);
          d.setDate(d.getDate() + i);
          next.push(buildDateEntry(d, prev.length + i));
        }
        return [...prev, ...next];
      });
      requestAnimationFrame(() => { isLoadingMore.current = false; });
    }
    const isFarFromToday = selectedDate !== null && selectedDate !== todayKey;
    setShowTodayBtn(isFarFromToday);
  }, [selectedDate, todayKey]);

  /** 스크롤 종료 시 스냅된 칩 감지 → onDateChange (선택 날짜 업데이트) */
  const handleScrollEnd = useCallback(() => {
    // 사용자가 칩을 클릭한 직후에는 스크롤 스냅으로 선택을 덮어쓰지 않음
    if (Date.now() - lastClickTime.current < 800) return;
    const el = scrollRef.current;
    if (!el) return;
    const containerRect = el.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    let bestKey: string | null = null;
    let bestDist = Infinity;
    chipRefs.current.forEach((chipEl, key) => {
      if (!chipEl) return;
      const r = chipEl.getBoundingClientRect();
      const chipCenter = r.left + r.width / 2;
      const dist = Math.abs(chipCenter - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = key;
      }
    });
    // 특정 날짜를 선택한 상태에서 스크롤만으로 '전체'로 바꾸지 않음 (내일/오늘 등이 유지되도록)
    if (selectedDate !== null && bestKey === null) return;
    if (bestKey !== null) onDateChange(bestKey);
    else onDateChange(null);
  }, [onDateChange, selectedDate]);

  const handleChipClick = useCallback((key: string | null) => {
    lastClickTime.current = Date.now();
    onDateChange(key);
  }, [onDateChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      handleScroll();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScrollEnd, 150);
    };
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, handleScrollEnd]);

  /** 마우스 휠 → 가로 스크롤 (passive: false로 preventDefault 적용) */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /** 오늘 플로팅 버튼 클릭 */
  const scrollToToday = useCallback(() => {
    lastClickTime.current = Date.now();
    onDateChange(todayKey);
    todayChipRef.current?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [todayKey, onDateChange]);

  const containerClass = themeBackground
    ? 'date-filter-chips-theme'
    : '';

  return (
    <div className={`relative ${containerClass}`} style={themeBackground ? { background: themeBackground } : undefined}>
      {/* 좌측 그라데이션 페이드 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10"
        style={{
          background: `linear-gradient(to right, ${themeBackground || 'var(--color-bg-card)'} 0%, transparent 100%)`,
        }}
      />
      {/* 우측 그라데이션 페이드 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
        style={{
          background: `linear-gradient(to left, ${themeBackground || 'var(--color-bg-card)'} 0%, transparent 100%)`,
        }}
      />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overflow-y-hidden py-1 px-2 scrollbar-none snap-x snap-mandatory touch-pan-x"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`
          .date-filter-chips-theme .date-chip { color: white; }
          .date-filter-chips-theme .date-chip-selected { background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.5); }
          .date-filter-chips-theme .date-chip-unselected { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); border-color: transparent; }
          .scrollbar-none::-webkit-scrollbar { display: none; }
        `}</style>

        <button
          ref={(el) => {
            if (el) chipRefs.current.set(null, el);
          }}
          type="button"
          onClick={() => handleChipClick(null)}
          className={`date-chip flex-shrink-0 px-3 py-2.5 sm:py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0 flex items-center snap-start snap-always ${
            selectedDate === null
              ? themeBackground ? 'date-chip-selected' : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
              : themeBackground ? 'date-chip-unselected' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] border border-transparent'
          }`}
        >
          전체
        </button>
        {dates.map(({ key, label }) => (
          <button
            key={key}
            ref={(el) => {
              if (el) {
                chipRefs.current.set(key, el);
                if (key === todayKey) (todayChipRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
              }
            }}
            type="button"
            onClick={() => handleChipClick(key)}
            className={`date-chip flex-shrink-0 w-[72px] sm:w-auto px-3 py-2.5 sm:py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center snap-center ${
              selectedDate === key
                ? themeBackground ? 'date-chip-selected' : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
                : themeBackground ? 'date-chip-unselected' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 오늘 플로팅 버튼 */}
      {showTodayBtn && (
        <button
          type="button"
          onClick={scrollToToday}
          className={`absolute right-4 bottom-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg touch-manipulation z-20 ${
            themeBackground ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
          }`}
        >
          오늘
        </button>
      )}
    </div>
  );
};

export default DateFilterChips;
