import React, { useState } from 'react';
import { UserGroupIcon, UserIcon, TrophyIcon, StarIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { isTeamSport, getMinParticipantsForSport } from '../../constants/sports';
import FootballPitch from '../FootballPitch';

// 팀 게임 포지션 정의
const TEAM_POSITIONS: Record<string, string[]> = {
  '축구': ['GK', 'DF', 'MF', 'FW'],
  '풋살': ['GK', 'DF', 'MF', 'FW'],
  '농구': ['PG', 'SG', 'SF', 'PF', 'C'],
  '야구': ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  '배구': ['S', 'OH', 'MB', 'OP', 'L'],
  '볼링': ['팀원'],
};

type FreeMatchSubType = 'threeWay' | 'twoWay';

interface Step2GameSettingsProps {
  category: string;
  gameType: 'team' | 'individual';
  onGameTypeChange: (type: 'team' | 'individual') => void;
  /** true면 매치 방식 선택(포지션 지정 vs 자유)만 표시하고, 포지션/밸런스/최소인원은 3단계로 분리 */
  onlyMatchType?: boolean;
  /** 일반매치일 때만 사용. null이면 아직 미선택 */
  matchType?: 'general' | 'rank' | 'event';
  /** 모달 테마 강조색(예: 랭크=주황). 없으면 기본 파란색 사용 */
  accentHex?: string;
  freeMatchSubType?: FreeMatchSubType | null;
  onFreeMatchSubTypeChange?: (v: FreeMatchSubType) => void;
  teamSettings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorTeam?: 'red' | 'blue';
  };
  onTeamSettingsChange: (settings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorTeam?: 'red' | 'blue';
  }) => void;
}

