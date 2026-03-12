import React, { useState } from 'react';
import AppLogo from './AppLogo';
import { SPORT_ICONS } from '../constants/sports';
import { SPORT_GUIDE } from '../constants/sportGuide';

const APP_NAME = '올코트플레이';

const GuidePage = () => {
  const [selectedSport, setSelectedSport] = useState<string>(SPORT_GUIDE[0].sport);
  const current = SPORT_GUIDE.find((g) => g.sport === selectedSport) ?? SPORT_GUIDE[0];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <AppLogo className="h-10 w-auto object-contain" />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">종목별 룰 & 준비물 가이드</h1>
      </div>
      <p className="text-[var(--color-text-secondary)] text-sm mb-6">
        상단에서 종목을 선택하면 해당 종목의 코트 규격, 룰, 서브 규칙, 준비물을 볼 수 있어요.
      </p>

      {/* 종목 선택 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
        {SPORT_GUIDE.map(({ sport }) => (
          <button
            key={sport}
            type="button"
            onClick={() => setSelectedSport(sport)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectedSport === sport
                ? 'bg-[var(--color-blue-primary)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            <span>{SPORT_ICONS[sport] ?? '●'}</span>
            <span>{sport}</span>
          </button>
        ))}
      </div>

      {/* 선택된 종목 상세 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-[var(--color-border-card)] bg-[var(--color-bg-primary)]/50">
          <span className="text-3xl">{SPORT_ICONS[current.sport] ?? '●'}</span>
          <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{current.sport}</h2>
        </div>
        <div className="p-5 md:p-6 space-y-6">
          {/* 코트 규격 */}
          <section>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">코트 규격</h3>
            {/* 코트 규격 이미지 등록 영역 (직접 이미지 추가) */}
            <div className="mb-4 min-h-[200px] rounded-xl border border-dashed border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]/30" />
            <ul className="space-y-2">
              {current.court.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="text-[var(--color-blue-primary)] shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 기본 룰 */}
          <section>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">기본 룰</h3>
            <ul className="space-y-2">
              {current.rules.map((rule, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <span className="text-[var(--color-blue-primary)] shrink-0">·</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 서브·재개 규칙 (해당 종목에만) */}
          {current.serveRules.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">서브·재개 규칙</h3>
              <ul className="space-y-2">
                {current.serveRules.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="text-[var(--color-blue-primary)] shrink-0">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 준비물 */}
          <section>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">준비물</h3>
            <div className="flex flex-wrap gap-2">
              {current.equipment.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-sm text-[var(--color-text-primary)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] mt-6 text-center">
        세부 룰·인원·시간은 각 매치 생성 시 설정된 내용을 확인해 주세요.
      </p>
    </div>
  );
};

export default GuidePage;
