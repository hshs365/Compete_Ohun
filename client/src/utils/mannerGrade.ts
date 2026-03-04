/**
 * 매너 등급 시각화: 그린/옐로/레드 카드 시스템
 * - 그린: 60+ (매너가 좋은 선수)
 * - 옐로: 20~60 (한 단계 더 노력)
 * - 레드: 20 미만 (매너 개선의 여지)
 */
export type MannerGrade = 'green' | 'yellow' | 'red';

export interface MannerGradeConfig {
  grade: MannerGrade;
  label: string;
  desc: string;
  icon: string;
  bg: string;
  border: string;
  iconBg: string;
  textColor: string;
  badgeClass: string;
}

const CONFIGS: Record<MannerGrade, MannerGradeConfig> = {
  green: {
    grade: 'green',
    label: '그린카드',
    desc: '매너가 좋은 선수',
    icon: '🟢',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    iconBg: 'bg-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40',
  },
  yellow: {
    grade: 'yellow',
    label: '옐로카드',
    desc: '한 단계 더 노력해요',
    icon: '🟡',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    iconBg: 'bg-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40',
  },
  red: {
    grade: 'red',
    label: '레드카드',
    desc: '매너 개선의 여지가 있어요',
    icon: '🔴',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    iconBg: 'bg-red-500/30',
    textColor: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40',
  },
};

export function getMannerGrade(score: number): MannerGrade {
  if (score >= 60) return 'green';
  if (score >= 20) return 'yellow';
  return 'red';
}

export function getMannerGradeConfig(score: number): MannerGradeConfig {
  return CONFIGS[getMannerGrade(score)];
}
