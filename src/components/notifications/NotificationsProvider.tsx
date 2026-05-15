"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getOwnerSightingsNotifications,
  markNotificationsAsRead,
} from "../../lib/notifications";

export type NotificationEvent = {
  id: string;
  type: string;
  payload: {
    sighting_id?: string;
    lost_report_id?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
  };
  created_at: string;
  read_at: string | null;
};

type NotificationsContextValue = {
  events: NotificationEvent[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: (options?: { markRead?: boolean }) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return value;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(
    async (options?: { markRead?: boolean }) => {
      if (options?.markRead) {
        await markNotificationsAsRead();
      }

      const data = await getOwnerSightingsNotifications();
      setEvents(data as NotificationEvent[]);
      setLoading(false);
    },
    [],
  );

  const unreadCount = useMemo(
    () => events.filter((event) => event.read_at === null).length,
    [events],
  );

  const value = useMemo(
    () => ({
      events,
      unreadCount,
      loading,
      loadNotifications,
    }),
    [events, unreadCount, loading, loadNotifications],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
