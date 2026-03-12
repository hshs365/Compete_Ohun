import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketUrl } from '../utils/api';

/**
 * 카카오톡처럼 단일 WebSocket을 로그인 동안 상시 유지.
 * 채팅 UI 열림 여부와 관계없이 연결되어 새 메시지·읽음·inbox 업데이트를 실시간 수신.
 */
interface ChatSocketContextType {
  /** 공용 소켓 (로그인 시에만 연결됨) */
  socket: Socket | null;
  /** 소켓 연결 여부 */
  isConnected: boolean;
  /** 특정 대화방 룸 참가 (new-message 등 수신용). 여러 대화방 동시 참가 가능 */
  joinConversation: (conversationId: number) => void;
  /** 대화방 룸 나가기 (선택적) */
  leaveConversation: (conversationId: number) => void;
}

const ChatSocketContext = createContext<ChatSocketContextType | undefined>(undefined);

export function useChatSocket(): ChatSocketContextType {
  const ctx = useContext(ChatSocketContext);
  if (ctx === undefined) {
    throw new Error('useChatSocket must be used within ChatSocketProvider');
  }
  return ctx;
}

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const joinConversation = useCallback((conversationId: number) => {
    if (typeof conversationId !== 'number' || conversationId <= 0) return;
    const s = socketRef.current;
    if (s?.connected) s.emit('join-conversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((_conversationId: number) => {
    // Socket.io 서버가 room leave 처리하지 않아도 동작에 문제 없음
  }, []);

  useEffect(() => {
    if (!user?.id) {
      const prev = socketRef.current;
      if (prev) prev.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token =
      sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (!token) return;

    const s = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = s;
    setSocket(s);
    s.emit('join-user', { userId: user.id });

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));
    s.on('connect_error', () => setIsConnected(false));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id]);

  const value: ChatSocketContextType = {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
  };

  return (
    <ChatSocketContext.Provider value={value}>
      {children}
    </ChatSocketContext.Provider>
  );
}
