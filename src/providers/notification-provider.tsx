import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { getAnnouncements } from "@/utils/announcements";
import {
    ANNOUNCEMENTS_HREF,
    ANNOUNCEMENTS_SEEDED_ID,
    deleteNotices,
    markAllNoticesRead,
    markNoticeRead,
    markNoticesRead,
    mergeAnnouncementNotices,
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
    markReadMany: (ids: string[]) => void;
    markAllRead: () => void;
    remove: (ids: string[]) => void;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

const seededMarker = (): ClinicNotice => ({
    id: ANNOUNCEMENTS_SEEDED_ID,
    copyKey: "notifAnnouncementNav",
    actor: "CarePlus Clinic",
    initials: "CC",
    kind: "announcement",
    href: ANNOUNCEMENTS_HREF,
    createdAt: new Date().toISOString(),
    unread: false,
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const { locale } = useI18n();
    const key = profile ? noticeStorageKey(profile.id) : null;
    const [stored, setStored] = useState<ClinicNotice[]>(() => (key ? readNotices(key) : []));
    const [storeKey, setStoreKey] = useState(key);
    const posts = getAnnouncements(locale);
    const items = useMemo(() => (key ? mergeAnnouncementNotices(stored, posts) : []), [key, posts, stored]);

    if (storeKey !== key) {
        setStoreKey(key);
        setStored(key ? readNotices(key) : []);
    }

    useEffect(() => {
        if (!key || stored.some((item) => item.id === ANNOUNCEMENTS_SEEDED_ID)) {
            return;
        }
        const next = [...mergeAnnouncementNotices(stored, getAnnouncements(locale)), seededMarker()];
        writeNotices(key, next);
        setStored(next);
    }, [key, locale, stored]);

    const persist = useCallback(
        (next: ClinicNotice[]) => {
            const marker = stored.find((item) => item.id === ANNOUNCEMENTS_SEEDED_ID);
            const saved = marker ? [...next, marker] : next;
            setStored(saved);
            if (key) {
                writeNotices(key, saved);
            }
        },
        [key, stored],
    );

    const markRead = useCallback(
        (id: string) => {
            persist(markNoticeRead(items, id));
        },
        [items, persist],
    );

    const markReadMany = useCallback(
        (ids: string[]) => {
            persist(markNoticesRead(items, ids));
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
            markReadMany,
            markAllRead,
            remove,
        }),
        [items, markAllRead, markRead, markReadMany, remove, unread],
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
