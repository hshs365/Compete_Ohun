import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SPORT_ICONS, SPORT_CHIP_STYLES, MAIN_CATEGORIES } from '../constants/sports';
import { EQUIPMENT_OPTIONS } from '../constants/equipment';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';
import type { User } from '../contexts/AuthContext';

const GRADE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  축구: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  풋살: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  배드민턴: [
    { value: 'A', label: 'A조' },
    { value: 'B', label: 'B조' },
    { value: 'C', label: 'C조' },
    { value: 'D', label: 'D조' },
    { value: 'E', label: 'E조' },
    { value: 'none', label: '급수 없음' },
  ],
  야구: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  농구: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  테니스: [
    { value: 'advanced', label: '고급' },
    { value: 'intermediate', label: '중급' },
    { value: 'beginner', label: '초급' },
    { value: 'none', label: '급수 없음' },
  ],
  핸드볼: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  배구: [
    { value: 'S', label: 'S' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'none', label: '급수 없음' },
  ],
  탁구: [
    { value: 'advanced', label: '고급' },
    { value: 'intermediate', label: '중급' },
    { value: 'beginner', label: '초급' },
    { value: 'none', label: '급수 없음' },
  ],
  골프: [
    { value: 'advanced', label: '고급' },
    { value: 'intermediate', label: '중급' },
    { value: 'beginner', label: '초급' },
    { value: 'none', label: '급수 없음' },
  ],
};

const POSITION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  축구: [
    { value: 'GK', label: 'GK' },
    { value: 'DF', label: 'DF' },
    { value: 'MF', label: 'MF' },
    { value: 'FW', label: 'FW' },
  ],
  풋살: [
    { value: 'GK', label: 'GK' },
    { value: 'DF', label: 'DF' },
    { value: 'MF', label: 'MF' },
    { value: 'FW', label: 'FW' },
  ],
  야구: [
    { value: 'P', label: '투수' },
    { value: 'C', label: '포수' },
    { value: '1B', label: '1루수' },
    { value: '2B', label: '2루수' },
    { value: '3B', label: '3루수' },
    { value: 'SS', label: '유격수' },
    { value: 'LF', label: '좌익수' },
    { value: 'CF', label: '중견수' },
    { value: 'RF', label: '우익수' },
  ],
  농구: [
    { value: 'PG', label: '포인트가드' },
    { value: 'SG', label: '슈팅가드' },
    { value: 'SF', label: '스몰포워드' },
    { value: 'PF', label: '파워포워드' },
    { value: 'C', label: '센터' },
  ],
  핸드볼: [
    { value: 'GK', label: '골키퍼' },
    { value: 'LW', label: '레프트윙' },
    { value: 'RW', label: '라이트윙' },
    { value: 'PV', label: '피벗' },
    { value: 'CB', label: '센터백' },
  ],
  배구: [
    { value: 'S', label: '세터' },
    { value: 'OH', label: '아웃사이드 히터' },
    { value: 'MB', label: '미들 블로커' },
    { value: 'OP', label: '오포지트' },
    { value: 'L', label: '리베로' },
  ],
  탁구: [],
  골프: [],
  배드민턴: [],
};

const POINT_COLOR = '#22c55e';

interface MercenaryProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

