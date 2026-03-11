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
    bg: 'bg-emerald-100 dark:bg-emerald-500/25',
    border: 'border-emerald-300 dark:border-emerald-500/50',
    iconBg: 'bg-emerald-500/30',
    textColor: '!text-black dark:!text-emerald-300',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-500/25 !text-black dark:!text-emerald-300 border border-emerald-400 dark:border-emerald-500/50',
  },
  yellow: {
    grade: 'yellow',
    label: '옐로카드',
    desc: '한 단계 더 노력해요',
    icon: '🟡',
    bg: 'bg-amber-100 dark:bg-amber-500/25',
    border: 'border-amber-300 dark:border-amber-500/50',
    iconBg: 'bg-amber-500/30',
    textColor: 'text-slate-900 dark:text-amber-300',
    badgeClass: 'bg-amber-100 dark:bg-amber-500/25 text-slate-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/50',
  },
  red: {
    grade: 'red',
    label: '레드카드',
    desc: '매너 개선의 여지가 있어요',
    icon: '🔴',
    bg: 'bg-red-100 dark:bg-red-500/25',
    border: 'border-red-300 dark:border-red-500/50',
    iconBg: 'bg-red-500/30',
    textColor: '!text-black dark:!text-red-300',
    badgeClass: 'bg-red-100 dark:bg-red-500/25 !text-black dark:!text-red-300 border border-red-400 dark:border-red-500/50',
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
