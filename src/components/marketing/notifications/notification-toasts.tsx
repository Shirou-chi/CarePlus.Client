import { useCallback, useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { useLocation, useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { noticeMeta } from "@/components/marketing/notifications/notification-item";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { useNotices } from "@/providers/notification-provider";
import { TOASTED_NOTICES_KEY, type ClinicNotice } from "@/utils/notifications";
import { readProfileSettings } from "@/utils/profile-settings";

const MAX_TOASTS = 3;
const TOAST_MS = 8000;

type Toast = { id: string; notice: ClinicNotice } | { id: string; count: number };

const readSeen = () => {
    try {
        return new Set<string>(JSON.parse(sessionStorage.getItem(TOASTED_NOTICES_KEY) ?? "[]") as string[]);
    } catch {
        return new Set<string>();
    }
};

export const NotificationToasts = () => {
    const { profile } = useAuth();
    const { unread, loading, markRead } = useNotices();
    const { pathname } = useLocation();
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        if (!profile || loading) return;
        const level = readProfileSettings(profile.id).notificationLevel;
        if (level === "none") return;

        const seen = readSeen();
        const fresh = unread.filter((notice) => !seen.has(notice.id) && (level === "all" || notice.kind === "visit" || notice.kind === "payment"));
        if (fresh.length === 0) return;

        fresh.forEach((notice) => seen.add(notice.id));
        sessionStorage.setItem(TOASTED_NOTICES_KEY, JSON.stringify([...seen]));
        if (pathname.startsWith("/notifications")) return;

        const next: Toast[] =
            fresh.length > MAX_TOASTS ? [{ id: `many-${Date.now()}`, count: fresh.length }] : fresh.map((notice) => ({ id: notice.id, notice }));
        setToasts((current) => [...next, ...current].slice(0, MAX_TOASTS));
    }, [loading, pathname, profile, unread]);

    const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

    if (!profile || toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed top-[5rem] right-4 z-[60] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2 md:top-24 md:right-8" role="status" aria-live="polite">
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} onRead={markRead} />
            ))}
        </div>
    );
};

const ToastCard = ({ toast, onDismiss, onRead }: { toast: Toast; onDismiss: (id: string) => void; onRead: (id: string) => void }) => {
    const { t, locale } = useI18n();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_MS);
        return () => window.clearTimeout(timer);
    }, [onDismiss, toast.id]);

    const notice = "notice" in toast ? toast.notice : null;
    const count = "count" in toast ? toast.count : 0;
    const open = () => {
        if (notice) onRead(notice.id);
        onDismiss(toast.id);
        navigate(notice?.href || "/notifications");
    };

    return (
        <div className="pointer-events-auto flex animate-in items-start gap-3 rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary duration-200 fade-in slide-in-from-top-2 dark:bg-[#171717] dark:ring-white/10">
            <button type="button" onClick={open} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left outline-focus-ring focus-visible:outline-2">
                <Avatar size="md" initials={notice ? notice.initials : String(Math.min(count, 99))} alt={notice?.actor ?? ""} />
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-primary">{notice ? notice.title : t.notifToastMany.replace("{count}", String(count))}</span>
                    {notice ? <span className="mt-0.5 line-clamp-2 block text-sm text-secondary">{notice.message}</span> : null}
                    <span className="mt-1 block text-xs text-tertiary">{notice ? noticeMeta(notice, t, locale) : t.notifToastView}</span>
                </span>
            </button>
            <button
                type="button"
                aria-label={t.notifToastClose}
                onClick={() => onDismiss(toast.id)}
                className="-m-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
            >
                <XClose className="size-4" />
            </button>
        </div>
    );
};
