import { useEffect, useMemo, useState } from "react";
import type { DateValue } from "@internationalized/date";
import { CalendarCheck01 } from "@untitledui/icons";
import { Link, Navigate } from "react-router";
import { DatePicker } from "@/components/application/date-picker/date-picker";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n, type Locale } from "@/providers/locale-provider";
import { appointmentApi, type Appointment } from "@/services/appointmentApi";

type StatusFilter = "all" | "completed" | "cancelled";
type TypeFilter = "all" | "VT01" | "VT02" | "VT03";

const klDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

const initials = (name: string) =>
    name
        .replace(/^Dr\s+/i, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

export const VisitHistoryPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [from, setFrom] = useState<DateValue | null>(null);
    const [to, setTo] = useState<DateValue | null>(null);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [doctor, setDoctor] = useState("all");
    const [visitType, setVisitType] = useState<TypeFilter>("all");
    const [visits, setVisits] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    useEffect(() => {
        if (!profile) return;
        let active = true;
        setLoading(true);
        setLoadError(null);
        appointmentApi
            .history()
            .then((next) => active && setVisits(next))
            .catch((cause) => active && setLoadError(cause instanceof Error ? cause.message : t.authFailed))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [profile, t.authFailed]);
    const doctorOptions = useMemo(() => {
        const named = new Map(visits.map((visit) => [visit.doctorId, { id: visit.doctorId, name: visit.doctorName }]));
        if (named.has("any")) named.set("any", { id: "any", name: t.bookAnyDoctor });
        return Array.from(named.values());
    }, [visits, t.bookAnyDoctor]);
    const filtered = useMemo(() => {
        const fromDay = from?.toString();
        const toDay = to?.toString();
        return visits.filter((visit) => {
            const cancelled = visit.status === "cancelled";
            if (status === "cancelled" && !cancelled) return false;
            if (status === "completed" && cancelled) return false;
            if (doctor !== "all" && visit.doctorId !== doctor) return false;
            if (visitType !== "all" && visit.type !== visitType) return false;
            const day = klDay(visit.startAt);
            if (fromDay && day < fromDay) return false;
            if (toDay && day > toDay) return false;
            return true;
        });
    }, [visits, from, to, status, doctor, visitType]);
    const filtering = Boolean(from || to || status !== "all" || doctor !== "all" || visitType !== "all");
    const clearFilters = () => {
        setFrom(null);
        setTo(null);
        setStatus("all");
        setDoctor("all");
        setVisitType("all");
    };

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
            year: "numeric",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString(locale === "zh" ? "zh-MY" : "en-MY", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8 md:py-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.visitHistory}</h1>
                <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.historyBody}</p>

                <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-secondary">{t.historyFrom}</span>
                        <DatePicker aria-label={t.historyFrom} placeholder={t.historyAnyDate} value={from} onChange={setFrom} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-secondary">{t.historyTo}</span>
                        <DatePicker aria-label={t.historyTo} placeholder={t.historyAnyDate} value={to} onChange={setTo} />
                    </div>
                    <Select
                        label={t.historyStatus}
                        size="sm"
                        selectedKey={status}
                        onSelectionChange={(key) => key && setStatus(String(key) as StatusFilter)}
                        items={[
                            { id: "all", label: t.historyAll },
                            { id: "completed", label: t.historyCompleted },
                            { id: "cancelled", label: t.historyCancelled },
                        ]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    <Select
                        label={t.clinicRecordsDoctor}
                        size="sm"
                        selectedKey={doctor}
                        onSelectionChange={(key) => key && setDoctor(String(key))}
                        items={[{ id: "all", label: t.historyAll }, ...doctorOptions.map((item) => ({ id: item.id, label: item.name }))]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    <Select
                        label={t.clinicRecordsVisitType}
                        size="sm"
                        selectedKey={visitType}
                        onSelectionChange={(key) => key && setVisitType(String(key) as TypeFilter)}
                        items={[
                            { id: "all", label: t.historyAll },
                            { id: "VT01", label: t.visitGeneral },
                            { id: "VT02", label: t.visitScreening },
                            { id: "VT03", label: t.visitMental },
                        ]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    {filtering && (
                        <Button color="link-gray" size="sm" className="lg:col-span-5 lg:justify-self-start" onClick={clearFilters}>
                            {t.historyClear}
                        </Button>
                    )}
                </div>

                {loadError ? <p role="alert" className="mt-6 rounded-xl bg-error-solid px-4 py-3 text-sm font-semibold text-white">{loadError}</p> : null}
                {loading ? (
                    <p className="mt-10 rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">{t.phrLoading}</p>
                ) : filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={CalendarCheck01} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{filtering ? t.historyNoMatch : t.historyEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{filtering ? t.historyNoMatchBody : t.historyEmptyBody}</p>
                        {!filtering && (
                            <Button href="/book" color="primary" size="md" className="mt-6">
                                {t.bookVisit}
                            </Button>
                        )}
                    </div>
                ) : (
                    <ul className="mt-6 grid gap-3 lg:grid-cols-2">
                        {filtered.map((visit) => {
                            const cancelled = visit.status === "cancelled";
                            return (
                                <li key={visit.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <HistoryPerson visit={visit} locale={locale} />
                                        <Badge color={cancelled ? "error" : "gray"} size="sm">
                                            {cancelled ? t.historyCancelled : t.historyCompleted}
                                        </Badge>
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-primary">
                                        {formatDate(visit.startAt)} · {formatTime(visit.startAt)}
                                    </p>
                                    <p className="mt-1 text-sm text-tertiary">{typeLabel(visit.type)}</p>
                                    {visit.recordId && !cancelled ? (
                                        <Button href={`/clinic-records?record=${visit.recordId}&from=history`} color="secondary" size="sm" className="mt-4">
                                            {t.clinicRecordsView}
                                        </Button>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
            <LandingFooter />
        </div>
    );
};

const HistoryPerson = ({ visit, locale: _locale }: { visit: Appointment; locale: Locale }) => {
    const doctor = visit.doctorId === "any" ? null : { id: visit.doctorId, name: visit.doctorName };
    const { t } = useI18n();
    const name = doctor?.name ?? t.bookAnyDoctor;

    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar size="md" initials={initials(name)} alt="" />
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
