import { type FC, useState } from "react";
import { useNavigate } from "react-router";
import {
    CalendarCheck01,
    ShoppingCart01,
    ChevronDown,
    ChevronRight,
    File06,
    Grid01,
    HelpCircle,
    Moon01,
    Receipt,
    SearchMd,
    Sun,
    User01,
    Users01,
    Trash01,
} from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Link as AriaLink, Popover as AriaPopover } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { NavMenuItemLink } from "@/components/marketing/header-navigation/base-components/nav-menu-item";
import { requestHomeTour } from "@/components/marketing/home/home-tour";
import { HeaderNotifications } from "@/components/marketing/notifications/header-notifications";
import { useAuth } from "@/providers/auth-provider";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { useCart } from "@/providers/cart-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { formatRm, medicineName } from "@/utils/prescribed-medicine";

type ServiceLink = {
    title: string;
    subtitle: string;
    href: string;
};

type ServiceGroup = {
    id: string;
    title: string;
    subtitle: string;
    Icon: FC<{ className?: string }>;
    links: ServiceLink[];
};

const iconGhost =
    "inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring hover:text-[#456f75] focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-brand-300 dark:hover:text-white";

const useServiceGroups = (): ServiceGroup[] => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const bookHref = profile ? "/book" : "/login";
    const visitsHref = profile ? "/visits" : "/login";
    const historyHref = profile ? "/history" : "/login";
    const invoicesHref = profile ? "/invoices" : "/login";
    const paymentsHref = profile ? "/payments" : "/login";
    const ordersHref = profile ? "/orders" : "/login";
    const notesHref = profile ? "/notes" : "/login";
    const labsHref = profile ? "/labs" : "/login";
    const familyHref = profile ? "/family" : "/login";
    return [
        {
            id: "visits",
            title: t.visits,
            subtitle: t.visitsHint,
            Icon: CalendarCheck01,
            links: [
                { title: t.bookVisit, subtitle: t.bookVisitHint, href: bookHref },
                { title: t.upcomingVisits, subtitle: t.upcomingVisitsHint, href: visitsHref },
                { title: t.visitHistory, subtitle: t.visitHistoryHint, href: historyHref },
            ],
        },
        {
            id: "records",
            title: t.records,
            subtitle: t.recordsHint,
            Icon: File06,
            links: [
                { title: t.notes, subtitle: t.notesHint, href: notesHref },
                { title: t.labs, subtitle: t.labsHint, href: labsHref },
            ],
        },
        {
            id: "bills",
            title: t.bills,
            subtitle: t.billsHint,
            Icon: Receipt,
            links: [
                { title: t.invoices, subtitle: t.invoicesHint, href: invoicesHref },
                { title: t.payments, subtitle: t.paymentsHint, href: paymentsHref },
                { title: t.ordersTitle, subtitle: t.ordersHint, href: ordersHref },
            ],
        },
        {
            id: "family",
            title: t.family,
            subtitle: t.familyHint,
            Icon: Users01,
            links: [{ title: t.familyProfiles, subtitle: t.familyProfilesHint, href: familyHref }],
        },
    ];
};

const useOverdueLock = () => {
    const { profile } = useAuth();
    const { overdue } = useOutstandingInvoices();
    return Boolean(profile && overdue);
};

