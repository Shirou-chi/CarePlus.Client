import type { FC, ReactNode } from "react";
import {
    ActivityHeart,
    CalendarCheck01,
    ChevronRight,
    Clock,
    ClockRewind,
    CreditCard01,
    File06,
    Globe01,
    HelpCircle,
    LogOut01,
    Moon01,
    Receipt,
    Settings01,
    Sun,
    Package,
    Truck01,
    Type01,
    Users01,
    XClose,
} from "@untitledui/icons";
import { Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { requestHomeTour } from "@/components/marketing/home/home-tour";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { type TextSize, useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

type Icon = FC<{ className?: string }>;

const initials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

/** Mobile account menu as a bottom sheet. `children` is the pressable trigger (a react-aria Button). */
export const AccountSheet = ({ children }: { children: ReactNode }) => (
    <AriaDialogTrigger>
        {children}
        <AriaModalOverlay
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[60] flex items-end justify-center bg-overlay/70 backdrop-blur-[2px] lg:hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-lg outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-bottom",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-bottom",
                    )
                }
            >
                <AriaDialog className="careplus-sheet max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-primary pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl ring-1 ring-secondary outline-hidden">
                    {({ close }) => <SheetBody close={close} />}
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    </AriaDialogTrigger>
);

const SheetBody = ({ close }: { close: () => void }) => {
    const { t, locale, setLocale } = useI18n();
    const { theme, setTheme, textSize, setTextSize } = useTheme();
    const { profile, logout } = useAuth();
    const { overdue } = useOutstandingInvoices();
    const navigate = useNavigate();
    if (!profile) return null;

    const go = (href: string) => {
        close();
        navigate(href);
    };

    return (
        <>
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-secondary bg-primary px-5 pt-3 pb-4">
                <span aria-hidden className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-fg-quaternary/40" />
                <Avatar size="lg" src={profile.avatarUrl} alt="" initials={initials(profile.fullName)} className="mt-3 shrink-0" />
                <div className="mt-3 min-w-0 flex-1">
                    <p className="line-clamp-2 text-lg font-semibold break-words text-primary">{profile.fullName}</p>
                    <button type="button" onClick={() => go("/account")} className="text-sm font-semibold text-brand-secondary hover:underline">
                        {t.viewProfile}
                    </button>
                </div>
                <button
                    type="button"
                    aria-label={t.sheetClose}
                    onClick={close}
                    className="mt-3 flex size-10 shrink-0 items-center justify-center self-start rounded-full text-fg-quaternary hover:bg-primary_hover"
                >
                    <XClose className="size-5" />
                </button>
            </div>

            <div className="flex flex-col gap-5 px-5 pt-4">
                {overdue ? null : (
                    <>
                        <TileGroup title={t.sheetVisits}>
                            <Tile label={t.sheetUpcoming} Icon={CalendarCheck01} onPress={() => go("/visits")} />
                            <Tile label={t.sheetHistory} Icon={ClockRewind} onPress={() => go("/history")} />
                            <Tile label={t.sheetQueue} Icon={Clock} onPress={() => go("/queue")} />
                        </TileGroup>
                        <TileGroup title={t.sheetHealth}>
                            <Tile label={t.sheetClinicRecords} Icon={File06} onPress={() => go("/clinic-records")} />
                            <Tile label={t.sheetHealthRecords} Icon={ActivityHeart} onPress={() => go("/records")} />
                            <Tile label={t.sheetFamily} Icon={Users01} onPress={() => go("/family")} />
                        </TileGroup>
                    </>
                )}
                <TileGroup title={t.sheetBills}>
                    <Tile label={t.sheetInvoices} Icon={Receipt} onPress={() => go("/invoices")} />
                    {overdue ? null : <Tile label={t.sheetPayments} Icon={CreditCard01} onPress={() => go("/payments")} />}
                    {overdue ? null : <Tile label={t.sheetOrders} Icon={Truck01} onPress={() => go("/orders")} />}
                    {overdue ? null : <Tile label={t.sheetDispensing} Icon={Package} onPress={() => go("/dispensing-history")} />}
                </TileGroup>

                <section>
                    <h2 className="text-sm font-medium text-tertiary">{t.sheetAccount}</h2>
                    <ul className="mt-1">
                        <Row label={t.sheetSettings} Icon={Settings01} onPress={() => go("/account")} />
                        {overdue ? null : (
                            <Row
                                label={t.tourNavTitle}
                                Icon={HelpCircle}
                                onPress={() => {
                                    requestHomeTour();
                                    go("/home");
                                }}
                            />
                        )}
                        <SettingRow label={t.settingsAppearance} Icon={theme === "dark" ? Moon01 : Sun}>
                            <Segmented
                                value={theme === "dark" ? "dark" : "light"}
                                onChange={(value) => setTheme(value as "light" | "dark")}
                                options={[
                                    { id: "light", label: t.sheetLight, Icon: Sun },
                                    { id: "dark", label: t.sheetDark, Icon: Moon01 },
                                ]}
                            />
                        </SettingRow>
                        <SettingRow label={t.settingsTextSize} Icon={Type01}>
                            <Segmented
                                value={textSize}
                                onChange={(value) => setTextSize(value as TextSize)}
                                options={[
                                    { id: "normal", label: "A", ariaLabel: t.settingsTextSizeNormal },
                                    { id: "large", label: "A+", ariaLabel: t.settingsTextSizeLarge },                                ]}
                            />
                        </SettingRow>
                        <SettingRow label={t.language} Icon={Globe01}>
                            <Segmented
                                value={locale}
                                onChange={(value) => setLocale(value as "en" | "zh")}
                                options={[
                                    { id: "en", label: "EN" },
                                    { id: "zh", label: "中文" },
                                ]}
                            />
                        </SettingRow>
                        <li>
                            <button
                                type="button"
                                onClick={async () => {
                                    close();
                                    await logout();
                                    navigate("/login");
                                }}
                                className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-md font-semibold text-error-primary"
                            >
                                <LogOut01 className="size-5 shrink-0" />
                                {t.signOut}
                            </button>
                        </li>
                    </ul>
                </section>
            </div>
        </>
    );
};

