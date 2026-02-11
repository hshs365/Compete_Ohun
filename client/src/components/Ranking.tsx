import React from 'react';

const Ranking = () => {
  const topPlayers = [
    { rank: 1, name: '김민준', score: 2800, category: '배드민턴' },
    { rank: 2, name: '이서연', score: 2750, category: '배드민턴' },
    { rank: 3, name: '박도윤', score: 2600, category: '배드민턴' },
    { rank: 4, name: '최지우', score: 2580, category: '배드민턴' },
    { rank: 5, name: '정예준', score: 2550, category: '배드민턴' },
  ];

  return (
    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-500/50 backdrop-blur-md">
      <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)] tracking-tight">명예의 전당 🏆</h2>
      <ul className="space-y-2">
        {topPlayers.map((player) => (
          <li 
            className="flex justify-between items-center p-3 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)] transition-all duration-300 hover:scale-102 hover:border-[var(--color-blue-primary)]" 
            key={player.rank}
          >
            <div className="flex items-center">
              <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full mr-2">{player.rank}위</span>
              <span className="text-[var(--color-text-primary)]">{player.name}</span>
            </div>
            <span className="px-2 py-1 bg-[var(--color-blue-primary)] text-white text-xs font-semibold rounded-full">{player.score} RP</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Ranking;
