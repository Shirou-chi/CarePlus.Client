export type NoticeKind = "visit" | "medicine" | "records" | "account" | "announcement" | "payment" | "family";

export const ANNOUNCEMENTS_HREF = "/announcements";

export const clinicAnnouncementNav = {
    href: ANNOUNCEMENTS_HREF,
    copyKey: "notifAnnouncementNav" as const,
};

export type ClinicNotice = {
    id: string;
    title: string;
    message: string;
    titleZh: string;
    messageZh: string;
    actor: string;
    initials: string;
    kind: NoticeKind;
    href: string;
    createdAt: string;
    unread: boolean;
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
