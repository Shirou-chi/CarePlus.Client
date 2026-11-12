import { useEffect, useMemo, useState } from "react";
import { CalendarCheck01 } from "@untitledui/icons";
import { Link, Navigate } from "react-router";
import { FormStatus } from "@/components/application/form-status";
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
import { useI18n } from "@/providers/locale-provider";
import { appointmentApi, type Appointment } from "@/services/appointmentApi";

type StatusFilter = "all" | "completed" | "cancelled";

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
    const [visits, setVisits] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [doctor, setDoctor] = useState("all");

    useEffect(() => {
        if (!profile) return;
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        appointmentApi
            .history()
            .then((rows) => {
                if (!cancelled) setVisits(rows);
            })
            .catch((cause) => {
                if (!cancelled) setLoadError(cause instanceof Error ? cause.message : t.visitHistoryLoadFailed);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [profile, t.visitHistoryLoadFailed]);

    const doctorOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const visit of visits) {
            if (!map.has(visit.doctorId)) map.set(visit.doctorId, visit.doctorName);
        }
        return [...map.entries()].map(([id, name]) => ({ id, name }));
    }, [visits]);

    const filtered = useMemo(
        () =>
            visits.filter((visit) => {
                if (status !== "all" && visit.status !== status) return false;
                if (doctor !== "all" && visit.doctorId !== doctor) return false;
                return true;
            }),
        [visits, status, doctor],
    );

    const filtering = status !== "all" || doctor !== "all";
    const clearFilters = () => {
        setStatus("all");
        setDoctor("all");
    };

    const typeLabel = (id: string) => {
        if (id === "VT01" || id === "general") return t.visitGeneral;
        if (id === "VT03" || id === "mental") return t.visitMental;
        if (id === "VT02" || id === "screening") return t.visitScreening;
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
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.visitHistory}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.visitHistoryHint}</p>
                    </div>
                    <Button color="secondary" size="md" href="/visits">
                        {t.upcomingVisits}
                    </Button>
                </div>

                <div className="mt-6 grid gap-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:grid-cols-2">
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
                        label={t.homeNavDoctors}
                        size="sm"
                        selectedKey={doctor}
                        onSelectionChange={(key) => key && setDoctor(String(key))}
                        items={[{ id: "all", label: t.historyAll }, ...doctorOptions.map((item) => ({ id: item.id, label: item.name }))]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                </div>
                {filtering ? (
                    <Button color="tertiary" size="sm" className="mt-3" onClick={clearFilters}>
                        {t.historyClear}
                    </Button>
                ) : null}

                {loadError ? <FormStatus className="mt-6" error={loadError} /> : null}
                {loading ? <p className="mt-8 text-sm text-tertiary">{t.chatLoadingHistory}</p> : null}

                {!loading && !loadError && filtered.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center rounded-2xl bg-primary px-6 py-12 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={CalendarCheck01} color="gray" theme="modern" size="lg" />
                        <p className="mt-4 text-lg font-semibold text-primary">{filtering ? t.historyNoMatchBody : t.visitHistoryEmpty}</p>
                        {filtering ? null : <p className="mt-2 max-w-sm text-sm text-tertiary">{t.visitHistoryEmptyBody}</p>}
                        {!filtering ? (
                            <Button color="primary" size="md" className="mt-6" href="/book">
                                {t.bookVisit}
                            </Button>
                        ) : null}
                    </div>
                ) : null}

                {!loading && filtered.length > 0 ? (
                    <ul className="mt-8 space-y-3">
                        {filtered.map((visit) => {
                            const cancelled = visit.status === "cancelled";
                            return (
                                <li key={visit.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <Avatar size="md" initials={initials(visit.doctorName)} alt="" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-primary">{visit.doctorName}</p>
                                                <p className="mt-0.5 text-sm text-tertiary">
                                                    {typeLabel(visit.type)} · {visit.forName}
                                                </p>
                                                <p className="mt-2 text-sm text-secondary">
                                                    {formatDate(visit.startAt)} · {formatTime(visit.startAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge color={cancelled ? "error" : "success"} size="sm">
                                            {cancelled ? t.historyCancelled : t.historyCompleted}
                                        </Badge>
                                    </div>
                                    {visit.notes ? <p className="mt-3 text-sm text-tertiary">{visit.notes}</p> : null}
                                    <div className="mt-4">
                                        <Link to="/clinic-records" className="text-sm font-semibold text-brand-secondary hover:underline">
                                            {t.clinicRecordsTitle}
                                        </Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </main>
            <LandingFooter />
        </div>
    );
};
