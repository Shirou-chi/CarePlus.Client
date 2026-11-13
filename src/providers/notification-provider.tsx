import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { notificationApi, staffNotificationApi, type ApiNotification } from "@/services/notificationApi";
import { orderApi } from "@/services/orderApi";
import { isReadyPickupOrder } from "@/utils/order-history";
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

const READY_READ_KEY = "careplus-ready-pickup-read";
const isReadyNotice = (id: string) => id.startsWith("order-ready-");

const readReadyIds = () => {
    try {
        const raw = JSON.parse(sessionStorage.getItem(READY_READ_KEY) || "[]") as string[];
        return new Set(raw);
    } catch {
        return new Set<string>();
    }
};

const writeReadyIds = (ids: Set<string>) => {
    sessionStorage.setItem(READY_READ_KEY, JSON.stringify([...ids]));
};

const kindForType = (type: string): NoticeKind => {
    if (type === "appointment_reminder" || type === "appointment_cancelled" || type === "check_in_reminder" || type === "queue_update") return "visit";
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
    const { profile, user } = useAuth();
    const { locale, t } = useI18n();
    const accountId = profile?.id ?? user?.userId;
    const isStaff = Boolean(user?.userId && !profile);
    const api = isStaff ? staffNotificationApi : notificationApi;
    const [items, setItems] = useState<ClinicNotice[]>([]);
    const [loading, setLoading] = useState(Boolean(accountId));
    const [error, setError] = useState<string | null>(null);

    const mergeReadyPickup = useCallback(
        async (raw: ApiNotification[]) => {
            const notices = raw.map((item) => mapNotice(item, locale));
            if (isStaff || !profile?.id || profile.id.startsWith("fam-")) {
                return notices;
            }

            try {
                const orders = await orderApi.list({
                    confirmed: t.checkoutStepConfirmed,
                    ready: t.notifMedReadyTitle,
                    pickedUp: t.ordersTrack,
                    delivered: t.ordersTrack,
                });
                const read = readReadyIds();
                const ready = orders.filter((order) => isReadyPickupOrder(order.status));
                const synthetic = ready
                    .filter(
                        (order) =>
                            !notices.some(
                                (notice) =>
                                    notice.kind === "medicine" &&
                                    (notice.href.includes(order.id) || notice.message.includes(order.id) || notice.messageZh.includes(order.id)),
                            ),
                    )
                    .map((order) => {
                        const id = `order-ready-${order.id}`;
                        const title = t.notifMedReadyTitle;
                        const titleZh = t.notifMedReadyTitleZh;
                        const message = t.notifMedReadyBody.replace("{id}", order.id);
                        const messageZh = t.notifMedReadyBodyZh.replace("{id}", order.id);
                        return {
                            id,
                            title: locale === "zh" ? titleZh : title,
                            message: locale === "zh" ? messageZh : message,
                            titleZh,
                            messageZh,
                            actor: "CarePlus Clinic",
                            initials: "CC",
                            kind: "medicine" as const,
                            href: "/orders",
                            createdAt: order.placedAt,
                            unread: !read.has(id),
                        } satisfies ClinicNotice;
                    });
                return [...synthetic, ...notices].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
            } catch {
                return notices;
            }
        },
        [isStaff, locale, profile?.id, t],
    );

    const apply = useCallback(
        async (raw: ApiNotification[]) => {
            setItems(await mergeReadyPickup(raw));
        },
        [mergeReadyPickup],
    );

    useEffect(() => {
        let cancelled = false;
        let requestInFlight = false;

        const load = async (silent = false) => {
            if (requestInFlight) {
                return;
            }

            if (!accountId) {
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
                const raw = await api.list();
                if (!cancelled) {
                    await apply(raw);
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
        if (!accountId) {
            return () => {
                cancelled = true;
            };
        }

        const refreshInterval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void load(true);
            }
        }, 15_000);

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
    }, [accountId, api, apply]);

    const update = useCallback(
        async (operation: () => Promise<ApiNotification[]>) => {
            try {
                setError(null);
                await apply(await operation());
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Unable to update notifications.");
            }
        },
        [apply],
    );

    const markReadyLocal = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        const read = readReadyIds();
        for (const id of ids) read.add(id);
        writeReadyIds(read);
        setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, unread: false } : item)));
    }, []);

    const markRead = useCallback(
        (id: string) => {
            if (isReadyNotice(id)) {
                markReadyLocal([id]);
                return;
            }
            void update(() => api.markRead(id));
        },
        [api, markReadyLocal, update],
    );

    const markReadMany = useCallback(
        (ids: string[]) => {
            const ready = ids.filter(isReadyNotice);
            const remote = ids.filter((id) => !isReadyNotice(id));
            markReadyLocal(ready);
            if (remote.length > 0) void update(() => api.markManyRead(remote));
        },
        [api, markReadyLocal, update],
    );

    const markAllRead = useCallback(() => {
        markReadyLocal(items.filter((item) => isReadyNotice(item.id)).map((item) => item.id));
        void update(() => api.markAllRead());
    }, [api, items, markReadyLocal, update]);

    const remove = useCallback(
        (ids: string[]) => {
            const removedIds = new Set(ids);
            if (removedIds.size === 0) return;

            const ready = ids.filter(isReadyNotice);
            const remote = ids.filter((id) => !isReadyNotice(id));
            markReadyLocal(ready);

            setItems((current) => current.filter((item) => !removedIds.has(item.id)));
            if (remote.length === 0) return;

            void api
                .remove(remote)
                .then((raw) => apply(raw))
                .catch(async (cause) => {
                    try {
                        await apply(await api.list());
                    } catch {
                        setError(cause instanceof Error ? cause.message : "Unable to update notifications.");
                    }
                });
        },
        [api, apply, markReadyLocal],
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
