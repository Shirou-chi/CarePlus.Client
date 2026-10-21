import { Avatar } from "@/components/base/avatar/avatar";
import type { Copy } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";
import { formatNoticeAge, type ClinicNotice, type NoticeKind } from "@/utils/notifications";

export const noticeKindLabel = (kind: NoticeKind, t: Copy) => {
    if (kind === "visit") return t.notifKindVisit;
    if (kind === "medicine") return t.notifKindMedicine;
    if (kind === "records") return t.notifKindRecords;
    return t.notifKindAccount;
};

export const noticeMessage = (item: ClinicNotice, t: Copy) => t[item.copyKey].replace("{actor}", item.actor);

export const noticeMeta = (item: ClinicNotice, t: Copy, locale: "en" | "zh", now = Date.now()) =>
    `${formatNoticeAge(item.createdAt, now, locale)} · ${noticeKindLabel(item.kind, t)}`;

type NotificationItemProps = {
    actor: string;
    initials: string;
    message: string;
    meta: string;
    unread: boolean;
    href: string;
    onOpen: () => void;
};

export const NotificationItem = ({ actor, initials, message, meta, unread, href, onOpen }: NotificationItemProps) => (
    <a
        href={href}
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
    >
        <Avatar size="md" initials={initials} alt={actor} />
        <span className="min-w-0 flex-1">
            <span className={cx("block text-sm text-primary", unread ? "font-semibold" : "font-medium")}>{message}</span>
            <span className="mt-0.5 block text-xs text-tertiary">{meta}</span>
        </span>
        {unread ? <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-[#0b1f38]" /> : <span className="mt-2 size-2 shrink-0" />}
    </a>
);
