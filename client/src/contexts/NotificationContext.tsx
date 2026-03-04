import React, { createContext, useContext, useState, useCallback } from 'react';

interface NotificationContextValue {
  unreadCount: number;
  setUnreadCount: (n: number | ((prev: number) => number)) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      unreadCount: 0,
      setUnreadCount: () => {},
      isDrawerOpen: false,
      openDrawer: () => {},
      closeDrawer: () => {},
    };
  }
  return ctx;
}
