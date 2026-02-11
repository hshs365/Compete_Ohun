import React from 'react';
import { formatNumber, formatNumberHasUnit } from '../utils/formatNumber';

interface FormatNumberProps {
  value: number;
  className?: string;
}

/** 숫자를 1.0K / 1.2M 형식으로 표시하고, 단위가 붙을 때 font-medium 적용 */
const FormatNumber: React.FC<FormatNumberProps> = ({ value, className = '' }) => {
  const text = formatNumber(value);
  const hasUnit = formatNumberHasUnit(value);
  return <span className={hasUnit ? `font-medium ${className}`.trim() : className}>{text}</span>;
};

export default FormatNumber;
