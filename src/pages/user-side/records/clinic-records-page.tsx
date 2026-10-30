import { useMemo, useState } from "react";
import { Download01, Eye, SearchLg } from "@untitledui/icons";
import { Navigate, useSearchParams } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FormStatus } from "@/components/application/form-status";
import { Table, TableCard } from "@/components/application/table/table";
import { Input } from "@/components/base/input/input";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { SectionDivider } from "@/components/section-divider";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { useClinicRecords } from "@/hooks/use-clinic-records";
import { printHtmlDocument } from "@/utils/document-download";
import {
    clinicChargeCategoryLabel,
    getClinicRecordTotals,
    type ClinicRecord,
} from "@/utils/clinic-records";
import { formatRm } from "@/utils/prescribed-medicine";

export const ClinicRecordsPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [searchParams, setSearchParams] = useSearchParams();
    const { records, loading, error } = useClinicRecords();
    const [query, setQuery] = useState("");
    const [picked, setPicked] = useState<ClinicRecord | null>(null);
    const detail = picked ?? records.find((record) => record.id === searchParams.get("record")) ?? null;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return records;
        return records.filter(
            (record) =>
                record.id.toLowerCase().includes(q) ||
                record.patientName.toLowerCase().includes(q) ||
                record.doctorName.toLowerCase().includes(q) ||
                record.visitType.toLowerCase().includes(q),
        );
    }, [query, records]);

    const formatWhen = (iso: string) =>
        new Date(iso).toLocaleString(locale === "zh" ? "zh-MY" : "en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const recordPdfHtml = (record: ClinicRecord) => {
        const totals = getClinicRecordTotals(record);
        const chargeRows = record.charges
            .map(
                (line) =>
                    `<tr><td>${clinicChargeCategoryLabel(locale, line.category)}</td><td>${line.item}<br/><span class="muted">${line.detail}</span></td><td>${formatRm(line.unitPrice)} × ${line.qty}</td><td>${formatRm(line.unitPrice * line.qty)}</td></tr>`,
            )
            .join("");
        return `
      <h1>${t.clinicRecordsPdfTitle}</h1>
      <p class="muted">${t.clinicRecordsId}: ${record.id}</p>
      <h2>${t.clinicRecordsPatient}</h2>
      <p>${record.patientName}<br/><span class="muted">${record.patientMeta}</span></p>
      <h2>${t.clinicRecordsDoctor}</h2>
      <p>${record.doctorName}<br/><span class="muted">${record.specialty}</span></p>
      <h2>${t.clinicRecordsVisit}</h2>
      <p>${record.visitType}<br/><span class="muted">${formatWhen(record.visitedAt)} · ${record.ward}</span></p>
      <h2>${t.clinicRecordsDiagnosis}</h2>
      <p>${record.diagnosis}</p>
      <h2>${t.clinicRecordsComment}</h2>
      <p>${record.doctorComment}</p>
      <h2>${t.clinicRecordsMedications}</h2>
      <p>${record.medications.length ? record.medications.join("<br/>") : t.clinicRecordsNoMeds}</p>
      <h2>${t.clinicRecordsChargesTitle}</h2>
      <table><thead><tr><th>${t.clinicRecordsChargeCategory}</th><th>${t.clinicRecordsChargeItem}</th><th>${t.clinicRecordsChargeDetails}</th><th>${t.clinicRecordsChargeAmount}</th></tr></thead><tbody>${chargeRows}<tr><td colspan="3">${t.clinicRecordsSubtotal}</td><td>${formatRm(totals.subtotal)}</td></tr><tr><td colspan="3">${t.clinicRecordsSst.replace("{rate}", String(record.sstRate * 100))}</td><td>${formatRm(totals.sst)}</td></tr><tr><td colspan="3"><strong>${t.clinicRecordsTotal}</strong></td><td><strong>${formatRm(totals.total)}</strong></td></tr></tbody></table>
    `;
    };

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.clinicRecordsTitle}</h1>
                        <p className="mt-2 max-w-2xl text-md text-tertiary">{t.clinicRecordsBody}</p>
                    </div>
                    <Input placeholder={t.search} icon={SearchLg} value={query} onChange={setQuery} className="w-full sm:w-72" />
                </div>

                {error ? <FormStatus error={error} className="mt-8" /> : null}
                {loading ? <p role="status" className="mt-8 rounded-2xl bg-primary px-6 py-8 text-sm text-tertiary ring-1 ring-secondary">{t.clinicRecordsLoading}</p> : null}
                {!loading && !error && records.length === 0 ? (
                    <div className="mt-8 rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <h2 className="text-lg font-semibold text-primary">{t.clinicRecordsEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{t.clinicRecordsEmptyBody}</p>
                    </div>
                ) : null}
                {!loading && !error && records.length > 0 ? <TableCard.Root className="mt-8 overflow-hidden">
                    <Table aria-label={t.clinicRecordsTitle}>
                        <Table.Header>
                            <Table.Head id="id" label={t.clinicRecordsId} isRowHeader />
                            <Table.Head id="patient" label={t.clinicRecordsPatient} />
                            <Table.Head id="doctor" label={t.clinicRecordsDoctor} />
                            <Table.Head id="visit" label={t.clinicRecordsVisitType} />
                            <Table.Head id="date" label={t.clinicRecordsDate} />
                            <Table.Head id="status" label={t.clinicRecordsStatus} />
                            <Table.Head id="actions" label={t.clinicRecordsActions} />
                        </Table.Header>
                        <Table.Body items={filtered}>
                            {(record) => (
                                <Table.Row id={record.id}>
                                    <Table.Cell>
                                        <span className="font-medium text-brand-secondary">#{record.id}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div>
                                            <p className="font-medium text-primary">{record.patientName}</p>
                                            <p className="text-sm text-tertiary">{record.patientMeta}</p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <img src={record.doctorPhoto} alt="" className="size-10 rounded-full object-cover" />
                                            <div>
                                                <p className="font-medium text-primary">{record.doctorName}</p>
                                                <p className="text-sm text-tertiary">{record.specialty}</p>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{record.visitType}</Table.Cell>
                                    <Table.Cell>{formatWhen(record.visitedAt)}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color="success" size="md">{t.clinicRecordsCompleted}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex flex-wrap gap-2">
                                            <Button color="secondary" size="sm" iconLeading={Eye} onClick={() => setPicked(record)}>
                                                {t.clinicRecordsView}
                                            </Button>
                                            <Button color="tertiary" size="sm" iconLeading={Download01} onClick={() => printHtmlDocument(record.id, recordPdfHtml(record))}>
                                                {t.clinicRecordsDownloadPdf}
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </TableCard.Root> : null}
            </main>
            <LandingFooter />

            {detail ? (
                <ClinicRecordDetailModal
                    detail={detail}
                    locale={locale}
                    t={t}
                    formatWhen={formatWhen}
                    onClose={() => {
                        setPicked(null);
                        if (!searchParams.get("record")) return;
                        const next = new URLSearchParams(searchParams);
                        next.delete("record");
                        setSearchParams(next, { replace: true });
                    }}
                    onDownload={() => printHtmlDocument(detail.id, recordPdfHtml(detail))}
                />
            ) : null}
        </div>
    );
};

