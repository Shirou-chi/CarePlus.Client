import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { notificationApi, type ApiNotification } from "@/services/notificationApi";
import type { ClinicNotice, NoticeKind } from "@/utils/notifications";

type NoticeContextValue = {
    items: ClinicNotice[];
    unread: ClinicNotice[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markRead: (id: string) => void;
    markReadMany: (ids: string[]) => void;
    markAllRead: () => void;
    remove: (ids: string[]) => void;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

const kindForType = (type: string): NoticeKind => {
    if (type === "appointment_reminder") return "visit";
    if (type === "payment_reminder") return "payment";
    if (type === "medicine_update") return "medicine";
    if (type === "family_invitation" || type === "family_invitation_declined" || type === "family_access_request") return "family";
    if (type === "announcement") return "announcement";
    if (type === "medical_record") return "records";
    return "account";
};

const mapNotice = (item: ApiNotification, locale: "en" | "zh"): ClinicNotice => ({
    id: item.id,
    title: locale === "zh" ? item.titleZh || item.title : item.title,
    message: locale === "zh" ? item.messageZh || item.message : item.message,
    titleZh: item.titleZh || item.title,
    messageZh: item.messageZh || item.message,
    actor: item.actor,
    initials: item.initials,
    kind: kindForType(item.type),
    href: item.href,
    createdAt: item.createdAt,
    unread: item.unread,
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const { locale } = useI18n();
    const profileId = profile?.id;
    const [items, setItems] = useState<ClinicNotice[]>([]);
    const [loading, setLoading] = useState(Boolean(profileId));
    const [error, setError] = useState<string | null>(null);

    const apply = useCallback(
        (raw: ApiNotification[]) => setItems(raw.map((item) => mapNotice(item, locale))),
        [locale],
    );

    useEffect(() => {
        let cancelled = false;
        let requestInFlight = false;

        const load = async (silent = false) => {
            if (requestInFlight) {
                return;
            }

            if (!profileId) {
                setItems([]);
                setLoading(false);
                setError(null);
                return;
            }

            requestInFlight = true;
            if (!silent) {
                setLoading(true);
                setError(null);
            }
            try {
                const raw = await notificationApi.list();
                if (!cancelled) {
                    apply(raw);
                }
            } catch (cause) {
                if (!cancelled && !silent) {
                    setError(cause instanceof Error ? cause.message : "Unable to load notifications.");
                }
            } finally {
                requestInFlight = false;
                if (!cancelled && !silent) {
                    setLoading(false);
                }
            }
        };

        void load();
        if (!profileId) {
            return () => {
                cancelled = true;
            };
        }

        const refreshInterval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void load(true);
            }
        }, 2_000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void load(true);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            cancelled = true;
            window.clearInterval(refreshInterval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [apply, profileId]);

    const update = useCallback(
        async (operation: () => Promise<ApiNotification[]>) => {
            try {
                setError(null);
                apply(await operation());
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Unable to update notifications.");
            }
        },
        [apply],
    );

    const markRead = useCallback((id: string) => void update(() => notificationApi.markRead(id)), [update]);
    const markReadMany = useCallback((ids: string[]) => void update(() => notificationApi.markManyRead(ids)), [update]);
    const markAllRead = useCallback(() => void update(() => notificationApi.markAllRead()), [update]);
    const remove = useCallback(
        (ids: string[]) => {
            const removedIds = new Set(ids);
            if (removedIds.size === 0) return;

            // Update the list immediately so deletion does not wait for the API round trip.
            setItems((current) => current.filter((item) => !removedIds.has(item.id)));
            void notificationApi
                .remove(ids)
                .then((raw) => apply(raw))
                .catch(async (cause) => {
                    try {
                        apply(await notificationApi.list());
                    } catch {
                        setError(cause instanceof Error ? cause.message : "Unable to update notifications.");
                    }
                });
        },
        [apply],
    );
    const unread = useMemo(() => items.filter((item) => item.unread), [items]);

    const value = useMemo<NoticeContextValue>(
        () => ({ items, unread, unreadCount: unread.length, loading, error, markRead, markReadMany, markAllRead, remove }),
        [error, items, loading, markAllRead, markRead, markReadMany, remove, unread],
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
