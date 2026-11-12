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
const TOAST_MS = 5000;
const FADE_MS = 700;

type Toast = { id: string; notice: ClinicNotice } | { id: string; count: number };

const readSeen = () => {
    try {
        return new Set<string>(JSON.parse(sessionStorage.getItem(TOASTED_NOTICES_KEY) ?? "[]") as string[]);
    } catch {
        return new Set<string>();
    }
};

export const NotificationToasts = () => {
    const { profile, isReady } = useAuth();
    const { unread, loading, markRead } = useNotices();
    const { pathname } = useLocation();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [settingsTick, setSettingsTick] = useState(0);
    const notificationLevel = profile ? readProfileSettings(profile.id).notificationLevel : "none";

    useEffect(() => {
        const sync = (event: Event) => {
            const detail = (event as CustomEvent<{ profileId?: string }>).detail;
            if (detail?.profileId && profile && detail.profileId !== profile.id) return;
            setSettingsTick((tick) => tick + 1);
        };
        window.addEventListener("careplus-settings", sync);
        return () => window.removeEventListener("careplus-settings", sync);
    }, [profile]);

    // Wait until auth preferences are loaded so "No notifications" is not skipped on login.
    useEffect(() => {
        if (!isReady || !profile) return;
        if (notificationLevel === "none") setToasts([]);
    }, [isReady, notificationLevel, profile, settingsTick]);

    useEffect(() => {
        if (!isReady || !profile || loading) return;
        if (notificationLevel === "none") return;

        const seen = readSeen();
        const fresh = unread.filter((notice) => !seen.has(notice.id) && (notificationLevel === "all" || notice.kind === "visit" || notice.kind === "payment"));
        if (fresh.length === 0) return;

        fresh.forEach((notice) => seen.add(notice.id));
        sessionStorage.setItem(TOASTED_NOTICES_KEY, JSON.stringify([...seen]));
        if (pathname.startsWith("/notifications")) return;

        const next: Toast[] =
            fresh.length > MAX_TOASTS ? [{ id: `many-${Date.now()}`, count: fresh.length }] : fresh.map((notice) => ({ id: notice.id, notice }));
        setToasts((current) => [...next, ...current].slice(0, MAX_TOASTS));
    }, [isReady, loading, notificationLevel, pathname, profile, settingsTick, unread]);

    const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

    if (!profile || notificationLevel === "none" || toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[60] md:top-22" role="status" aria-live="polite">
            <div className="mx-auto flex w-full max-w-container justify-end px-4 pt-3 md:px-8">
                <div className="flex w-[22rem] max-w-full flex-col gap-2">
                    {toasts.map((toast) => (
                        <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} onRead={markRead} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ToastCard = ({ toast, onDismiss, onRead }: { toast: Toast; onDismiss: (id: string) => void; onRead: (id: string) => void }) => {
    const { t, locale } = useI18n();
    const navigate = useNavigate();
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setLeaving(true), TOAST_MS);
        return () => window.clearTimeout(timer);
    }, [toast.id]);

    useEffect(() => {
        if (!leaving) return;
        const timer = window.setTimeout(() => onDismiss(toast.id), FADE_MS);
        return () => window.clearTimeout(timer);
    }, [leaving, onDismiss, toast.id]);

    const notice = "notice" in toast ? toast.notice : null;
    const count = "count" in toast ? toast.count : 0;

    const beginLeave = () => {
        if (!leaving) setLeaving(true);
    };

    const open = () => {
        if (notice) onRead(notice.id);
        beginLeave();
        navigate(notice?.href || "/notifications");
    };

    return (
        <div
            className={
                leaving
                    ? "pointer-events-none flex animate-out items-start gap-3 rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary duration-700 fade-out slide-out-to-top-2 fill-mode-forwards dark:bg-[#171717] dark:ring-white/10"
                    : "pointer-events-auto flex animate-in items-start gap-3 rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary duration-300 fade-in slide-in-from-top-2 dark:bg-[#171717] dark:ring-white/10"
            }
        >
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
                onClick={beginLeave}
                className="-m-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
            >
                <XClose className="size-4" />
            </button>
        </div>
    );
};
