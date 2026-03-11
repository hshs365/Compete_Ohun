import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import { api, getSocketUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showError } from '../utils/swal';

interface MatchChatModalProps {
  groupId: number;
  creatorId: number;
  groupName: string;
  creatorNickname: string;
  onClose: () => void;
}

interface MessageItem {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  sender?: { id: number; nickname: string; profileImageUrl?: string | null };
}

interface ConversationData {
  id: number;
  groupId: number;
  participantId: number;
  creatorId: number;
}

const MatchChatModal: React.FC<MatchChatModalProps> = ({
  groupId,
  creatorId,
  groupName,
  creatorNickname,
  onClose,
}) => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 대화방 생성 또는 조회
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const conv = await api.post<ConversationData>('/api/chat/conversations', {
          groupId,
          creatorId,
        });
        if (!cancelled && conv) setConversation(conv);
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message;
        if (!cancelled) setError(msg ?? '대화방을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [groupId, creatorId]);

  // 메시지 목록 조회 및 폴링
  const fetchMessages = async (convId: number) => {
    try {
      const res = await api.get<MessageItem[] | { messages: MessageItem[]; otherLastReadAt: string | null }>(
        `/api/chat/conversations/${convId}/messages`
      );
      if (Array.isArray(res)) {
        setMessages(res);
        setOtherLastReadAt(null);
      } else {
        setMessages(res.messages ?? []);
        setOtherLastReadAt(res.otherLastReadAt ?? null);
      }
    } catch {
      setMessages([]);
      setOtherLastReadAt(null);
    }
  };

  useEffect(() => {
    if (!conversation?.id || !user) return;
    fetchMessages(conversation.id);
    // 내가 읽음 처리 (상대방의 메시지를 읽었음을 서버에 전달)
    api.patch(`/api/chat/conversations/${conversation.id}/read`).catch(() => {});
    pollRef.current = setInterval(() => fetchMessages(conversation.id), 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversation?.id, user]);

  // 소켓: 상대방이 읽었을 때 read-receipt 실시간 수신 (otherLastReadAt 즉시 반영)
  useEffect(() => {
    if (!conversation?.id || !user) return;
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (!token) return;
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socket.emit('join-user', { userId: user.id });
    socket.emit('join-conversation', { conversationId: conversation.id });
    socket.on('read-receipt', (payload: { conversationId: number; readAt: string }) => {
      if (payload.conversationId === conversation.id) {
        setOtherLastReadAt(payload.readAt);
      }
    });
    return () => {
      socket.off('read-receipt');
      socket.disconnect();
    };
  }, [conversation?.id, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !conversation || isSending) return;
    setIsSending(true);
    try {
      const msg = await api.post<MessageItem>(`/api/chat/conversations/${conversation.id}/messages`, {
        content,
      });
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      showError(msg ?? '메시지 전송에 실패했습니다.', '전송 실패');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 IME 조합 중 Enter 시 조합이 완료되지 않은 상태로 전송되는 것 방지
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 max-w-sm w-full mx-4 shadow-xl border border-[var(--color-border-card)]">
          <p className="text-[var(--color-text-secondary)] text-center mb-4">로그인 후 채팅할 수 있습니다.</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-[var(--color-bg-primary)]">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] truncate max-w-[200px]">
            {groupName}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">매치장: {creatorNickname}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]"
          aria-label="닫기"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)]">
            대화방 불러오는 중...
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
            <p className="text-[var(--color-text-secondary)] text-center">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* 메시지 목록 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <p className="text-center text-[var(--color-text-secondary)] text-sm py-8">
                  첫 메시지를 보내보세요!
                </p>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === user.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? 'bg-[var(--color-blue-primary)] text-white rounded-br-md'
                            : 'bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMe ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isMe && (
                            otherLastReadAt && new Date(m.createdAt).getTime() <= new Date(otherLastReadAt).getTime() ? (
                              <span className="text-white/90" title="읽음" aria-label="읽음">읽음</span>
                            ) : (
                              <span className="text-white/70" title="안 읽음" aria-label="안 읽음">1</span>
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 입력 영역 */}
            <div className="shrink-0 p-4 border-t border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요"
                  rows={2}
                  maxLength={1000}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  disabled={isSending}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="shrink-0 self-end p-3 rounded-xl bg-[var(--color-blue-primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  aria-label="전송"
                >
                  <PaperAirplaneIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchChatModal;