const Step2GameSettings: React.FC<Step2GameSettingsProps> = ({
  category,
  gameType,
  onGameTypeChange,
  onlyMatchType = false,
  matchType,
  accentHex,
  freeMatchSubType,
  onFreeMatchSubTypeChange,
  teamSettings,
  onTeamSettingsChange,
}) => {
  const isTeam = isTeamSport(category);
  const accent = accentHex ?? 'var(--color-blue-primary)';
  const accentStyle = accentHex ? { borderColor: accentHex, backgroundColor: `${accentHex}18`, color: accentHex } : undefined;
  const accentBorderOnly = accentHex ? { borderColor: accentHex } : undefined;
  const accentBgStyle = accentHex ? { backgroundColor: `${accentHex}18` } : undefined;
  const availablePositions = isTeam ? (TEAM_POSITIONS[category] || []) : [];
  const isGeneralFootball = category === '축구' && matchType === 'general';
  const [showCreatorPitchModal, setShowCreatorPitchModal] = useState(false);
  const [creatorPitchTeam, setCreatorPitchTeam] = useState<'red' | 'blue'>(
    (teamSettings.creatorTeam as 'red' | 'blue') || 'red'
  );

  const handlePositionToggle = (position: string) => {
    const newPositions = teamSettings.positions.includes(position)
      ? teamSettings.positions.filter(p => p !== position)
      : [...teamSettings.positions, position];
    
    onTeamSettingsChange({
      ...teamSettings,
      positions: newPositions,
    });
  };

  if (!isTeam) {
    // 개인 운동은 이 단계를 건너뛰거나 간단한 설정만 제공
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            매치 진행 방식
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {category}는 개인 또는 1:1 매칭 방식으로 진행됩니다.
          </p>
        </div>
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <div className="flex items-center gap-3">
            <UserIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">개인 운동 매치</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                참가자들이 자유롭게 매칭되어 운동할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGeneralFootball && onFreeMatchSubTypeChange) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
          매치 진행 방식
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onFreeMatchSubTypeChange('threeWay')}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              freeMatchSubType === 'threeWay' && !accentHex
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : freeMatchSubType !== 'threeWay'
                  ? 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]' + (!accentHex ? ' hover:border-[var(--color-blue-primary)]/50' : '')
                  : ''
            }`}
            style={freeMatchSubType === 'threeWay' && accentStyle ? accentStyle : undefined}
          >
            <div className="flex items-start gap-4">
              <UserGroupIcon className={`w-8 h-8 flex-shrink-0 ${freeMatchSubType === 'threeWay' ? '' : 'text-[var(--color-text-secondary)]'}`} style={freeMatchSubType === 'threeWay' ? { color: accentHex || 'var(--color-blue-primary)' } : undefined} />
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                  3파전
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  블루·옐로·레드 세 팀이 돌아가며 경기합니다.
                </p>
              </div>
              {freeMatchSubType === 'threeWay' && (
                <span className="text-xl" style={{ color: accentHex || 'var(--color-blue-primary)' }}>✓</span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onFreeMatchSubTypeChange('twoWay')}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              freeMatchSubType === 'twoWay' && !accentHex
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : freeMatchSubType !== 'twoWay'
                  ? 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]' + (!accentHex ? ' hover:border-[var(--color-blue-primary)]/50' : '')
                  : ''
            }`}
            style={freeMatchSubType === 'twoWay' && accentStyle ? accentStyle : undefined}
          >
            <div className="flex items-start gap-4">
              <UserPlusIcon className={`w-8 h-8 flex-shrink-0 ${freeMatchSubType === 'twoWay' ? '' : 'text-[var(--color-text-secondary)]'}`} style={freeMatchSubType === 'twoWay' ? { color: accentHex || 'var(--color-blue-primary)' } : undefined} />
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                  2파전
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  후보 선수 교체 투입 방식으로 두 팀이 경기합니다.
                </p>
              </div>
              {freeMatchSubType === 'twoWay' && (
                <span className="text-xl" style={{ color: accentHex || 'var(--color-blue-primary)' }}>✓</span>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          매치 진행 방식 설정
        </h3>
        {!isGeneralFootball && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {category}는 팀 기반 매치입니다. 매치 진행 방식은 포지션 지정 매치 또는 자유 매칭 중 선택하세요.
          </p>
        )}
      </div>

      {/* 매치 진행 방식 선택 — 일반매치가 아닐 때만 포지션 지정 옵션 표시 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          매치 진행 방식 선택
        </label>
        <div className="grid grid-cols-2 gap-4">
          {matchType !== 'general' && (
            <button
              type="button"
              onClick={() => onGameTypeChange('team')}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                gameType === 'team' && !accentHex
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                  : gameType !== 'team'
                    ? 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]' + (!accentHex ? ' hover:border-[var(--color-blue-primary)]/50' : '')
                    : ''
              }`}
              style={gameType === 'team' && accentStyle ? accentStyle : undefined}
            >
              <div className="flex items-start gap-4">
                <UserGroupIcon className={`w-8 h-8 flex-shrink-0 ${gameType === 'team' ? '' : 'text-[var(--color-text-secondary)]'}`} style={gameType === 'team' ? { color: accentHex || 'var(--color-blue-primary)' } : undefined} />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                    포지션 지정 매치
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    상세보기에서 블루팀/레드팀 전술 포지션을 열고, 참가자들이 팀과 포지션을 직접 선택합니다.
                  </p>
                </div>
                {gameType === 'team' && (
                  <span className="text-xl" style={{ color: accentHex || 'var(--color-blue-primary)' }}>✓</span>
                )}
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => onGameTypeChange('individual')}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              gameType === 'individual' && !accentHex
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : gameType !== 'individual'
                  ? 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]' + (!accentHex ? ' hover:border-[var(--color-blue-primary)]/50' : '')
                  : ''
            }`}
            style={gameType === 'individual' && accentStyle ? accentStyle : undefined}
          >
            <div className="flex items-start gap-4">
              <UserIcon className={`w-8 h-8 flex-shrink-0 ${gameType === 'individual' ? '' : 'text-[var(--color-text-secondary)]'}`} style={gameType === 'individual' ? { color: accentHex || 'var(--color-blue-primary)' } : undefined} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                  자유 매칭
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  무작위로 인원을 모집해 만난 뒤, 현장에서 포지션을 정하는 방식입니다.
                </p>
              </div>
              {gameType === 'individual' && (
                <span className="text-xl" style={{ color: accentHex || 'var(--color-blue-primary)' }}>✓</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 팀 게임 설정 — onlyMatchType이면 3단계에서 따로 보여주므로 여기서는 숨김 */}
      {!onlyMatchType && gameType === 'team' && (
        <div className="space-y-6 pt-4 border-t border-[var(--color-border-card)]">
          {/* 모임장 포지션·팀 (축구 등 포지션 지정 매치) */}
          {category === '축구' && (
            <div className="space-y-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-card)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">모임장 참가 포지션</h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                매치 생성 시 모임장이 참가할 포지션과 팀을 미리 선택합니다. 구장 그림에서 클릭해 선택할 수 있습니다.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorPitchTeam((teamSettings.creatorTeam as 'red' | 'blue') || 'red');
                    setShowCreatorPitchModal(true);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={accentHex ? { backgroundColor: accentHex } : { backgroundColor: 'var(--color-blue-primary)' }}
                >
                  구장에서 선택
                </button>
                {teamSettings.creatorPositionCode && (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    선택됨: {(teamSettings.creatorTeam || 'red') === 'red' ? '레드팀' : '블루팀'} {teamSettings.creatorPositionCode}
                  </span>
                )}
              </div>

              {/* 모임장 포지션 선택용 구장 모달 */}
              {showCreatorPitchModal && (
                <div
                  className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
                  style={{ background: 'rgba(0,0,0,0.82)' }}
                  onClick={() => setShowCreatorPitchModal(false)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="creator-pitch-modal-title"
                >
                  <div
                    className="relative w-full max-w-[92vw] max-h-[92vh] min-h-[70vh] overflow-hidden rounded-xl flex flex-col"
                    style={{
                      maxWidth: 'min(92vw, 1200px)',
                      background: 'linear-gradient(180deg, #0c0c0e 0%, #0f0f12 8%, #111114 100%)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.5)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: accentHex ? `linear-gradient(90deg, transparent 0%, ${accentHex}80 50%, transparent 100%)` : 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.5) 50%, transparent 100%)' }} />
                    <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-white/[0.08]">
                      <h3 id="creator-pitch-modal-title" className="text-base sm:text-lg font-semibold tracking-tight text-white/95">
                        모임장 포지션 선택
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCreatorPitchModal(false)}
                        className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/[0.08] transition-colors"
                        aria-label="닫기"
                      >
                        <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col items-center p-5 sm:p-6 md:p-8 overflow-hidden">
                      <div className="w-full flex justify-center mb-5 flex-shrink-0">
                        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => setCreatorPitchTeam('red')}
                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            style={{
                              background: creatorPitchTeam === 'red' ? 'rgba(199,54,54,0.25)' : 'transparent',
                              color: creatorPitchTeam === 'red' ? '#fca5a5' : 'rgba(255,255,255,0.6)',
                            }}
                          >
                            레드팀
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatorPitchTeam('blue')}
                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            style={{
                              background: creatorPitchTeam === 'blue' ? 'rgba(59,108,184,0.25)' : 'transparent',
                              color: creatorPitchTeam === 'blue' ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                            }}
                          >
                            블루팀
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 flex flex-col w-full max-w-5xl mx-auto">
                        <div className="flex-1 min-h-0 flex items-center justify-center w-full">
                          <FootballPitch
                            mode="match"
                            participants={[]}
                            onSlotClick={(positionCode, slotLabel) => {
                              onTeamSettingsChange({
                                ...teamSettings,
                                creatorPositionCode: positionCode,
                                creatorSlotLabel: slotLabel,
                                creatorTeam: creatorPitchTeam,
                              });
                              setShowCreatorPitchModal(false);
                            }}
                            isUserParticipant={false}
                            recruitPositions={['GK', 'DF', 'MF', 'FW']}
                            size="default"
                            teamAccent={creatorPitchTeam}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 포지션 선택 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              모집할 포지션 (선택)
            </label>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              특정 포지션만 모집하려면 선택하세요. 선택하지 않으면 모든 포지션을 모집합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {availablePositions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => handlePositionToggle(position)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      teamSettings.positions.includes(position)
                        ? 'text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border-card)]'
                  }`}
                style={teamSettings.positions.includes(position) ? { backgroundColor: accentHex || 'var(--color-blue-primary)' } : undefined}
                >
                  {position}
                  {teamSettings.positions.includes(position) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 밸런스 조정 옵션 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              팀 밸런스 조정
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
                <input
                  type="checkbox"
                  checked={teamSettings.balanceByExperience}
                  onChange={(e) => onTeamSettingsChange({
                    ...teamSettings,
                    balanceByExperience: e.target.checked,
                  })}
                  className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-0"
                  style={accentHex ? { accentColor: accentHex } : { accentColor: 'var(--color-blue-primary)' }}
                />
                <div className="flex items-center gap-2 flex-1">
                  <TrophyIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">선수 출신 여부 고려</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      선수 출신 유저가 있다면 상대편에도 배치되어 한 팀으로 몰리지 않게 조정합니다.
                    </p>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
                <input
                  type="checkbox"
                  checked={teamSettings.balanceByRank}
                  onChange={(e) => onTeamSettingsChange({
                    ...teamSettings,
                    balanceByRank: e.target.checked,
                  })}
                  className="w-5 h-5 rounded focus:ring-2 focus:ring-offset-0"
                  style={accentHex ? { accentColor: accentHex } : { accentColor: 'var(--color-blue-primary)' }}
                />
                <div className="flex items-center gap-2 flex-1">
                  <StarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">랭커 여부 고려</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      랭커와 일반 유저를 균등하게 배분합니다.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 최소 인원 설정 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              팀당 최소 인원
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={teamSettings.minPlayersPerTeam}
              onChange={(e) => onTeamSettingsChange({
                ...teamSettings,
                minPlayersPerTeam: parseInt(e.target.value, 10) || 1,
              })}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: accentHex || 'var(--color-blue-primary)' }}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              각 팀에 필요한 최소 인원 수를 설정하세요. {category === '축구' ? '(기본 11명)' : '(1~20명)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2GameSettings;
