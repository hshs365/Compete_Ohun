import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  useChat,
  type ConversationListItem,
} from '../contexts/ChatContext';
import { useChatSocket } from '../contexts/ChatSocketContext';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { showError, showConfirm } from '../utils/swal';

const CHAT_PRIMARY = '#8b5cf6';
const CHAT_HISTORY_KEY = 'chat_widget_open';
const CHAT_PINNED_IDS_KEY = 'chat_pinned_ids';

function getPinnedIds(): number[] {
  try {
    const s = localStorage.getItem(CHAT_PINNED_IDS_KEY);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

function setPinnedIds(ids: number[]) {
  try {
    localStorage.setItem(CHAT_PINNED_IDS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
/** 모바일 하단 네비게이션 높이 (채팅 패널이 하단바를 가리지 않도록 여백 확보) */
const BOTTOM_NAV_HEIGHT = 64;

interface MessageItem {
  id: number;
  content: string;
  senderId: number;
  conversationId?: number;
  createdAt: string;
}

interface ConversationData {
  id: number;
  groupId: number;
  participantId: number;
  creatorId: number;
}

function formatMeetingDate(dt: string | null): string {
  if (!dt) return '';
  const d = new Date(dt);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const FloatingChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isOpen,
    viewMode,
    entryPayload,
    conversations,
    setConversations,
    activeConversationId,
    activeConversationMeta,
    openConversation,
    goBackToList,
    closeChat,
  } = useChat();

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return window.visualViewport?.height ?? window.innerHeight ?? 0;
  });
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [swipeY, setSwipeY] = useState(0);
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, joinConversation } = useChatSocket();
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const [pinnedIds, setPinnedIdsState] = useState<number[]>(() => getPinnedIds());
  const [contextMenu, setContextMenu] = useState<{
    convId: number;
    isPinned: boolean;
    rect: DOMRect;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreNextClick = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.get<ConversationListItem[]>('/api/chat/conversations');
      setConversations(Array.isArray(list) ? list : []);
    } catch {
      setConversations([]);
    }
  }, [user, setConversations]);

  const fetchMessages = useCallback(async (convId: number) => {
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
  }, []);

  // 모바일 여부
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // History API: 뒤로가기 (대화 중이면 목록으로, 목록이면 위젯 닫기)
  useEffect(() => {
    if (!isOpen) return;
    const state = {
      [CHAT_HISTORY_KEY]: true,
      viewMode,
      conversationId: activeConversationId,
    };
    history.pushState(state, '');
    const handlePopState = (e: PopStateEvent) => {
      const s = e.state;
      if (s?.[CHAT_HISTORY_KEY] && s.conversationId) return; // 아직 conversation에 머묾
      if (s?.[CHAT_HISTORY_KEY]) {
        goBackToList();
      } else {
        closeChat();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, viewMode, activeConversationId, goBackToList, closeChat]);

  const handleRequestClose = useCallback(() => {
    if (history.state?.[CHAT_HISTORY_KEY]) history.back();
    else closeChat();
  }, [closeChat]);

  const handleBackToList = useCallback(() => {
    if (history.state?.[CHAT_HISTORY_KEY]) history.back();
    else goBackToList();
    fetchConversations();
  }, [goBackToList, fetchConversations]);

  // 목록 로드 (list 모드 또는 entry에서 진입 시)
  useEffect(() => {
    if (!isOpen || !user) return;
    setIsLoadingList(true);
    fetchConversations().finally(() => setIsLoadingList(false));
  }, [isOpen, user, fetchConversations]);

  // entryPayload: 문의하기에서 진입 -> 대화 생성 후 해당 대화 열기
  useEffect(() => {
    if (!entryPayload || !user || !entryPayload.groupId || !entryPayload.creatorId) return;
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const conv = await api.post<ConversationData>('/api/chat/conversations', {
          groupId: entryPayload.groupId,
          creatorId: entryPayload.creatorId,
        });
        if (!cancelled && conv) {
          setConversation(conv);
          openConversation(conv.id, {
            groupName: entryPayload.groupName,
            meetingDateTime: entryPayload.meetingDateTime ?? null,
            otherNickname: entryPayload.creatorNickname,
            otherMannerScore: entryPayload.creatorMannerScore ?? 80,
            isHost: false,
          });
        }
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
  }, [entryPayload?.groupId, entryPayload?.creatorId, user, openConversation]);

  // activeConversationId: 메시지 로드 및 읽음 처리
  useEffect(() => {
    if (!activeConversationId || !user) return;
    setConversation({ id: activeConversationId } as ConversationData);
    setOtherLastReadAt(null);
    fetchMessages(activeConversationId);
    api.patch(`/api/chat/conversations/${activeConversationId}/read`).then(() => {
      // 읽음 처리 후 해당 대화의 뱃지를 즉시 제거하고 목록 갱신(최신 순 정렬 반영)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      fetchConversations();
    });
  }, [activeConversationId, user, fetchMessages, fetchConversations, setConversations]);

  // 공용 소켓: 대화방 룸 참가 + 실시간 이벤트 구독 (카카오톡처럼 푸시 우선)
  useEffect(() => {
    if (!socket || !user) return;
    if (activeConversationId) {
      joinConversation(activeConversationId);
    }
    const onInboxUpdate = () => fetchConversations();
    const onNewMessage = (msg: MessageItem) => {
      if (msg.senderId === user.id) return;
      const convId = msg.conversationId ?? activeConversationId;
      if (convId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };
    const onReadReceipt = (payload: { conversationId: number; readAt: string }) => {
      if (payload.conversationId === activeConversationId) {
        setOtherLastReadAt(payload.readAt);
      }
    };
    socket.on('inbox-update', onInboxUpdate);
    socket.on('new-message', onNewMessage);
    socket.on('read-receipt', onReadReceipt);
    return () => {
      socket.off('inbox-update', onInboxUpdate);
      socket.off('new-message', onNewMessage);
      socket.off('read-receipt', onReadReceipt);
    };
  }, [socket, user, activeConversationId, joinConversation, fetchConversations]);

  // 폴링: WebSocket 끊김 시 또는 보조 동기화용 (연결됐을 때는 주기 길게)
  useEffect(() => {
    if (!isOpen || !activeConversationId || !user) return;
    const poll = () => fetchMessages(activeConversationId).catch(() => {});
    const intervalMs = isConnected ? 25000 : 8000;
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [isOpen, activeConversationId, user, isConnected, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      setViewportHeight(vv.height);
      setViewportOffsetTop(vv.offsetTop);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setSwipeY(0);
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const dy = touchCurrentY.current - touchStartY.current;
    if (dy > 0) setSwipeY(dy);
  }, []);
  const handleTouchEnd = useCallback(() => {
    const dy = touchCurrentY.current - touchStartY.current;
    if (dy > 80) {
      setIsSwipeClosing(true);
      setSwipeY(300);
      setTimeout(() => {
        handleRequestClose();
        setIsSwipeClosing(false);
        setSwipeY(0);
      }, 200);
    } else setSwipeY(0);
  }, [handleRequestClose]);

  const handleSend = async () => {
    if (!activeConversationId) return;
    const content = input.trim();
    if (!content || isSending) return;
    setIsSending(true);
    try {
      const msg = await api.post<MessageItem>(
        `/api/chat/conversations/${activeConversationId}/messages`,
        { content }
      );
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (err: unknown) {
      showError(
        (err as { message?: string })?.message ?? '메시지 전송에 실패했습니다.',
        '전송 실패'
      );
    } finally {
      setIsSending(false);
    }
  };

  const closeContextMenu = useCallback(() => {
    ignoreNextClick.current = false;
    setContextMenu(null);
  }, []);

  const togglePin = useCallback((convId: number) => {
    setPinnedIdsState((prev) => {
      const next = prev.includes(convId) ? prev.filter((id) => id !== convId) : [convId, ...prev];
      setPinnedIds(next);
      return next;
    });
    closeContextMenu();
  }, [closeContextMenu]);

  const handleLeaveConversation = useCallback(
    async (convId: number) => {
      const ok = await showConfirm('채팅방을 나가시겠습니까? 나가면 대화 내용이 목록에서 사라집니다.', '채팅방 나가기', '나가기', '취소');
      if (!ok) return;
      closeContextMenu();
      try {
        await api.delete(`/api/chat/conversations/${convId}`);
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConversationId === convId) {
          goBackToList();
          fetchConversations();
        }
        setPinnedIdsState((prev) => {
          const next = prev.filter((id) => id !== convId);
          setPinnedIds(next);
          return next;
        });
      } catch {
        showError('채팅방 나가기에 실패했습니다.', '실패');
      }
    },
    [activeConversationId, goBackToList, fetchConversations, setConversations, closeContextMenu]
  );

  const handleChatItemContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, convId: number, isPinned: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setContextMenu({ convId, isPinned, rect });
  }, []);

  const handleChatItemTouchStart = useCallback((convId: number, isPinned: boolean) => {
    ignoreNextClick.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      ignoreNextClick.current = true;
      const chatItem = document.querySelector(`[data-chat-conv-id="${convId}"]`) as HTMLElement;
      if (chatItem) {
        const rect = chatItem.getBoundingClientRect();
        setContextMenu({ convId, isPinned, rect });
      }
    }, 500);
  }, []);

  const handleChatItemTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const isMobileView = isMobile;
  const showList = viewMode === 'list' && !(entryPayload && isLoading);
  const meta = activeConversationMeta;
  const mannerConfig = meta ? getMannerGradeConfig(meta.otherMannerScore) : null;

  const headerTitle = showList
    ? '채팅'
    : meta?.groupName ?? '대화';

  return (
    <>
      {isMobileView && (
        <div
          className="fixed left-0 right-0 top-0 z-[9998] bg-black/40 transition-opacity md:hidden"
          style={{
            bottom: BOTTOM_NAV_HEIGHT,
            opacity: isSwipeClosing ? 0 : 1 - Math.min(swipeY / 200, 0.5),
          }}
          onClick={handleRequestClose}
          aria-hidden
        />
      )}

      <div
        className="fixed z-[9999] flex flex-col overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-2xl transition-all duration-200 ease-out md:bottom-4 md:right-4 md:rounded-2xl"
        style={{
          ...(isMobileView
            ? {
                top: viewportOffsetTop,
                left: 0,
                right: 0,
                width: '100%',
                height: Math.max(200, viewportHeight - BOTTOM_NAV_HEIGHT),
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
                transform: `translateY(${swipeY}px)`,
              }
            : {
                width: 'min(380px, calc(100vw - 32px))',
                height: 'min(520px, calc(100vh - 120px))',
              }),
        }}
      >
        {/* 헤더 */}
        <div
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border-card)]"
          style={{ borderBottomColor: `${CHAT_PRIMARY}30` }}
          onTouchStart={isMobileView ? handleTouchStart : undefined}
          onTouchMove={isMobileView ? handleTouchMove : undefined}
          onTouchEnd={isMobileView ? handleTouchEnd : undefined}
        >
          {isMobileView && (
            <div className="flex justify-center pt-2 pb-1 absolute top-0 left-0 right-0">
              <div className="w-10 h-1 rounded-full bg-[var(--color-text-secondary)] opacity-50" aria-hidden />
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {viewMode === 'conversation' && (
              <button
                type="button"
                onClick={handleBackToList}
                className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] touch-manipulation"
                aria-label="뒤로"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {headerTitle}
              </p>
              {meta && (
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {meta.otherNickname}
                  {meta.meetingDateTime && ` · ${formatMeetingDate(meta.meetingDateTime)}`}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="shrink-0 p-2 rounded-lg active:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] touch-manipulation"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {showList ? (
            /* 채팅방 목록 (비로그인 시 로그인 유도) */
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {!user ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <ChatBubbleLeftRightIcon
                    className="w-12 h-12 text-[var(--color-text-secondary)] opacity-50 mb-3"
                    aria-hidden
                  />
                  <p className="text-[var(--color-text-primary)] text-sm font-medium">로그인이 필요합니다</p>
                  <p className="text-[var(--color-text-secondary)] text-xs mt-1 mb-5">
                    채팅을 이용하려면 로그인해 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeChat();
                      navigate('/login');
                    }}
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-white touch-manipulation min-h-[44px]"
                    style={{ backgroundColor: CHAT_PRIMARY }}
                  >
                    로그인하기
                  </button>
                </div>
              ) : isLoadingList ? (
                <div className="flex justify-center py-8 text-[var(--color-text-secondary)] text-sm">
                  불러오는 중...
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <ChatBubbleLeftRightIcon
                    className="w-12 h-12 text-[var(--color-text-secondary)] opacity-50 mb-2"
                    aria-hidden
                  />
                  <p className="text-[var(--color-text-secondary)] text-sm">아직 대화가 없습니다</p>
                  <p className="text-[var(--color-text-secondary)] text-xs mt-1 opacity-80">
                    플레이어 상세에서 채팅으로 문의하기를 눌러 시작하세요
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-card)]">
                  {(() => {
                    const pinned = conversations.filter((c) => pinnedIds.includes(c.id));
                    const unpinned = conversations.filter((c) => !pinnedIds.includes(c.id));
                    const sortedPinned = pinnedIds
                      .filter((id) => conversations.some((c) => c.id === id))
                      .map((id) => conversations.find((c) => c.id === id)!)
                      .filter(Boolean);
                    const sorted = [...sortedPinned, ...unpinned];
                    return sorted.map((c) => {
                      const isPinned = pinnedIds.includes(c.id);
                      return (
                    <button
                      key={c.id}
                      data-chat-conv-id={c.id}
                      type="button"
                      onClick={() => {
                        if (contextMenu || ignoreNextClick.current) {
                          ignoreNextClick.current = false;
                          return;
                        }
                        openConversation(c.id, {
                          groupName: c.groupName ?? '',
                          meetingDateTime: c.meetingDateTime,
                          otherNickname: c.otherUser?.nickname ?? '알 수 없음',
                          otherMannerScore: 80,
                          isHost: c.isHost,
                        });
                      }}
                      onContextMenu={(e) => handleChatItemContextMenu(e, c.id, isPinned)}
                      onTouchStart={() => handleChatItemTouchStart(c.id, isPinned)}
                      onTouchEnd={handleChatItemTouchEnd}
                      onTouchCancel={handleChatItemTouchEnd}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-primary)] transition-colors relative"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] relative">
                        <UserCircleIcon className="w-8 h-8" />
                        {isPinned && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: CHAT_PRIMARY }}
                            title="상단 고정"
                          >
                            <MapPinIcon className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {c.otherUser?.nickname ?? '알 수 없음'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {c.isHost ? c.groupName : `매치: ${c.groupName}`}
                          {c.meetingDateTime &&
                            ` · ${formatMeetingDate(c.meetingDateTime)}`}
                        </p>
                        {c.lastMessage && (
                          <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5 opacity-90">
                            {c.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {c.unreadCount > 0 && (
                        <span
                          className="shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: CHAT_PRIMARY }}
                        >
                          {c.unreadCount > 99 ? '99+' : c.unreadCount}
                        </span>
                      )}
                    </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* 컨텍스트 메뉴: 상단 고정 / 채팅방 나가기 (롱프레스·우클릭) */}
              {contextMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[10001]"
                    onClick={closeContextMenu}
                    aria-hidden
                  />
                  <div
                    className="fixed z-[10002] rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-lg overflow-hidden min-w-[160px]"
                    style={
                      isMobileView
                        ? { left: 16, right: 16, bottom: BOTTOM_NAV_HEIGHT + 16 }
                        : {
                            top: Math.min(contextMenu.rect.bottom + 4, window.innerHeight - 120),
                            left: Math.min(contextMenu.rect.left, window.innerWidth - 180),
                          }
                    }
                  >
                    <button
                      type="button"
                      onClick={() => togglePin(contextMenu.convId)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      {contextMenu.isPinned ? '고정 해제' : '상단 고정'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLeaveConversation(contextMenu.convId)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      채팅방 나가기
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 개별 대화 */
            <>
              {meta && (
                <div className="shrink-0 px-4 py-1.5 border-b border-[var(--color-border-card)] flex items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      mannerConfig?.badgeClass ?? ''
                    }`}
                  >
                    {mannerConfig?.icon} {meta.otherMannerScore}점
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {meta.groupName}
                    {meta.meetingDateTime &&
                      ` · ${formatMeetingDate(meta.meetingDateTime)}`}
                  </span>
                </div>
              )}
              {error ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
                  <p className="text-[var(--color-text-secondary)] text-sm text-center">{error}</p>
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: CHAT_PRIMARY }}
                  >
                    목록으로
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
                  불러오는 중...
                </div>
              ) : (
                <>
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 overscroll-contain"
                  >
                    {messages.length === 0 ? (
                      <p className="text-center text-[var(--color-text-secondary)] text-xs py-6">
                        첫 메시지를 보내보세요!
                      </p>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                isMe
                                  ? 'text-white rounded-br-sm'
                                  : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] rounded-bl-sm'
                              }`}
                              style={
                                isMe
                                  ? { backgroundColor: CHAT_PRIMARY }
                                  : undefined
                              }
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {m.content}
                              </p>
                              <p
                                className={`text-[10px] mt-0.5 flex items-center gap-1 ${
                                  isMe ? 'text-white/80' : 'text-[var(--color-text-secondary)]'
                                }`}
                              >
                                {new Date(m.createdAt).toLocaleTimeString(
                                  'ko-KR',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
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
                  <div
                    className="shrink-0 p-3 border-t border-[var(--color-border-card)] pb-[env(safe-area-inset-bottom)]"
                    style={{ borderTopColor: `${CHAT_PRIMARY}30` }}
                  >
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요"
                        rows={2}
                        maxLength={1000}
                        className="flex-1 min-h-[44px] max-h-[88px] px-3 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[#6ee7b7]/50 text-base touch-manipulation border-[var(--color-border-card)]"
                        style={{ borderColor: 'rgba(139,92,246,0.4)' }}
                        disabled={isSending}
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="shrink-0 p-2.5 rounded-xl text-white disabled:opacity-50 touch-manipulation"
                        style={{
                          backgroundColor: CHAT_PRIMARY,
                          minWidth: 44,
                          minHeight: 44,
                        }}
                        aria-label="전송"
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingChatWidget;
