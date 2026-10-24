export type NoticeKind = "visit" | "medicine" | "records" | "account" | "announcement";

export type NoticeCopyKey =
    | "notifVisitConfirmed"
    | "notifMedReady"
    | "notifRecordsNote"
    | "notifVisitReminder"
    | "notifMedCheckout"
    | "notifAccountSaved"
    | "notifRecordsResult"
    | "notifAnnouncementItem"
    | "notifAnnouncementNav";

export const ANNOUNCEMENTS_HREF = "/announcements";
export const ANNOUNCEMENTS_SEEDED_ID = "announcements-seeded";

export const clinicAnnouncementNav = {
    href: ANNOUNCEMENTS_HREF,
    copyKey: "notifAnnouncementNav" as const,
};

export type ClinicNotice = {
    id: string;
    copyKey: NoticeCopyKey;
    actor: string;
    initials: string;
    kind: NoticeKind;
    href: string;
    createdAt: string;
    unread: boolean;
    text?: string;
};

type AnnouncementPost = {
    id: string;
    postedOn: string;
    title: string;
};

const announcementNoticeId = (id: string) => `announcement:${id}`;

export const mergeAnnouncementNotices = (stored: ClinicNotice[], posts: AnnouncementPost[]): ClinicNotice[] => {
    const seeded = stored.some((item) => item.id === ANNOUNCEMENTS_SEEDED_ID);
    const previous = new Map(stored.map((item) => [item.id, item]));
    const announcements = posts.flatMap((post) => {
        const id = announcementNoticeId(post.id);
        const saved = previous.get(id);
        if (seeded && !saved) {
            return [];
        }
        return [
            {
                id,
                copyKey: "notifAnnouncementItem" as const,
                actor: "CarePlus Clinic",
                initials: "CC",
                kind: "announcement" as const,
                href: `${ANNOUNCEMENTS_HREF}#${post.id}`,
                createdAt: new Date(`${post.postedOn}T08:00:00+08:00`).toISOString(),
                unread: saved?.unread ?? true,
                text: post.title,
            },
        ];
    });
    return [...announcements, ...stored.filter((item) => item.kind !== "announcement" && item.id !== ANNOUNCEMENTS_SEEDED_ID)];
};

export const NOTICE_COPY_KEYS: NoticeCopyKey[] = [
    "notifVisitConfirmed",
    "notifMedReady",
    "notifRecordsNote",
    "notifVisitReminder",
    "notifMedCheckout",
    "notifAccountSaved",
    "notifRecordsResult",
    "notifAnnouncementItem",
    "notifAnnouncementNav",
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
        (item.kind === "visit" || item.kind === "medicine" || item.kind === "records" || item.kind === "account" || item.kind === "announcement") &&
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

export const markNoticesRead = (items: ClinicNotice[], ids: Iterable<string>): ClinicNotice[] => {
    const set = ids instanceof Set ? ids : new Set(ids);
    return items.map((item) => (set.has(item.id) ? { ...item, unread: false } : item));
};

export const markAllNoticesRead = (items: ClinicNotice[]): ClinicNotice[] => items.map((item) => ({ ...item, unread: false }));

export const deleteNotices = (items: ClinicNotice[], ids: Iterable<string>): ClinicNotice[] => {
    const drop = new Set(ids);
    return items.filter((item) => !drop.has(item.id));
};

export type NoticeOrder = "latest" | "oldest" | "date";

export const noticeCalendarDay = (createdAt: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(createdAt));

export const sortNotices = (items: ClinicNotice[], order: NoticeOrder = "latest", start = "", end = "") => {
    const pool =
        order === "date"
            ? items.filter((item) => {
                  const day = noticeCalendarDay(item.createdAt);
                  return (!start || day >= start) && (!end || day <= end);
              })
            : items;
    const sorted = [...pool].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
    return order === "oldest" ? sorted : sorted.reverse();
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
