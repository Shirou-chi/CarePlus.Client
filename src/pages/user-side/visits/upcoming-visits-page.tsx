import { useMemo, useState } from "react";
import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";
import { CalendarPlus01 } from "@untitledui/icons";
import { Link, Navigate } from "react-router";
import { DatePicker } from "@/components/application/date-picker/date-picker";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Locale } from "@/providers/locale-provider";
import { cancelAppointment, getBookingSlots, listUpcomingVisits, rescheduleAppointment, rescheduleBlocked, type BookedAppointment } from "@/utils/booking";
import { cx } from "@/utils/cx";
import { getDoctorById } from "@/utils/doctors";

const initials = (name: string) =>
    name
        .replace(/^Dr\s+/i, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const klDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

const klShift = (iso: string): "morning" | "night" => {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(iso)));
    return hour >= 18 || hour < 6 ? "night" : "morning";
};

export const UpcomingVisitsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [tick, setTick] = useState(0);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
    const [pendingCancel, setPendingCancel] = useState<BookedAppointment | null>(null);
    const [pendingSave, setPendingSave] = useState<{ visit: BookedAppointment; startAt: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const visits = useMemo(() => (profile ? listUpcomingVisits(profile) : []), [profile, tick]);
    const [next, ...later] = visits;

    const typeLabel = (id: string) => {
        if (id === "general") return t.visitGeneral;
        if (id === "mental") return t.visitMental;
        if (id === "screening") return t.visitScreening;
        return id;
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString(locale === "zh" ? "zh-MY" : "en-MY", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const confirmCancel = () => {
        if (!profile || !pendingCancel) return;
        cancelAppointment(profile, pendingCancel.id);
        setEditingId((current) => (current === pendingCancel.id ? null : current));
        setPendingCancel(null);
        setNotice({ ok: true, text: t.visitsCancelled });
        setTick((count) => count + 1);
    };

    const confirmSave = () => {
        if (!profile || !pendingSave) return;
        try {
            rescheduleAppointment(profile, pendingSave.visit.id, pendingSave.startAt);
            setEditingId(null);
            setNotice({ ok: true, text: t.visitsRescheduled });
            setTick((count) => count + 1);
        } catch (cause) {
            const code = cause instanceof Error ? cause.message : "";
            setNotice({ ok: false, text: code === "reschedule-limit" ? t.visitsRescheduleBlocked : t.bookSlotTaken });
        }
        setPendingSave(null);
    };

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    const actions = (visit: BookedAppointment) => (
        <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    color="secondary"
                    size="sm"
                    onClick={() => {
                        if (rescheduleBlocked(visit.id)) {
                            setNotice({ ok: false, text: t.visitsRescheduleBlocked });
                            return;
                        }
                        setEditingId((current) => (current === visit.id ? null : visit.id));
                    }}
                >
                    {t.visitsReschedule}
                </Button>
                <Button color="secondary-destructive" size="sm" onClick={() => setPendingCancel(visit)}>
                    {t.visitsCancel}
                </Button>
            </div>
            {editingId === visit.id ? (
                <ReschedulePanel visit={visit} onAskSave={(startAt) => setPendingSave({ visit, startAt })} />
            ) : null}
        </div>
    );

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8 md:py-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.upcomingVisits}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.visitsBody}</p>
                        <p className="mt-4 max-w-3xl rounded-xl bg-primary px-4 py-3 text-sm text-primary ring-1 ring-secondary">{t.visitsLimitNote}</p>
                    </div>
                    {next ? (
                        <Button href="/book" color="primary" size="md" iconLeading={CalendarPlus01}>
                            {t.visitsBookAnother}
                        </Button>
                    ) : null}
                </div>

                {notice ? (
                    <p role="status" className={cx("mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-white", notice.ok ? "bg-success-solid" : "bg-error-solid")}>
                        {notice.text}
                    </p>
                ) : null}

                {!next ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={CalendarPlus01} color="brand" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{t.visitsEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{t.visitsEmptyBody}</p>
                        <Button href="/book" color="primary" size="md" className="mt-6">
                            {t.bookVisit}
                        </Button>
                    </div>
                ) : (
                    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <section className="min-w-0 rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-tertiary">{t.visitsNext}</p>
                                <Badge color="success" size="sm">
                                    {t.visitsConfirmed}
                                </Badge>
                            </div>
                            <VisitPerson visit={next} locale={locale} />
                            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-secondary px-4 py-3">
                                <div>
                                    <p className="text-xs font-medium text-tertiary">{t.date}</p>
                                    <p className="mt-0.5 text-md font-semibold text-primary">{formatDate(next.startAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-tertiary">{t.time}</p>
                                    <p className="mt-0.5 text-md font-semibold text-primary">{formatTime(next.startAt)}</p>
                                </div>
                            </div>
                            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-tertiary">{t.visitsFor}</dt>
                                    <dd className="mt-0.5 font-medium text-primary">{next.forName}</dd>
                                </div>
                                <div>
                                    <dt className="text-tertiary">{t.bookStepType}</dt>
                                    <dd className="mt-0.5 font-medium text-primary">{typeLabel(next.type)}</dd>
                                </div>
                            </dl>
                            {next.notes ? <p className="mt-4 text-sm text-tertiary">{next.notes}</p> : null}
                            {actions(next)}
                        </section>

                        <aside className="min-w-0">
                            <h2 className="text-md font-semibold text-primary">{t.visitsLater}</h2>
                            {later.length === 0 ? (
                                <p className="mt-3 text-sm text-tertiary">{t.visitsNoneLater}</p>
                            ) : (
                                <ul className="mt-3 flex flex-col gap-3">
                                    {later.map((visit) => (
                                        <li key={visit.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                                            <VisitPerson visit={visit} locale={locale} compact />
                                            <p className="mt-3 text-sm font-medium text-primary">
                                                {formatDate(visit.startAt)} · {formatTime(visit.startAt)}
                                            </p>
                                            <p className="mt-1 text-sm text-tertiary">{typeLabel(visit.type)}</p>
                                            {actions(visit)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </aside>
                    </div>
                )}
            </main>
            <LandingFooter />

            <ModalOverlay isDismissable isOpen={pendingCancel !== null} onOpenChange={(open) => !open && setPendingCancel(null)}>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                        {pendingCancel ? (
                            <>
                                <h2 className="text-lg font-semibold text-primary">{t.visitsCancelTitle}</h2>
                                <p className="mt-2 text-sm text-tertiary">{t.visitsCancelBody}</p>
                                <p className="mt-4 text-sm font-medium text-primary">
                                    {formatDate(pendingCancel.startAt)} · {formatTime(pendingCancel.startAt)}
                                </p>
                                <div className="mt-6 flex flex-col gap-3">
                                    <Button color="primary-destructive" size="lg" onClick={confirmCancel}>
                                        {t.visitsCancelConfirm}
                                    </Button>
                                    <Button color="secondary" size="lg" onClick={() => setPendingCancel(null)}>
                                        {t.visitsCancelKeep}
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>

            <ModalOverlay isDismissable isOpen={pendingSave !== null} onOpenChange={(open) => !open && setPendingSave(null)}>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                        {pendingSave ? (
                            <>
                                <h2 className="text-lg font-semibold text-primary">{t.visitsSaveTitle}</h2>
                                <p className="mt-2 text-sm text-tertiary">{t.visitsSaveBody}</p>
                                <p className="mt-4 text-sm font-medium text-primary">
                                    {formatDate(pendingSave.startAt)} · {formatTime(pendingSave.startAt)}
                                </p>
                                <div className="mt-6 flex flex-col gap-3">
                                    <Button color="primary" size="lg" onClick={confirmSave}>
                                        {t.visitsRescheduleSave}
                                    </Button>
                                    <Button color="secondary" size="lg" onClick={() => setPendingSave(null)}>
                                        {t.visitsSaveKeep}
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

const ReschedulePanel = ({ visit, onAskSave }: { visit: BookedAppointment; onAskSave: (startAt: string) => void }) => {
    const { t } = useI18n();
    const [date, setDate] = useState<DateValue>(() => parseDate(klDay(visit.startAt)));
    const [shift, setShift] = useState<"morning" | "night">(() => klShift(visit.startAt));
    const [slot, setSlot] = useState<string | null>(visit.startAt);
    const slots = getBookingSlots(date.toString(), visit.doctorId);
    const open = (shift === "morning" ? slots.morning : slots.night).map((item) => (item.startAt === visit.startAt ? { ...item, booked: false } : item));

    return (
        <div className="rounded-xl bg-secondary p-3">
            <p className="text-sm font-semibold text-primary">{t.visitsRescheduleTitle}</p>
            <div className="mt-3 flex flex-col gap-3">
                <DatePicker aria-label={t.bookPickDate} value={date} minValue={today(getLocalTimeZone())} onChange={(next) => next && (setDate(next), setSlot(null))} />
                <div className="grid grid-cols-2 gap-2">
                    <Button color={shift === "morning" ? "primary" : "secondary"} size="sm" onClick={() => (setShift("morning"), setSlot(null))}>
                        {t.bookMorning}
                    </Button>
                    <Button color={shift === "night" ? "primary" : "secondary"} size="sm" onClick={() => (setShift("night"), setSlot(null))}>
                        {t.bookNight}
                    </Button>
                </div>
                <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                    {open.map((item) => (
                        <button
                            key={item.startAt}
                            type="button"
                            disabled={item.booked}
                            onClick={() => setSlot(item.startAt)}
                            className={cx(
                                "min-h-11 rounded-xl px-2 py-2 text-sm font-semibold ring-1 transition",
                                item.booked && "cursor-not-allowed bg-secondary text-tertiary ring-transparent dark:bg-white/10 dark:ring-white/30",
                                !item.booked && slot === item.startAt && "bg-primary text-brand-secondary ring-2 ring-brand-solid dark:bg-white/15 dark:ring-brand-300",
                                !item.booked && slot !== item.startAt && "bg-primary text-primary ring-secondary hover:ring-brand dark:bg-white/12 dark:ring-white/40",
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <Button color="primary" size="sm" isDisabled={!slot || slot === visit.startAt} onClick={() => slot && onAskSave(slot)}>
                    {t.visitsRescheduleSave}
                </Button>
            </div>
        </div>
    );
};

const VisitPerson = ({ visit, locale, compact }: { visit: BookedAppointment; locale: Locale; compact?: boolean }) => {
    const doctor = visit.doctorId === "any" ? null : getDoctorById(locale, visit.doctorId);
    const { t } = useI18n();
    const name = doctor?.name ?? t.bookAnyDoctor;

    return (
        <div className={compact ? "flex items-center gap-3" : "mt-4 flex items-center gap-3"}>
            <Avatar size={compact ? "md" : "lg"} initials={initials(name)} alt="" />
            <div className="min-w-0">
                {doctor ? (
                    <Link to={`/doctors/${doctor.id}`} className="block truncate text-md font-semibold text-primary outline-focus-ring hover:text-brand-secondary focus-visible:outline-2">
                        {doctor.name}
                    </Link>
                ) : (
                    <p className="truncate text-md font-semibold text-primary">{name}</p>
                )}
                <p className="truncate text-sm text-tertiary">
                    {t.visitsFor} {visit.forName}
                </p>
            </div>
        </div>
    );
};