const TileGroup = ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
        <h2 className="text-sm font-medium text-tertiary">{title}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">{children}</div>
    </section>
);

const Tile = ({ label, Icon, onPress }: { label: string; Icon: Icon; onPress: () => void }) => (
    <button
        type="button"
        onClick={onPress}
        className="flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-primary px-2 py-3 text-center ring-1 ring-secondary outline-focus-ring transition hover:bg-primary_hover focus-visible:outline-2"
    >
        <Icon className="size-5 shrink-0 text-fg-secondary" />
        <span className="w-full text-sm leading-tight font-semibold break-words text-primary">{label}</span>
    </button>
);

const Row = ({ label, Icon, onPress }: { label: string; Icon: Icon; onPress: () => void }) => (
    <li>
        <button type="button" onClick={onPress} className="flex min-h-12 w-full items-center gap-3 py-2 text-left">
            <Icon className="size-5 shrink-0 text-fg-secondary" />
            <span className="min-w-0 flex-1 text-md font-semibold text-primary">{label}</span>
            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
        </button>
    </li>
);

const SettingRow = ({ label, Icon, children }: { label: string; Icon: Icon; children: ReactNode }) => (
    <li className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 py-2">
        <span className="flex min-w-0 flex-1 items-center gap-3">
            <Icon className="size-5 shrink-0 text-fg-secondary" />
            <span className="text-md font-semibold whitespace-nowrap text-primary">{label}</span>
        </span>
        {children}
    </li>
);

const Segmented = ({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { id: string; label: string; ariaLabel?: string; Icon?: Icon }[];
}) => (
    <div role="radiogroup" className="ml-auto flex shrink-0 rounded-xl bg-secondary p-1 ring-1 ring-secondary">
        {options.map((option) => {
            const selected = option.id === value;
            return (
                <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={option.ariaLabel}
                    onClick={() => onChange(option.id)}
                    className={cx(
                        "flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
                        selected ? "bg-primary text-primary shadow-xs ring-1 ring-secondary" : "text-tertiary hover:text-primary",
                    )}
                >
                    {option.Icon ? <option.Icon className="size-4" /> : null}
                    {option.label}
                </button>
            );
        })}
    </div>
);
