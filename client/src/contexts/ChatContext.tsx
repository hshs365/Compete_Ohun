import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

export interface OpenChatPayload {
  groupId: number;
  creatorId: number;
  groupName: string;
  creatorNickname: string;
  creatorMannerScore?: number;
  meetingDateTime?: string | null;
}

export interface ConversationListItem {
  id: number;
  groupId: number;
  groupName: string;
  meetingDateTime: string | null;
  otherUser: { id: number; nickname: string } | null;
  isHost: boolean;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
}

type ViewMode = 'list' | 'conversation';

interface ChatContextType {
  isOpen: boolean;
  viewMode: ViewMode;
  /** 목록 화면용 - 열 수 있는 입구(문의하기에서 진입 시) */
  entryPayload: OpenChatPayload | null;
  /** 대화 목록 (캐시) */
  conversations: ConversationListItem[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationListItem[]>>;
  /** 현재 열린 대화 ID (null = 목록) */
  activeConversationId: number | null;
  /** 현재 열린 대화 메타 (매치 정보 등) */
  activeConversationMeta: {
    groupName: string;
    meetingDateTime: string | null;
    otherNickname: string;
    otherMannerScore: number;
    isHost: boolean;
  } | null;
  openChat: (payload: OpenChatPayload) => void;
  openChatList: () => void;
  openConversation: (id: number, meta: ChatContextType['activeConversationMeta']) => void;
  goBackToList: () => void;
  closeChat: () => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [entryPayload, setEntryPayload] = useState<OpenChatPayload | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeConversationMeta, setActiveConversationMeta] = useState<
    ChatContextType['activeConversationMeta']
  >(null);

  const viewMode: ViewMode =
    activeConversationId !== null ? 'conversation' : 'list';

  const openChat = useCallback((payload: OpenChatPayload) => {
    setIsOpen(true);
    setEntryPayload(payload);
    setActiveConversationId(null);
    setActiveConversationMeta(null);
  }, []);

  const openChatList = useCallback(() => {
    setIsOpen(true);
    setEntryPayload(null);
    setActiveConversationId(null);
    setActiveConversationMeta(null);
  }, []);

  const openConversation = useCallback(
    (id: number, meta: ChatContextType['activeConversationMeta']) => {
      setEntryPayload(null);
      setActiveConversationId(id);
      setActiveConversationMeta(meta);
    },
    []
  );

  const goBackToList = useCallback(() => {
    setActiveConversationId(null);
    setActiveConversationMeta(null);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setEntryPayload(null);
    setConversations([]);
    setActiveConversationId(null);
    setActiveConversationMeta(null);
  }, []);

  const refreshConversations = useCallback(async () => {
    // 실제 API 호출은 FloatingChatWidget에서 수행, 여기서는 빈 함수
    // 또는 fetch 함수를 context에서 주입할 수 있음
    return Promise.resolve();
  }, []);

  const value: ChatContextType = {
    isOpen,
    viewMode,
    entryPayload,
    conversations,
    setConversations,
    activeConversationId,
    activeConversationMeta,
    openChat,
    openChatList,
    openConversation,
    goBackToList,
    closeChat,
    refreshConversations,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
};
