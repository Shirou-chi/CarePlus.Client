export type NoticeKind = "visit" | "medicine" | "records" | "account";

export type NoticeCopyKey =
    | "notifVisitConfirmed"
    | "notifMedReady"
    | "notifRecordsNote"
    | "notifVisitReminder"
    | "notifMedCheckout"
    | "notifAccountSaved"
    | "notifRecordsResult";

export type ClinicNotice = {
    id: string;
    copyKey: NoticeCopyKey;
    actor: string;
    initials: string;
    kind: NoticeKind;
    href: string;
    createdAt: string;
    unread: boolean;
};

export const NOTICE_COPY_KEYS: NoticeCopyKey[] = [
    "notifVisitConfirmed",
    "notifMedReady",
    "notifRecordsNote",
    "notifVisitReminder",
    "notifMedCheckout",
    "notifAccountSaved",
    "notifRecordsResult",
];

const COPY_SET = new Set<string>(NOTICE_COPY_KEYS);

export const noticeStorageKey = (patientId: string) => `careplus-notices:${patientId}`;

export const seedNotices = (now = Date.now()): ClinicNotice[] => [
    {
        id: "n1",
        copyKey: "notifVisitConfirmed",
        actor: "Dr Lim Wei Hao",
        initials: "LW",
        kind: "visit",
        href: "/book",
        createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
        unread: true,
    },
    {
        id: "n2",
        copyKey: "notifMedReady",
        actor: "CarePlus Pharmacy",
        initials: "CP",
        kind: "medicine",
        href: "/medicine",
        createdAt: new Date(now - 28 * 60 * 1000).toISOString(),
        unread: true,
    },
    {
        id: "n3",
        copyKey: "notifRecordsNote",
        actor: "CarePlus Clinic",
        initials: "CC",
        kind: "records",
        href: "/records",
        createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
        unread: true,
    },
    {
        id: "n4",
        copyKey: "notifVisitReminder",
        actor: "Dr Lee Jun Jie",
        initials: "LJ",
        kind: "visit",
        href: "/book",
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        unread: true,
    },
    {
        id: "n5",
        copyKey: "notifMedCheckout",
        actor: "CarePlus Pharmacy",
        initials: "CP",
        kind: "medicine",
        href: "/medicine",
        createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        unread: true,
    },
    {
        id: "n6",
        copyKey: "notifAccountSaved",
        actor: "CarePlus Clinic",
        initials: "CC",
        kind: "account",
        href: "/account",
        createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
        unread: false,
    },
    {
        id: "n7",
        copyKey: "notifRecordsResult",
        actor: "CarePlus Clinic",
        initials: "CC",
        kind: "records",
        href: "/records",
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
    },
];

const isNotice = (value: unknown): value is ClinicNotice => {
    if (!value || typeof value !== "object") {
        return false;
    }
    const item = value as ClinicNotice;
    return (
        typeof item.id === "string" &&
        COPY_SET.has(item.copyKey) &&
        typeof item.actor === "string" &&
        typeof item.initials === "string" &&
        (item.kind === "visit" || item.kind === "medicine" || item.kind === "records" || item.kind === "account") &&
        typeof item.href === "string" &&
        typeof item.createdAt === "string" &&
        Number.isFinite(Date.parse(item.createdAt)) &&
        typeof item.unread === "boolean"
    );
};

export const sanitizeNotices = (value: unknown): ClinicNotice[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter(isNotice);
};

export const readNotices = (key: string, now = Date.now()): ClinicNotice[] => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            const seed = seedNotices(now);
            localStorage.setItem(key, JSON.stringify(seed));
            return seed;
        }
        return sanitizeNotices(JSON.parse(raw));
    } catch {
        return seedNotices(now);
    }
};

export const writeNotices = (key: string, items: ClinicNotice[]) => {
    localStorage.setItem(key, JSON.stringify(items));
};

export const unreadNotices = (items: ClinicNotice[]) => items.filter((item) => item.unread);

export const markNoticeRead = (items: ClinicNotice[], id: string): ClinicNotice[] =>
    items.map((item) => (item.id === id ? { ...item, unread: false } : item));

export const markAllNoticesRead = (items: ClinicNotice[]): ClinicNotice[] => items.map((item) => ({ ...item, unread: false }));

export const deleteNotices = (items: ClinicNotice[], ids: Iterable<string>): ClinicNotice[] => {
    const drop = new Set(ids);
    return items.filter((item) => !drop.has(item.id));
};

export const formatNoticeAge = (createdAt: string, now: number, locale: "en" | "zh") => {
    const mins = Math.max(0, Math.round((now - Date.parse(createdAt)) / 60_000));
    if (mins < 1) {
        return locale === "zh" ? "刚刚" : "Just now";
    }
    if (mins < 60) {
        return locale === "zh" ? `${mins} 分钟前` : `${mins} min ago`;
    }
    const hours = Math.max(1, Math.round(mins / 60));
    if (hours < 24) {
        return locale === "zh" ? `${hours} 小时前` : hours === 1 ? "1 hr ago" : `${hours} hr ago`;
    }
    const days = Math.max(1, Math.round(hours / 24));
    return locale === "zh" ? `${days} 天前` : days === 1 ? "1 day ago" : `${days} days ago`;
};
