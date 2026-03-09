import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showError, showSuccess } from '../utils/swal';

interface MercenaryQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function parseQRPayload(text: string): { groupId: number; token: string } | null {
  try {
    const data = JSON.parse(text) as { g?: number; t?: string };
    if (typeof data?.g === 'number' && typeof data?.t === 'string') {
      return { groupId: data.g, token: data.t };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const MercenaryQRScanner: React.FC<MercenaryQRScannerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    scannedRef.current = false;
    const container = document.getElementById('qr-reader');
    if (!container) return;

    const html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (scannedRef.current || isVerifying) return;
          const payload = parseQRPayload(decodedText);
          if (!payload) return;

          scannedRef.current = true;
          setIsVerifying(true);
          try {
            await html5QrCode.stop();
            const res = await api.post<{ success: boolean; nickname: string }>(
              `/api/groups/${payload.groupId}/qr-verify`,
              { token: payload.token }
            );
            if (res.success) {
              await showSuccess(`${res.nickname}님 인증이 완료되었습니다!`, '인증 완료');
              onSuccess?.();
              onClose();
            }
          } catch (err: unknown) {
            scannedRef.current = false;
            const msg = err instanceof Error ? err.message : '인증에 실패했습니다.';
            await showError(msg, '인증 실패');
          } finally {
            setIsVerifying(false);
          }
        },
        () => {}
      )
      .then(() => setIsScanning(true))
      .catch((err) => {
        console.error('QR 스캐너 시작 실패:', err);
        showError('카메라를 시작할 수 없습니다. 권한을 확인해 주세요.', '카메라 오류');
      });

    return () => {
      scannedRef.current = true;
      html5QrCode
        .stop()
        .then(() => html5QrCode.clear())
        .catch(() => {});
      scannerRef.current = null;
      setIsScanning(false);
    };
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* 상단 가이드 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/90 safe-area-top">
        <span className="text-white font-semibold">호스트의 QR 코드를 비춰주세요</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 스캐너 영역 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          id="qr-reader"
          className="w-full max-w-sm overflow-hidden rounded-xl [&_.qr-shaded-region]:border-2 [&_.qr-shaded-region]:border-[var(--color-blue-primary)]"
        />
      </div>

      {isVerifying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-white font-medium">인증 완료 대기 중...</span>
        </div>
      )}
    </div>
  );
};

export default MercenaryQRScanner;
