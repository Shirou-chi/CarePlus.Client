import { CalendarCheck01, HomeLine, MessageChatCircle, Plus } from "@untitledui/icons";
import { Button as AriaButton } from "react-aria-components";
import { NavLink, useLocation } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { AccountSheet } from "@/components/marketing/header-navigation/account-sheet";
import { useAuth } from "@/providers/auth-provider";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export const shouldHideMobileBottomNav = (pathname: string) =>
    pathname === "/"
    || pathname.startsWith("/login")
    || pathname.startsWith("/register")
    || pathname.startsWith("/forgot-password")
    || pathname.startsWith("/staff")
    || pathname.startsWith("/about")
    || pathname.startsWith("/contact")
    || pathname.startsWith("/announcements");

const meInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

export const MobileBottomNav = () => {
    const { profile } = useAuth();
    const { overdue } = useOutstandingInvoices();
    const { t } = useI18n();
    const { pathname } = useLocation();

    if (!profile || shouldHideMobileBottomNav(pathname)) return null;

    const bookHref = overdue ? "/invoices" : "/book";
    const visitsHref = overdue ? "/invoices" : "/visits";
    const chatHref = overdue ? "/invoices" : "/chat";
    const meActive = pathname === "/account";
    const bookActive = pathname === "/book" || pathname.startsWith("/book/") || (overdue && pathname.startsWith("/invoices"));

    return (
        <nav
            aria-label={t.navHome}
            className="careplus-mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-secondary bg-primary/90 backdrop-blur-md lg:hidden dark:border-white/10 dark:bg-[#0a0a0a]/92"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-end px-1">
                <Tab to="/home" label={t.navHome} Icon={HomeLine} />
                <Tab to={visitsHref} label={t.navVisits} Icon={CalendarCheck01} match="/visits" also="/history" />
                <NavLink
                    to={bookHref}
                    aria-label={t.navBook}
                    aria-current={bookActive ? "page" : undefined}
                    className="relative -top-5 flex flex-col items-center justify-center outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <span className="careplus-ink flex size-14 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white dark:ring-[#0a0a0a]">
                        <Plus className="size-7" />
                    </span>
                    <span className={cx("mt-1 text-[11px] font-semibold", bookActive ? "text-brand-secondary" : "text-tertiary")}>{t.navBook}</span>
                </NavLink>
                <Tab to={chatHref} label={t.navChat} Icon={MessageChatCircle} match="/chat" />
                <AccountSheet>
                    <AriaButton
                        data-tour="account"
                        aria-label={t.navMe}
                        className="flex cursor-pointer flex-col items-center justify-center gap-1 pb-2 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Avatar
                            size="sm"
                            src={profile.avatarUrl}
                            alt=""
                            initials={meInitials(profile.fullName)}
                            className={cx(meActive && "ring-2 ring-brand-secondary ring-offset-2 ring-offset-primary")}
                        />
                        <span className={cx("text-[11px] font-semibold", meActive ? "text-brand-secondary" : "text-tertiary")}>{t.navMe}</span>
                    </AriaButton>
                </AccountSheet>
            </div>
        </nav>
    );
};

const Tab = ({
    to,
    label,
    Icon,
    match,
    also,
}: {
    to: string;
    label: string;
    Icon: typeof HomeLine;
    match?: string;
    also?: string;
}) => {
    const { pathname } = useLocation();
    const active = match
        ? pathname === match || pathname.startsWith(`${match}/`) || (also ? pathname === also || pathname.startsWith(`${also}/`) : false)
        : pathname === to || pathname.startsWith(`${to}/`);

    return (
        <NavLink
            to={to}
            aria-current={active ? "page" : undefined}
            className={cx(
                "flex flex-col items-center justify-center gap-1 pb-2 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                active ? "text-brand-secondary" : "text-fg-quaternary",
            )}
        >
            <Icon className="size-5" />
            <span className={cx("text-[11px] font-semibold", active ? "text-brand-secondary" : "text-tertiary")}>{label}</span>
        </NavLink>
    );
};