const MercenaryProfileEditModal: React.FC<MercenaryProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [mainSports, setMainSports] = useState<string[]>([]);
  const [ohunRanks, setOhunRanks] = useState<Record<string, string>>({});
  const [sportPositions, setSportPositions] = useState<{ sport: string; positions: string[] }[]>([]);
  const [sportEquipment, setSportEquipment] = useState<{ sport: string; equipment: string[] }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setMainSports(user.interestedSports ?? []);
    setOhunRanks(user.ohunRanks ?? user.effectiveRanks ?? {});
    setSportPositions(user.sportPositions ?? []);
    setSportEquipment(user.sportEquipment ?? []);
  }, [isOpen, user]);

  const toggleSport = (sport: string) => {
    setMainSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const setGrade = (sport: string, grade: string) => {
    setOhunRanks((prev) => ({ ...prev, [sport]: grade }));
  };

  const togglePosition = (sport: string, pos: string) => {
    setSportPositions((prev) => {
      const existing = prev.find((sp) => sp.sport === sport);
      const positions = existing?.positions ?? [];
      const next = positions.includes(pos)
        ? positions.filter((p) => p !== pos)
        : [...positions, pos];
      const without = prev.filter((sp) => sp.sport !== sport);
      if (next.length === 0) return without;
      return [...without, { sport, positions: next }];
    });
  };

  const toggleEquipment = (sport: string, item: string) => {
    setSportEquipment((prev) => {
      const existing = prev.find((sp) => sp.sport === sport);
      const items = existing?.equipment ?? [];
      const next = items.includes(item)
        ? items.filter((e) => e !== item)
        : [...items, item];
      const without = prev.filter((sp) => sp.sport !== sport);
      if (next.length === 0) return without;
      return [...without, { sport, equipment: next }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ranks: Record<string, string> = {};
      for (const sport of mainSports) {
        if (ohunRanks[sport]) ranks[sport] = ohunRanks[sport];
      }
      await api.patch('/api/auth/me/mercenary-profile', {
        interestedSports: mainSports,
        ohunRanks: ranks,
        sportPositions: sportPositions.filter((sp) => sp.positions.length > 0),
        sportEquipment: sportEquipment.filter((sp) => sp.equipment.length > 0),
      });
      await showSuccess('플레이어 프로필이 저장되었습니다.', '저장 완료');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sportsList = (MAIN_CATEGORIES as readonly string[]).filter((s) => s !== '전체');

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-t-2xl md:rounded-2xl shadow-xl pb-[env(safe-area-inset-bottom,0)]"
        role="dialog"
        aria-labelledby="mercenary-profile-edit-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <h2 id="mercenary-profile-edit-title" className="text-lg font-bold text-[var(--color-text-primary)]">
            플레이어 프로필 편집
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-3 -m-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              주력 종목
            </label>
            <div className="flex flex-wrap gap-2">
              {sportsList.map((sport) => {
                const active = mainSports.includes(sport);
                const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      active ? `${chip.bg} ${chip.border} ${chip.text}` : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent'
                    }`}
                  >
                    {SPORT_ICONS[sport] ?? '●'} {sport}
                  </button>
                );
              })}
            </div>
          </div>

          {mainSports.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  종목별 실력 등급
                </label>
                <div className="space-y-3">
                  {mainSports.map((sport) => {
                    const opts = GRADE_OPTIONS[sport] ?? [{ value: 'C', label: 'C' }];
                    return (
                      <div key={sport} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--color-text-secondary)] w-20 shrink-0">
                          {SPORT_ICONS[sport]} {sport}
                        </span>
                        <select
                          value={ohunRanks[sport] ?? ''}
                          onChange={(e) => setGrade(sport, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2"
                          style={{ ['--tw-ring-color' as string]: POINT_COLOR }}
                        >
                          <option value="">선택</option>
                          {opts.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {mainSports.some((s) => EQUIPMENT_OPTIONS[s]) && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    종목별 보유 장비
                  </label>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                    플레이어 참가 시 필요할 수 있는 품목을 선택해 주세요.
                  </p>
                  <div className="space-y-3">
                    {mainSports
                      .filter((s) => EQUIPMENT_OPTIONS[s])
                      .map((sport) => {
                        const selected = sportEquipment.find((sp) => sp.sport === sport)?.equipment ?? [];
                        const opts = EQUIPMENT_OPTIONS[sport] ?? [];
                        return (
                          <div key={sport}>
                            <span className="text-xs text-[var(--color-text-secondary)] block mb-1.5">
                              {SPORT_ICONS[sport]} {sport}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {opts.map((o) => {
                                const active = selected.includes(o.value);
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => toggleEquipment(sport, o.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                      active ? 'text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent'
                                    }`}
                                    style={active ? { backgroundColor: POINT_COLOR, borderColor: POINT_COLOR } : undefined}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {mainSports.some((s) => POSITION_OPTIONS[s]) && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    선호 포지션
                  </label>
                  <div className="space-y-3">
                    {mainSports
                      .filter((s) => POSITION_OPTIONS[s])
                      .map((sport) => {
                        const positions = sportPositions.find((sp) => sp.sport === sport)?.positions ?? [];
                        const opts = POSITION_OPTIONS[sport] ?? [];
                        return (
                          <div key={sport}>
                            <span className="text-xs text-[var(--color-text-secondary)] block mb-1.5">
                              {SPORT_ICONS[sport]} {sport}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {opts.map((o) => {
                                const active = positions.includes(o.value);
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => togglePosition(sport, o.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                      active ? 'text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent'
                                    }`}
                                    style={active ? { backgroundColor: POINT_COLOR, borderColor: POINT_COLOR } : undefined}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium border border-[var(--color-border-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: POINT_COLOR }}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MercenaryProfileEditModal;
