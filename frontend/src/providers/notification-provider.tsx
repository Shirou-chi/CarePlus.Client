import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
    deleteNotices,
    markAllNoticesRead,
    markNoticeRead,
    noticeStorageKey,
    readNotices,
    unreadNotices,
    writeNotices,
    type ClinicNotice,
} from "@/utils/notifications";

type NoticeContextValue = {
    items: ClinicNotice[];
    unread: ClinicNotice[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    remove: (ids: string[]) => void;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const key = profile ? noticeStorageKey(profile.id) : null;
    const [items, setItems] = useState<ClinicNotice[]>(() => (key ? readNotices(key) : []));
    const [storeKey, setStoreKey] = useState(key);

    if (storeKey !== key) {
        setStoreKey(key);
        setItems(key ? readNotices(key) : []);
    }

    const persist = useCallback(
        (next: ClinicNotice[]) => {
            setItems(next);
            if (key) {
                writeNotices(key, next);
            }
        },
        [key],
    );

    const markRead = useCallback(
        (id: string) => {
            persist(markNoticeRead(items, id));
        },
        [items, persist],
    );

    const markAllRead = useCallback(() => {
        persist(markAllNoticesRead(items));
    }, [items, persist]);

    const remove = useCallback(
        (ids: string[]) => {
            persist(deleteNotices(items, ids));
        },
        [items, persist],
    );

    const unread = useMemo(() => unreadNotices(items), [items]);

    const value = useMemo<NoticeContextValue>(
        () => ({
            items,
            unread,
            unreadCount: unread.length,
            markRead,
            markAllRead,
            remove,
        }),
        [items, markAllRead, markRead, remove, unread],
    );

    return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
};

export const useNotices = () => {
    const context = useContext(NoticeContext);
    if (!context) {
        throw new Error("useNotices must be used within NotificationProvider");
    }
    return context;
};
