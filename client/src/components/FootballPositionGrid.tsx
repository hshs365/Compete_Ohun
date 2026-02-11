import React from 'react';

/** 캡처 기준: 좌측 | 중앙 | 우측 구역별 포지션 그리드 (공격/미드/수비/골키퍼 색상, 미세한 구역선) */
const POSITION_GRID: Array<{
  zone: 'attack' | 'midfield' | 'defense' | 'goalkeeper' | 'utility';
  left: Array<{ nameKo: string; abbr: string }>;
  center: Array<{ nameKo: string; abbr: string }>;
  right: Array<{ nameKo: string; abbr: string }>;
}> = [
  {
    zone: 'attack',
    left: [{ nameKo: '좌측 윙 포워드', abbr: 'LWF' }],
    center: [
      { nameKo: '중앙 공격수', abbr: 'CF' },
      { nameKo: '세컨드 스트라이커', abbr: 'SS' },
    ],
    right: [{ nameKo: '우측 윙 포워드', abbr: 'RWF' }],
  },
  {
    zone: 'midfield',
    left: [{ nameKo: '좌측 측면 미드필더', abbr: 'LM' }],
    center: [
      { nameKo: '공격형 미드필더', abbr: 'AM' },
      { nameKo: '중앙 미드필더', abbr: 'CM' },
      { nameKo: '수비형 미드필더', abbr: 'DM' },
    ],
    right: [{ nameKo: '우측 측면 미드필더', abbr: 'RM' }],
  },
  {
    zone: 'defense',
    left: [
      { nameKo: '좌측 윙백', abbr: 'LWB' },
      { nameKo: '좌측 풀백', abbr: 'LB' },
    ],
    center: [{ nameKo: '중앙 수비수', abbr: 'CB' }],
    right: [
      { nameKo: '우측 윙백', abbr: 'RWB' },
      { nameKo: '우측 풀백', abbr: 'RB' },
    ],
  },
  {
    zone: 'goalkeeper',
    left: [],
    center: [{ nameKo: '골키퍼', abbr: 'GK' }],
    right: [],
  },
  {
    zone: 'utility',
    left: [],
    center: [{ nameKo: '유틸리티 플레이어', abbr: '' }],
    right: [],
  },
];

const ZONE_STYLES: Record<string, { bg: string; legendColor: string }> = {
  attack: { bg: 'rgba(190, 18, 60, 0.35)', legendColor: '#ef4444' },
  midfield: { bg: 'rgba(22, 163, 74, 0.35)', legendColor: '#22c55e' },
  defense: { bg: 'rgba(29, 78, 216, 0.35)', legendColor: '#3b82f6' },
  goalkeeper: { bg: 'rgba(234, 88, 12, 0.35)', legendColor: '#ea580c' },
  utility: { bg: 'rgba(30, 30, 30, 0.6)', legendColor: '#737373' },
};

/** 셀 테두리: 구역이 미세하게 보이도록 */
const CELL_BORDER = '1px solid rgba(255,255,255,0.06)';

export default function FootballPositionGrid() {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[#1a2332]">
      <div className="px-3 py-2 bg-[#222] border-b border-white/5">
        <h4 className="text-sm font-bold text-white">축구의 포지션</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-white" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-white/10">
              <th className="w-[28%] py-2 text-[10px] font-semibold text-white/70 uppercase tracking-wider" style={{ borderRight: CELL_BORDER }}>좌측</th>
              <th className="w-[44%] py-2 text-[10px] font-semibold text-white/70 uppercase tracking-wider" style={{ borderRight: CELL_BORDER }}>중앙</th>
              <th className="w-[28%] py-2 text-[10px] font-semibold text-white/70 uppercase tracking-wider">우측</th>
            </tr>
          </thead>
          <tbody>
            {POSITION_GRID.map((row) => (
              <tr key={row.zone}>
                <td
                  className="align-top p-1.5"
                  style={{ borderRight: CELL_BORDER, borderBottom: CELL_BORDER, backgroundColor: ZONE_STYLES[row.zone]?.bg }}
                >
                  {row.left.length > 0 ? (
                    <div className="space-y-1.5">
                      {row.left.map((p) => (
                        <div key={p.abbr || p.nameKo} className="text-center">
                          <div className="text-xs font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>{p.nameKo}</div>
                          {p.abbr && <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{p.abbr}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block w-full min-h-[2rem]" aria-hidden />
                  )}
                </td>
                <td
                  className="align-top p-1.5"
                  style={{ borderRight: CELL_BORDER, borderBottom: CELL_BORDER, backgroundColor: ZONE_STYLES[row.zone]?.bg }}
                >
                  {row.center.length > 0 ? (
                    <div className="space-y-1.5">
                      {row.center.map((p) => (
                        <div key={p.abbr || p.nameKo} className="text-center">
                          <div className="text-xs font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>{p.nameKo}</div>
                          {p.abbr && <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{p.abbr}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block w-full min-h-[2rem]" aria-hidden />
                  )}
                </td>
                <td
                  className="align-top p-1.5"
                  style={{ borderBottom: CELL_BORDER, backgroundColor: ZONE_STYLES[row.zone]?.bg }}
                >
                  {row.right.length > 0 ? (
                    <div className="space-y-1.5">
                      {row.right.map((p) => (
                        <div key={p.abbr || p.nameKo} className="text-center">
                          <div className="text-xs font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>{p.nameKo}</div>
                          {p.abbr && <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{p.abbr}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-block w-full min-h-[2rem]" aria-hidden />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 bg-[#222] border-t border-white/5 flex items-center justify-center gap-3 flex-wrap text-[10px] font-medium text-white/80">
        <span style={{ color: ZONE_STYLES.attack.legendColor }}>공격수</span>
        <span className="text-white/30">|</span>
        <span style={{ color: ZONE_STYLES.midfield.legendColor }}>미드필더</span>
        <span className="text-white/30">|</span>
        <span style={{ color: ZONE_STYLES.defense.legendColor }}>수비수</span>
        <span className="text-white/30">|</span>
        <span style={{ color: ZONE_STYLES.goalkeeper.legendColor }}>골키퍼</span>
      </div>
    </div>
  );
}