export const LandingHeader = () => {
    const { t } = useI18n();
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    const overdue = useOverdueLock();
    const signedInName = profile?.fullName.split(" ")[0] ?? t.signIn;
    const signOut = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-secondary bg-primary/90 backdrop-blur-md dark:border-white/10 dark:bg-[#0b2036]/92">
            <div className="mx-auto flex h-[4.5rem] w-full max-w-container items-center justify-between gap-4 px-4 md:h-22 md:px-8">
                <CarePlusLogo href={profile ? "/home" : "/"} />

                <div className="hidden items-center lg:flex">
                    <ServicesMega />
                    <NavIcons />
                    {profile ? null : (
                        <div className="ml-12 flex items-center gap-3">
                            <ThemeToggle />
                            <LanguageSwitch />
                        </div>
                    )}
                    {profile ? <TourButton /> : null}
                    <div className="mx-3 h-8 w-px bg-border-secondary" />
                    {profile ? (
                        <Dropdown.Root>
                            <AriaButton
                                data-tour="account"
                                aria-label={`${t.hello} ${signedInName}`}
                                className="group flex cursor-pointer items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-[#456f75] focus-visible:outline-2 data-[pressed]:bg-[#456f75]"
                            >
                                <Avatar size="md" src={profile.avatarUrl} alt="" />
                                <span className="leading-tight">
                                    <span className="block text-xs text-tertiary group-hover:text-white group-data-[pressed]:text-white">{t.hello}</span>
                                    <span className="block max-w-[7rem] truncate text-sm font-semibold text-primary group-hover:text-white group-data-[pressed]:text-white">{signedInName}</span>
                                </span>
                            </AriaButton>
                            <Dropdown.Popover>
                                <Dropdown.Menu>
                                    <Dropdown.Item icon={User01} selectionIndicator="none" onAction={() => navigate("/account")}>
                                        {t.viewProfile}
                                    </Dropdown.Item>
                                    <Dropdown.Item selectionIndicator="none" onAction={() => void signOut()}>
                                        {t.signOut}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                    ) : (
                        <a href="/login" className="group flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-[#456f75] focus-visible:outline-2">
                            <Avatar size="md" alt={signedInName} />
                            <span className="leading-tight">
                                <span className="block text-xs text-tertiary group-hover:text-white">{t.hello}</span>
                                <span className="block max-w-[7rem] truncate text-sm font-semibold text-primary group-hover:text-white">{signedInName}</span>
                            </span>
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-1 lg:hidden">
                    {overdue ? null : <HeaderNotifications />}
                    {overdue ? null : <HeaderCart />}
                    <MobileNav />
                    {profile ? <TourButton /> : null}
                    {profile ? <MobileAccount /> : null}
                </div>
            </div>
        </header>
    );
};

const NavIcons = () => {
    const { t } = useI18n();
    const overdue = useOverdueLock();

    return (
        <div className="ml-3 flex items-center gap-0.5">
            <Tooltip title={t.search}>
                <AriaLink aria-label={t.search} className={iconGhost} href="/#get-started">
                    <SearchMd className="size-5" />
                </AriaLink>
            </Tooltip>
            {overdue ? null : <HeaderNotifications />}
            {overdue ? null : <HeaderCart />}
        </div>
    );
};

const HeaderCart = () => {
    const { t, locale } = useI18n();
    useMedicineCatalog();
    const { lines, count, bump, clear } = useCart();

    return (
        <AriaDialogTrigger>
            <AriaButton data-cart-icon aria-label={count > 0 ? `${t.cart}, ${count}` : t.cart} className={cx(iconGhost, "relative")}>
                <span key={bump} className={cx("inline-flex", bump > 0 && "careplus-cart-bump")}>
                    <ShoppingCart01 className="size-5" />
                </span>
                {count > 0 ? (
                    <span aria-hidden="true" className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg-error-primary px-1 text-[10px] leading-none font-semibold text-white">
                        {count > 9 ? "9+" : count}
                    </span>
                ) : null}
            </AriaButton>
            <AriaPopover className="w-80 shadow-lg" offset={8} placement="bottom end">
                <AriaDialog className="outline-hidden" aria-label={t.cart}>
                    <div className="rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary_alt">
                        <p className="text-sm font-semibold text-primary">{t.cart}</p>
                        {lines.length === 0 ? (
                            <p className="mt-2 text-sm text-tertiary">{t.medCartEmptyHint}</p>
                        ) : (
                            <>
                                <ul className="mt-3 flex flex-col gap-3">
                                    {lines.map((line) => (
                                        <li key={line.medicineId} className="flex items-start justify-between gap-3">
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-primary">{medicineName(locale, line.medicineId, line.name)}</span>
                                                <span className="mt-0.5 block text-xs text-tertiary">
                                                    {t.medPickup} · ×{line.qty}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-sm font-semibold text-primary">{formatRm(line.unitPrice * line.qty)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button color="primary" size="sm" href="/cart" className="mt-4 w-full">
                                    {t.medCartView}
                                </Button>
                                <Button color="secondary" size="sm" iconLeading={Trash01} className="mt-2 w-full" onClick={clear}>
                                    {t.medClearCart}
                                </Button>
                            </>
                        )}
                    </div>
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );
};

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const { t } = useI18n();
    const isDark = theme === "dark";
    const label = isDark ? t.themeToLight : t.themeToDark;

    return (
        <Tooltip title={label}>
            <AriaButton aria-label={label} className={iconGhost} onPress={() => setTheme(isDark ? "light" : "dark")}>
                {isDark ? <Sun className="size-5" /> : <Moon01 className="size-5" />}
            </AriaButton>
        </Tooltip>
    );
};

const LanguageSwitch = () => {
    const { locale, setLocale, t } = useI18n();

    return (
        <ButtonGroup
            size="sm"
            className="careplus-lang"
            disallowEmptySelection
            selectedKeys={new Set([locale])}
            onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next === "en" || next === "zh") setLocale(next);
            }}
            aria-label={t.language}
        >
            <ButtonGroupItem id="en">EN</ButtonGroupItem>
            <ButtonGroupItem id="zh">CN</ButtonGroupItem>
        </ButtonGroup>
    );
};

const ServicesMega = () => {
    const { t } = useI18n();
    const serviceGroups = useServiceGroups();
    const [activeId, setActiveId] = useState(serviceGroups[0].id);
    const active = serviceGroups.find((group) => group.id === activeId) ?? serviceGroups[0];

    return (
        <div className="group relative">
            <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-sm font-semibold text-secondary ring-1 ring-secondary ring-inset outline-focus-ring hover:bg-[#456f75] hover:text-white hover:ring-transparent focus-visible:outline-2"
                aria-haspopup="true"
            >
                <Grid01 className="size-4 text-fg-quaternary dark:text-brand-300" />
                {t.services}
                <ChevronDown className="size-4 text-fg-quaternary transition group-hover:rotate-180 dark:text-brand-300" />
            </button>

            <div className="invisible absolute top-full right-0 z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="careplus-panel flex min-w-[40rem] overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt">
                    <ul className="w-56 shrink-0 border-r border-secondary bg-secondary_alt py-2">
                        {serviceGroups.map((group) => {
                            const Icon = group.Icon;
                            const isActive = group.id === active.id;
                            return (
                                <li key={group.id}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setActiveId(group.id)}
                                        onFocus={() => setActiveId(group.id)}
                                        className={cx(
                                            "flex w-full items-center gap-3 px-3.5 py-2.5 text-left outline-focus-ring focus-visible:outline-2",
                                            isActive ? "bg-primary text-primary" : "text-secondary hover:bg-primary hover:text-primary",
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0 text-fg-brand-primary dark:text-brand-300" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold">{group.title}</span>
                                        </span>
                                        <ChevronRight className="size-4 text-fg-quaternary" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="min-w-0 flex-1 p-2">
                        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-tertiary">{active.subtitle}</p>
                        <ul className="flex flex-col gap-0.5">
                            {active.links.map((link) => (
                                <li key={link.title}>
                                    <NavMenuItemLink href={link.href} title={link.title} subtitle={link.subtitle} icon={active.Icon} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TourButton = () => {
    const { t } = useI18n();
    const navigate = useNavigate();

    return (
        <button
            type="button"
            data-tour="tutorial"
            aria-label={t.tourNavTitle}
            className={iconGhost}
            onClick={() => {
                requestHomeTour();
                if (window.location.pathname !== "/home") navigate("/home");
            }}
        >
            <HelpCircle className="size-5" />
        </button>
    );
};

const MobileAccount = () => {
    const { t } = useI18n();
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    if (!profile) return null;
    const signOut = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <Dropdown.Root>
            <AriaButton data-tour="account" aria-label={t.viewProfile} className="cursor-pointer rounded-full p-0.5 outline-focus-ring focus-visible:outline-2">
                <Avatar size="sm" src={profile.avatarUrl} alt="" />
            </AriaButton>
            <Dropdown.Popover>
                <Dropdown.Menu>
                    <Dropdown.Item icon={User01} selectionIndicator="none" onAction={() => navigate("/account")}>
                        {t.viewProfile}
                    </Dropdown.Item>
                    <Dropdown.Item selectionIndicator="none" onAction={() => void signOut()}>
                        {t.signOut}
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

const MobileNav = () => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const serviceGroups = useServiceGroups();

    return (
        <AriaDialogTrigger>
            <AriaButton
                aria-label="Toggle navigation menu"
                className={({ isFocusVisible, isHovered }) =>
                    cx(
                        "group cursor-pointer rounded-lg p-2 lg:hidden",
                        isHovered && "bg-primary_hover",
                        isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                    )
                }
            >
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        className="hidden text-secondary group-aria-expanded:block dark:text-brand-300"
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        className="text-secondary group-aria-expanded:hidden dark:text-brand-300"
                        d="M3 12H21M3 6H21M3 18H21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </AriaButton>
            <AriaPopover className="w-[min(100vw-1.5rem,24rem)] shadow-lg lg:hidden" offset={8} placement="bottom end">
                <AriaDialog className="outline-hidden">
                    <nav className="careplus-panel max-h-[80dvh] overflow-y-auto rounded-2xl bg-primary p-3 shadow-lg ring-1 ring-secondary_alt">
                        <p className="px-2 pb-2 text-sm font-semibold text-tertiary">{t.services}</p>
                        {serviceGroups.map((group) => (
                            <details key={group.id} className="border-b border-secondary">
                                <summary className="cursor-pointer list-none px-2 py-3 text-md font-semibold text-primary">{group.title}</summary>
                                <ul className="pb-2">
                                    {group.links.map((link) => (
                                        <li key={link.title}>
                                            <NavMenuItemLink href={link.href} title={link.title} subtitle={link.subtitle} />
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ))}
                        {profile ? null : (
                            <div className="mt-3 flex items-center justify-between gap-3 px-2 py-2">
                                <ThemeToggle />
                                <LanguageSwitch />
                            </div>
                        )}
                        {profile ? null : (
                            <div className="mt-1 flex flex-col gap-2 px-2 pb-2">
                                <a href="/login" className="rounded-lg px-3 py-2.5 text-md font-semibold text-secondary hover:bg-primary_hover">
                                    {t.logIn}
                                </a>
                                <a href="/register" className="careplus-ink rounded-lg px-3 py-2.5 text-center text-md font-semibold text-white">
                                    {t.signUp}
                                </a>
                            </div>
                        )}
                    </nav>
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );
};
