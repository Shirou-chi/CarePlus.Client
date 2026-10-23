import { Bell01 } from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Link as AriaLink, Popover as AriaPopover } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { NotificationItem, noticeMessage, noticeMeta } from "@/components/marketing/notifications/notification-item";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { useNotices } from "@/providers/notification-provider";
import { cx } from "@/utils/cx";
import { clinicAnnouncementNav } from "@/utils/notifications";

const iconGhost =
    "inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring hover:text-[#456f75] focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-brand-300 dark:hover:text-white";

export const HeaderNotifications = () => {
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const { unread, unreadCount, markRead, markAllRead } = useNotices();
    const preview = unread.slice(0, 6);

    if (!profile) {
        return (
            <AriaLink aria-label={t.announcements} className={iconGhost} href={clinicAnnouncementNav.href}>
                <Bell01 className="size-5" />
            </AriaLink>
        );
    }

    return (
        <AriaDialogTrigger>
            <AriaButton aria-label={unreadCount > 0 ? `${t.notifications}, ${unreadCount}` : t.notifications} className={cx(iconGhost, "relative")}>
                <Bell01 className="size-5" />
                {unreadCount > 0 ? (
                    <span
                        aria-hidden="true"
                        className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg-error-primary px-1 text-[10px] leading-none font-semibold text-white"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                ) : null}
            </AriaButton>
            <AriaPopover className="w-[min(100vw-1.5rem,22rem)] shadow-lg" offset={8} placement="bottom end">
                <AriaDialog className="outline-hidden" aria-label={t.notifications}>
                    <div className="rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary_alt">
                        <p className="text-sm font-semibold text-primary">{t.notifications}</p>
                        <Button color="link-color" size="sm" className="mt-1" href={clinicAnnouncementNav.href}>
                            {t[clinicAnnouncementNav.copyKey]}
                        </Button>
                        {preview.length === 0 ? (
                            <>
                                <p className="mt-2 text-sm text-tertiary">{t.notifEmptyUnreadHint}</p>
                                <Button color="secondary" size="sm" className="mt-4 w-full" href="/notifications">
                                    {t.notifViewAll}
                                </Button>
                            </>
                        ) : (
                            <>
                                <ul className="mt-2 max-h-80 overflow-y-auto">
                                    {preview.map((item) => (
                                        <li key={item.id} className="border-b border-secondary last:border-b-0">
                                            <NotificationItem
                                                actor={item.actor}
                                                initials={item.initials}
                                                message={noticeMessage(item, t)}
                                                meta={noticeMeta(item, t, locale)}
                                                unread={item.unread}
                                                href={item.href}
                                                onOpen={() => markRead(item.id)}
                                            />
                                            <div className="flex justify-end px-2 pb-2">
                                                <Button color="secondary" size="sm" onPress={() => markRead(item.id)}>
                                                    {t.notifMarkRead}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-3 flex gap-2">
                                    <Button color="primary" size="sm" className="min-w-0 flex-1 careplus-ink" href="/notifications">
                                        {t.notifViewAll}
                                    </Button>
                                    <Button color="secondary" size="sm" className="min-w-0 flex-1" onPress={markAllRead}>
                                        {t.notifClearAll}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );
};
