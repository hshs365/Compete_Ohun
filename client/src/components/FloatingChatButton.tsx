import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

/** 채팅 목록을 여는 플로팅 버튼 (스캐너 FAB과 유사). 로그인 시에만 표시, 채팅 패널이 열려 있으면 숨김. */
const FloatingChatButton = () => {
  const { user } = useAuth();
  const { isOpen, openChatList } = useChat();

  if (!user || isOpen) return null;

  return (
    <button
      type="button"
      onClick={openChatList}
      className="fixed z-[9005] flex items-center justify-center w-12 h-12 rounded-2xl text-white font-semibold shadow-lg hover:opacity-95 active:scale-[0.98] transition-all border border-[var(--color-border-card)] bottom-28 left-20 md:bottom-6 md:left-20 md:safe-area-bottom"
      style={{ backgroundColor: '#8b5cf6' }}
      aria-label="채팅 열기"
    >
      <ChatBubbleLeftRightIcon className="w-6 h-6 shrink-0" aria-hidden />
    </button>
  );
};

export default FloatingChatButton;