const ClinicRecordDetailModal = ({
    detail,
    locale,
    t,
    formatWhen,
    onClose,
    onDownload,
}: {
    detail: ClinicRecord;
    locale: "en" | "zh";
    t: ReturnType<typeof useI18n>["t"];
    formatWhen: (iso: string) => string;
    onClose: () => void;
    onDownload: () => void;
}) => {
    const totals = getClinicRecordTotals(detail);
    const sstLabel = t.clinicRecordsSst.replace("{rate}", String(detail.sstRate * 100));

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-brand-secondary">#{detail.id}</p>
                            <Badge color="success" size="sm">
                                {t.clinicRecordsCompleted}
                            </Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <img src={detail.doctorPhoto} alt="" className="size-12 shrink-0 rounded-full object-cover ring-2 ring-secondary" />
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold text-primary">{detail.doctorName}</h2>
                                <p className="text-sm text-tertiary">{detail.specialty}</p>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 max-h-[min(52dvh,420px)] flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsPatient}</dt>
                                <dd className="mt-1 text-sm text-primary">
                                    {detail.patientName}
                                    <span className="text-tertiary"> · {detail.patientMeta}</span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsVisitType}</dt>
                                <dd className="mt-1 text-sm text-primary">{detail.visitType}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsDate}</dt>
                                <dd className="mt-1 text-sm text-primary">{formatWhen(detail.visitedAt)}</dd>
                                <dd className="mt-0.5 text-sm text-tertiary">{detail.ward}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsDiagnosis}</dt>
                                <dd className="mt-1 text-sm font-medium text-primary">{detail.diagnosis}</dd>
                            </div>
                            <div className="sm:col-span-2 rounded-xl bg-secondary_subtle p-4 ring-1 ring-secondary">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsComment}</dt>
                                <dd className="mt-2 text-sm leading-relaxed text-secondary">{detail.doctorComment}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-quaternary">{t.clinicRecordsMedications}</dt>
                                <dd className="mt-2 text-sm text-primary">
                                    {detail.medications.length ? (
                                        <ul className="space-y-1.5">
                                            {detail.medications.map((med) => (
                                                <li key={med} className="flex gap-2">
                                                    <span aria-hidden className="text-brand-secondary">•</span>
                                                    <span>{med}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-tertiary">{t.clinicRecordsNoMeds}</span>
                                    )}
                                </dd>
                            </div>
                        </dl>

                        <SectionDivider className="mx-0 mt-6 max-w-none px-0" />

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-primary">{t.clinicRecordsChargesTitle}</h3>
                            <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-secondary">
                                <table className="w-full min-w-full table-fixed text-left text-sm">
                                    <colgroup>
                                        <col />
                                        <col />
                                        <col />
                                        <col className="w-[6.75rem]" />
                                    </colgroup>
                                    <thead className="bg-secondary">
                                        <tr>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-quaternary">
                                                {t.clinicRecordsChargeCategory}
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-quaternary">
                                                {t.clinicRecordsChargeItem}
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-quaternary">
                                                {t.clinicRecordsChargeDetails}
                                            </th>
                                            <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-quaternary whitespace-nowrap">
                                                {t.clinicRecordsChargeAmount}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary bg-primary">
                                        {detail.charges.map((line) => (
                                            <tr key={line.id}>
                                                <td className="px-3 py-3 align-top text-tertiary">{clinicChargeCategoryLabel(locale, line.category)}</td>
                                                <td className="px-3 py-3 align-top font-medium text-primary">{line.item}</td>
                                                <td className="px-3 py-3 align-top text-tertiary">
                                                    {line.detail}
                                                    <span className="mt-0.5 block text-xs text-quaternary">
                                                        {formatRm(line.unitPrice)}
                                                        {line.qty > 1 ? ` × ${line.qty}` : ""}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 align-top text-right font-medium text-primary tabular-nums whitespace-nowrap">
                                                    {formatRm(line.unitPrice * line.qty)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-secondary_subtle">
                                            <td colSpan={3} className="px-3 py-2.5 text-tertiary">
                                                {t.clinicRecordsSubtotal}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-primary tabular-nums whitespace-nowrap">
                                                {formatRm(totals.subtotal)}
                                            </td>
                                        </tr>
                                        <tr className="bg-secondary_subtle">
                                            <td colSpan={3} className="px-3 py-2.5 text-tertiary">
                                                {sstLabel}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-primary tabular-nums whitespace-nowrap">
                                                {formatRm(totals.sst)}
                                            </td>
                                        </tr>
                                        <tr className="bg-brand-secondary/30">
                                            <td colSpan={3} className="px-3 py-3 text-sm font-semibold text-primary">
                                                {t.clinicRecordsTotal}
                                            </td>
                                            <td className="px-3 py-3 text-right text-md font-semibold text-primary tabular-nums whitespace-nowrap">
                                                {formatRm(totals.total)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <footer className="shrink-0 border-t border-secondary px-5 py-4 sm:px-6">
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                                {t.notifCancel}
                            </Button>
                            <Button color="secondary" size="md" className="w-full sm:w-auto" iconLeading={Download01} onClick={onDownload}>
                                {t.clinicRecordsDownloadPdf}
                            </Button>
                        </div>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
