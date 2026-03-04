import React from 'react';
import { useTheme } from '../App';

/** 라이트(화이트) 테마: darklogo.png, 다크 테마: whitelogo.png */
const AppLogo: React.FC<{
  className?: string;
  alt?: string;
  height?: number;
}> = ({ className = '', alt = '올코트플레이', height }) => {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/whitelogo.png' : '/darklogo.png';
  const style = height != null ? { height } : undefined;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width="auto"
      height={height != null ? height : undefined}
    />
  );
};

export default AppLogo;
