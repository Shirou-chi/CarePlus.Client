import { useMemo, useState } from "react";
import { File06 } from "@untitledui/icons";
import { Navigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FormStatus } from "@/components/application/form-status";
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
import { useClinicRecords } from "@/hooks/use-clinic-records";
import { listLabReports, type LabFlag, type LabMarker } from "@/utils/clinic-records";

export const LabResultsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [doctor, setDoctor] = useState("all");
    const [openId, setOpenId] = useState<string | null>(null);
    const { records, loading, error } = useClinicRecords();

    const reports = useMemo(() => listLabReports(records), [records]);
    const doctorOptions = useMemo(() => {
        const seen = new Map<string, string>();
        reports.forEach((report) => seen.set(report.record.doctorId, report.record.doctorName));
        return [...seen].map(([id, label]) => ({ id, label }));
    }, [reports]);
    const filtered = useMemo(() => reports.filter((report) => doctor === "all" || report.record.doctorId === doctor), [reports, doctor]);
    const openReport = reports.find((report) => report.id === openId) ?? null;
    const withinRange = filtered.filter((report) => report.line.markers?.every((marker) => marker.flag === "normal")).length;
    const flagText = { normal: t.labsFlagNormal, high: t.labsFlagHigh, low: t.labsFlagLow };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
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
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.labs}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.labsBody}</p>
                    </div>
                    <div className="w-full sm:w-72">
                        <Select
                            label={t.clinicRecordsDoctor}
                            size="sm"
                            selectedKey={doctor}
                            onSelectionChange={(key) => key && setDoctor(String(key))}
                            items={[{ id: "all", label: t.historyAll }, ...doctorOptions]}
                        >
                            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                        </Select>
                        {doctor !== "all" ? (
                            <Button color="link-gray" size="sm" className="mt-2" onClick={() => setDoctor("all")}>
                                {t.historyClear}
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.labsCount}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{filtered.length}</p>
                    </div>
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.labsWithinRange}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{withinRange}</p>
                    </div>
                </div>

                {error ? <FormStatus error={error} className="mt-6" /> : null}
                {loading ? <p role="status" className="mt-6 rounded-2xl bg-primary px-6 py-8 text-sm text-tertiary ring-1 ring-secondary">{t.clinicRecordsLoading}</p> : null}
                {!loading && !error && filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={File06} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{reports.length === 0 ? t.labsEmptyTitle : t.labsNoMatch}</h2>
                        <p className="mt-2 text-sm text-tertiary">{reports.length === 0 ? t.labsEmptyBody : t.historyNoMatchBody}</p>
                    </div>
                ) : !loading && !error ? (
                    <ul className="mt-6 grid gap-3 lg:grid-cols-2">
                        {filtered.map((report) => {
                            const markers = report.line.markers ?? [];
                            const flagged = markers.filter((marker) => marker.flag !== "normal");
                            return (
                                <li key={report.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-brand-secondary">{report.record.id}</p>
                                            <p className="mt-1 text-md font-semibold text-primary">{report.line.item}</p>
                                            <p className="mt-1 truncate text-sm text-tertiary">
                                                {report.record.doctorName} · {report.record.visitType}
                                            </p>
                                        </div>
                                        <Badge color={flagged.length === 0 ? "success" : "warning"} size="sm">
                                            {flagged.length === 0 ? t.labsWithinRange : t.labsReview}
                                        </Badge>
                                    </div>
                                    <p className="mt-3 text-sm text-tertiary">{formatDate(report.record.visitedAt)}</p>
                                    {flagged.length > 0 ? (
                                        <ul className="mt-2 space-y-1">
                                            {flagged.map((marker) => (
                                                <li key={marker.name} className="text-sm text-warning-primary">
                                                    {marker.name} {marker.value} {marker.unit} · {flagText[marker.flag]}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-1 text-sm text-secondary">
                                            {markers.length} {t.labsMarkers}
                                        </p>
                                    )}
                                    <Button color="secondary" size="sm" className="mt-4" onClick={() => setOpenId(report.id)}>
                                        {t.labsOpen}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                ) : null}
            </main>
            <LandingFooter />
            {openReport ? (
                <ReportDetail
                    recordId={openReport.record.id}
                    title={openReport.line.item}
                    doctorName={openReport.record.doctorName}
                    visitType={openReport.record.visitType}
                    visitedAt={formatDate(openReport.record.visitedAt)}
                    comment={openReport.record.doctorComment}
                    markers={openReport.line.markers ?? []}
                    onClose={() => setOpenId(null)}
                />
            ) : null}
        </div>
    );
};

const flagLabel = (flag: LabFlag, labels: { normal: string; high: string; low: string }) => labels[flag];

const ReportDetail = ({
    recordId,
    title,
    doctorName,
    visitType,
    visitedAt,
    comment,
    markers,
    onClose,
}: {
    recordId: string;
    title: string;
    doctorName: string;
    visitType: string;
    visitedAt: string;
    comment: string;
    markers: LabMarker[];
    onClose: () => void;
}) => {
    const { t } = useI18n();
    const labels = { normal: t.labsFlagNormal, high: t.labsFlagHigh, low: t.labsFlagLow };

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold text-primary">{title}</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            {doctorName} · {visitType}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">{visitedAt}</p>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                        <ul className="divide-y divide-secondary">
                            {markers.map((marker) => (
                                <li key={marker.name} className="flex items-start justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className={marker.flag === "normal" ? "text-sm font-medium text-primary" : "text-sm font-medium text-warning-primary"}>
                                            {marker.name}
                                        </p>
                                        <p className="text-sm text-tertiary">
                                            {t.labsRange} {marker.range}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className={marker.flag === "normal" ? "text-sm font-semibold text-primary tabular-nums" : "text-sm font-semibold text-warning-primary tabular-nums"}>
                                            {marker.value} {marker.unit}
                                        </p>
                                        <Badge color={marker.flag === "normal" ? "success" : "warning"} size="sm" className="mt-1">
                                            {flagLabel(marker.flag, labels)}
                                        </Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <h3 className="mt-4 text-sm font-semibold text-primary">{t.clinicRecordsComment}</h3>
                        <p className="mt-2 text-sm text-secondary">{comment}</p>
                    </div>
                    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button href={`/clinic-records?record=${recordId}&from=labs`} color="primary" size="md" className="w-full sm:w-auto">
                            {t.invoicesViewVisit}
                        </Button>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
