import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExpandableQRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  /** 확대 시 표시할 캡션 */
  caption?: string;
  className?: string;
}

/** 모바일에서 터치 시 화면에 크게 보이도록 하는 QR 코드 래퍼 */
const ExpandableQRCode: React.FC<ExpandableQRCodeProps> = ({
  value,
  size = 80,
  level = 'M',
  caption,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const displaySize = Math.min(320, typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) * 0.7 : 280);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`touch-manipulation cursor-pointer p-2 bg-white dark:bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-card)] hover:opacity-90 active:opacity-95 transition-opacity ${className}`}
        aria-label="QR 코드 크게 보기"
      >
        <QRCodeSVG value={value} size={size} level={level} />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setExpanded(false)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-white p-5 shadow-2xl">
              <QRCodeSVG value={value} size={displaySize} level={level} />
            </div>
            {caption && (
              <p className="mt-4 text-sm text-white/90 text-center max-w-[280px]">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExpandableQRCode;
