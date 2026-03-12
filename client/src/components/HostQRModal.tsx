import React, { useState, useEffect, useRef, useCallback } from 'react';
import ExpandableQRCode from './ExpandableQRCode';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api, getSocketUrl } from '../utils/api';
import { io, Socket } from 'socket.io-client';

interface HostQRModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** QR 페이로드: 용병 앱이 스캔 후 POST /api/groups/:g/qr-verify 호출용 */
function buildQRPayload(groupId: number, token: string): string {
  return JSON.stringify({ g: groupId, t: token });
}

const HostQRModal: React.FC<HostQRModalProps> = ({ groupId, isOpen, onClose }) => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [verifiedNicknames, setVerifiedNicknames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCutoff, setQrCutoff] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchToken = useCallback(async (force = false) => {
    if (!groupId) return;
    if (qrCutoff && !force) return;
    setLoading(true);
    try {
      const res = await api.post<{ token: string; expiresAt: string }>(
        `/api/groups/${groupId}/qr-token`
      );
      setToken(res.token);
      setExpiresAt(res.expiresAt);
    } catch (err: unknown) {
      console.error('QR 토큰 발급 실패:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('30분') || (err as { response?: { status?: number } })?.response?.status === 400) {
        setQrCutoff(true);
        setToken(null);
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, qrCutoff]);

  useEffect(() => {
    if (!isOpen) return;
    setQrCutoff(false);
    fetchToken(true);
    const interval = setInterval(() => fetchToken(), 60 * 1000);
    refreshTimerRef.current = interval;
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !groupId) return;
    const socket = io(getSocketUrl(), { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join-group', { groupId });
    socket.on('mercenary-verified', (payload: { nickname: string }) => {
      setVerifiedNicknames((prev) => [...prev, payload.nickname]);
    });
    return () => {
      socket.off('mercenary-verified');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, groupId]);

  useEffect(() => {
    if (!isOpen) setVerifiedNicknames([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const qrPayload = token ? buildQRPayload(groupId, token) : '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-[#333] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <h3 className="text-lg font-bold text-white">QR 인증</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {qrCutoff ? (
            <div className="py-8 text-center">
              <p className="text-amber-400 font-semibold">매치 시작 30분이 지났습니다</p>
              <p className="text-gray-400 text-sm mt-2">QR 인증을 받을 수 없습니다.<br />30분 내에 스캔하지 않은 참가자는 노쇼로 처리해 주세요.</p>
            </div>
          ) : (
            <>
          <div className="flex justify-center">
            <div className="w-56 h-56 rounded-xl bg-white p-4 flex items-center justify-center">
              {loading || !token ? (
                <span className="text-sm text-gray-700">로딩 중...</span>
              ) : (
                <ExpandableQRCode
                  value={qrPayload}
                  size={200}
                  caption="용병이 스캔하면 자동으로 인증됩니다"
                  className="!p-0 !border-0 !bg-transparent"
                />
              )}
            </div>
          </div>

          {/* 인증 완료 실시간 표시 */}
          {verifiedNicknames.length > 0 && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {verifiedNicknames.map((nick, i) => (
                <div
                  key={`${nick}-${i}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 font-semibold animate-in fade-in"
                >
                  <span className="shrink-0">✓</span>
                  <span>{nick} 용병님 인증 완료!</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-300">
            용병이 스캔하면 자동으로 인증됩니다
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostQRModal;
