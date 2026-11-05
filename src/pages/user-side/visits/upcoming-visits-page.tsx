import { useEffect, useState } from "react";
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
import { appointmentApi, type Appointment, type BookingSlots } from "@/services/appointmentApi";
import { cx } from "@/utils/cx";

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
    const [visits, setVisits] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<Appointment | null>(null);
    const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null);
    const [pendingSave, setPendingSave] = useState<{ visit: Appointment; startAt: string } | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const loadVisits = async () => {
        if (!profile) return;
        setLoading(true);
        setLoadError(null);
        try {
            setVisits(await appointmentApi.upcoming());
        } catch (cause) {
            setLoadError(cause instanceof Error ? cause.message : t.authFailed);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadVisits();
    }, [profile]);

    const [next, ...later] = visits;

    const typeLabel = (id: string) => {
        if (id === "VT01") return t.visitGeneral;
        if (id === "VT02") return t.visitScreening;
        if (id === "VT03") return t.visitMental;
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

    const confirmCancel = async () => {
        if (!pendingCancel) return;
        try {
            await appointmentApi.cancel(pendingCancel.id);
            await loadVisits();
        } catch (cause) {
            setNotice({ ok: false, text: cause instanceof Error ? cause.message : t.authFailed });
            return;
        }
        setEditingId((current) => (current === pendingCancel.id ? null : current));
        setPendingCancel(null);
        setNotice({ ok: true, text: t.visitsCancelled });
    };

    const confirmSave = async () => {
        if (!pendingSave) return;
        try {
            await appointmentApi.reschedule(pendingSave.visit.id, pendingSave.startAt);
            await loadVisits();
            setEditingId(null);
            setNotice({ ok: true, text: t.visitsRescheduled });
        } catch (cause) {
            const code = cause instanceof Error ? cause.message : "";
            setNotice({
                ok: false,
                text: code === "reschedule-limit" ? t.visitsRescheduleBlocked : code === "same-day-session-limit" ? t.visitsSameDaySessionLimit : t.bookSlotTaken,
            });
        }
        setPendingSave(null);
    };

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    const actions = (visit: Appointment) => (
        <div className="mt-4 flex flex-col gap-3" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <div className="flex flex-wrap gap-2">
                <Button
                    color="secondary"
                    size="sm"
                    onClick={() => {
                        if (visit.rescheduleBlocked) {
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

                {loadError ? (
                    <p role="alert" className="mt-4 rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">{loadError}</p>
                ) : null}
                {notice ? (
                    <p role="status" className={cx("mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-white", notice.ok ? "bg-success-solid" : "bg-error-solid")}>
                        {notice.text}
                    </p>
                ) : null}

                {loading ? (
                    <p className="mt-10 rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">{t.phrLoading}</p>
                ) : !next ? (
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
                        <section
                            className="min-w-0 cursor-pointer rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary transition hover:ring-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:p-6"
                            role="button"
                            tabIndex={0}
                            aria-label={t.visitsViewDetails}
                            onClick={() => setSelectedVisit(next)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedVisit(next);
                                }
                            }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <p className="text-sm font-semibold text-tertiary">{t.visitsNext}</p>
                                    <span className="text-xs font-semibold text-brand-secondary">{t.visitsViewDetails}</span>
                                </div>
                                <Badge color="success" size="sm">{t.visitsConfirmed}</Badge>
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
                                        <li
                                            key={visit.id}
                                            className="cursor-pointer rounded-2xl bg-primary p-4 ring-1 ring-secondary transition hover:ring-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={t.visitsViewDetails}
                                            onClick={() => setSelectedVisit(visit)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    setSelectedVisit(visit);
                                                }
                                            }}
                                        >
                                            <VisitPerson visit={visit} locale={locale} compact />
                                            <p className="mt-3 text-xs font-semibold text-brand-secondary">{t.visitsViewDetails}</p>
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

            <ModalOverlay isDismissable isOpen={selectedVisit !== null} onOpenChange={(open) => !open && setSelectedVisit(null)}>
                <Modal className="w-full max-w-lg">
                    <Dialog className="flex w-full flex-col items-stretch justify-start rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                        {selectedVisit ? (
                            <>
                                <h2 className="text-lg font-semibold text-primary">{t.visitsDetailsTitle}</h2>
                                <p className="mt-1 text-sm text-tertiary">{selectedVisit.doctorName}</p>
                                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs text-tertiary">{t.date}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-primary">{formatDate(selectedVisit.startAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">{t.time}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-primary">{formatTime(selectedVisit.startAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">{t.visitsFor}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-primary">{selectedVisit.forName}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">{t.bookStepType}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-primary">{typeLabel(selectedVisit.type)}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs text-tertiary">{t.visitsStatus}</dt>
                                        <dd className="mt-1 text-sm font-semibold text-primary">{selectedVisit.status === "completed" ? t.historyCompleted : selectedVisit.status === "cancelled" ? t.historyCancelled : t.visitsConfirmed}</dd>
                                    </div>
                                </dl>
                                <div className="mt-5 rounded-xl bg-secondary p-4">
                                    <p className="text-xs text-tertiary">{t.visitsNotes}</p>
                                    <p className="mt-1 text-sm text-primary">{selectedVisit.notes || t.bookNoNotes}</p>
                                </div>
                                <Button color="secondary" size="lg" className="mt-6" onClick={() => setSelectedVisit(null)}>
                                    {t.visitsClose}
                                </Button>
                            </>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </div>
    );
};

const ReschedulePanel = ({ visit, onAskSave }: { visit: Appointment; onAskSave: (startAt: string) => void }) => {
    const { t } = useI18n();
    const [date, setDate] = useState<DateValue>(() => parseDate(klDay(visit.startAt)));
    const [shift, setShift] = useState<"morning" | "night">(() => klShift(visit.startAt));
    const [slot, setSlot] = useState<string | null>(visit.startAt);
    const [slots, setSlots] = useState<BookingSlots | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        setError(null);
        appointmentApi
            .slots(date.toString(), visit.doctorId)
            .then((next) => active && setSlots(next))
            .catch((cause) => active && setError(cause instanceof Error ? cause.message : t.authFailed))
        return () => {
            active = false;
        };
    }, [date, visit.doctorId, t.authFailed]);
    const open = slots ? (shift === "morning" ? slots.morning : slots.night).map((item) => (item.startAt === visit.startAt ? { ...item, booked: false } : item)) : [];

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
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                <Button color="primary" size="sm" isDisabled={!slot || slot === visit.startAt} onClick={() => slot && onAskSave(slot)}>
                    {t.visitsRescheduleSave}
                </Button>
            </div>
        </div>
    );
};

const VisitPerson = ({ visit, locale: _locale, compact }: { visit: Appointment; locale?: Locale; compact?: boolean }) => {
    const doctor = visit.doctorId === "any" ? null : { id: visit.doctorId, name: visit.doctorName };
    const { t } = useI18n();
    const name = doctor?.name ?? t.bookAnyDoctor;

    return (
        <div className={compact ? "flex items-center gap-3" : "mt-4 flex items-center gap-3"}>
            <Avatar size={compact ? "md" : "lg"} initials={initials(name)} alt="" />
            <div className="min-w-0">
                {doctor ? (
                    <Link to={`/doctors/${doctor.id}`} onClick={(event) => event.stopPropagation()} className="block truncate text-md font-semibold text-primary outline-focus-ring hover:text-brand-secondary focus-visible:outline-2">
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
