import { useMemo, useState } from "react";
import { Download01, Eye, SearchLg, Star01 } from "@untitledui/icons";
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
import { clinicRecordApi } from "@/services/clinicRecordApi";
import { downloadPdfDocument } from "@/utils/document-download";
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
    const { records, loading, error, updateReview } = useClinicRecords();
    const [query, setQuery] = useState("");
    const [picked, setPicked] = useState<ClinicRecord | null>(null);
    const [reviewRecordId, setReviewRecordId] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const detail = reviewRecordId ? null : records.find((record) => record.id === (picked?.id ?? searchParams.get("record"))) ?? null;
    const reviewTarget = records.find((record) => record.id === reviewRecordId) ?? null;

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

    const downloadRecordPdf = (record: ClinicRecord) => {
        const totals = getClinicRecordTotals(record);
        downloadPdfDocument(`${t.clinicRecordsPdfTitle} · ${record.id}`, `${record.id}-clinic-record.pdf`, [
            { heading: t.clinicRecordsId, lines: [record.id] },
            { heading: t.clinicRecordsPatient, lines: [record.patientName, record.patientMeta] },
            { heading: t.clinicRecordsDoctor, lines: [record.doctorName, record.specialty] },
            { heading: t.clinicRecordsVisit, lines: [record.visitType, `${formatWhen(record.visitedAt)}${record.ward ? ` · ${record.ward}` : ""}`] },
            { heading: t.clinicRecordsDiagnosis, lines: [record.diagnosis] },
            { heading: t.clinicRecordsComment, lines: [record.doctorComment] },
            { heading: t.clinicRecordsMedications, lines: record.medications.length ? record.medications : [t.clinicRecordsNoMeds] },
            {
                heading: t.clinicRecordsChargesTitle,
                table: {
                    head: [t.clinicRecordsChargeCategory, t.clinicRecordsChargeItem, t.clinicRecordsChargeDetails, t.clinicRecordsChargeAmount],
                    body: [
                        ...record.charges.map((line) => [
                            clinicChargeCategoryLabel(locale, line.category),
                            line.item,
                            `${line.detail || "—"} · ${formatRm(line.unitPrice)} × ${line.qty}`,
                            formatRm(line.unitPrice * line.qty),
                        ]),
                        [t.clinicRecordsSubtotal, "", "", formatRm(totals.subtotal)],
                        [t.clinicRecordsSst.replace("{rate}", String(record.sstRate * 100)), "", "", formatRm(totals.sst)],
                        [t.clinicRecordsTotal, "", "", formatRm(totals.total)],
                    ],
                },
            },
        ]);
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
                {reviewSuccess ? <FormStatus success={t.clinicRecordsReviewSuccess} className="mt-8" /> : null}
                {loading ? <p role="status" className="mt-8 rounded-2xl bg-primary px-6 py-8 text-sm text-tertiary ring-1 ring-secondary">{t.clinicRecordsLoading}</p> : null}
                {!loading && !error && records.length === 0 ? (
                    <div className="mt-8 rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <h2 className="text-lg font-semibold text-primary">{t.clinicRecordsEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{t.clinicRecordsEmptyBody}</p>
                    </div>
                ) : null}
                {!loading && !error && records.length > 0 ? (
                    <ul className="mt-6 flex flex-col gap-3 md:hidden">
                        {filtered.map((record) => (
                            <li key={record.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                                <div className="flex items-start gap-3">
                                    <img src={record.doctorPhoto} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-primary">{record.doctorName}</p>
                                        <p className="text-sm text-tertiary">{record.visitType} · {formatWhen(record.visitedAt)}</p>
                                        <p className="mt-1 text-sm text-tertiary">{record.patientName} · <span className="text-brand-secondary">#{record.id}</span></p>
                                    </div>
                                    {record.review ? (
                                        <Badge color="brand" size="sm">{"★".repeat(record.review.rating)}</Badge>
                                    ) : null}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button color="secondary" size="sm" className="flex-1" iconLeading={Eye} onClick={() => setPicked(record)}>
                                        {t.clinicRecordsView}
                                    </Button>
                                    {!record.review ? (
                                        <Button color="secondary" size="sm" className="flex-1" iconLeading={Star01} onClick={() => { setReviewSuccess(false); setReviewRecordId(record.id); }}>
                                            {t.clinicRecordsReview}
                                        </Button>
                                    ) : null}
                                    <Button color="tertiary" size="sm" iconLeading={Download01} aria-label={t.clinicRecordsDownloadPdf} onClick={() => downloadRecordPdf(record)} />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}
                {!loading && !error && records.length > 0 ? <TableCard.Root className="mt-8 hidden overflow-hidden md:block">
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
                                        <div className="flex flex-col items-start gap-2">
                                            <Badge color="success" size="md">{t.clinicRecordsCompleted}</Badge>
                                            {record.review ? (
                                                <Badge color="brand" size="sm">
                                                    {t.clinicRecordsReviewed} · {"★".repeat(record.review.rating)}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex min-w-36 flex-col items-start gap-2">
                                            <Button color="secondary" size="sm" className="w-full justify-start" iconLeading={Eye} onClick={() => setPicked(record)}>
                                                {t.clinicRecordsView}
                                            </Button>
                                            {!record.review ? (
                                                <Button color="secondary" size="sm" className="w-full justify-start" iconLeading={Star01} onClick={() => { setReviewSuccess(false); setReviewRecordId(record.id); }}>
                                                    {t.clinicRecordsReview}
                                                </Button>
                                            ) : null}
                                            <Button color="tertiary" size="sm" className="w-full justify-start" iconLeading={Download01} onClick={() => downloadRecordPdf(record)}>
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
                    onDownload={() => downloadRecordPdf(detail)}
                    onReview={() => { setPicked(null); setReviewSuccess(false); setReviewRecordId(detail.id); }}
                />
            ) : null}
            {reviewTarget && !reviewTarget.review ? (
                <DoctorReviewModal
                    key={reviewTarget.id}
                    record={reviewTarget}
                    t={t}
                    onClose={() => setReviewRecordId(null)}
                    onSubmit={async (rating, description, isAnonymous) => {
                        const review = await clinicRecordApi.review(reviewTarget.id, rating, description, isAnonymous);
                        updateReview(reviewTarget.id, review);
                        setReviewRecordId(null);
                        setReviewSuccess(true);
                    }}
                />
            ) : null}
        </div>
    );
};

const DoctorReviewModal = ({
    record,
    t,
    onClose,
    onSubmit,
}: {
    record: ClinicRecord;
    t: ReturnType<typeof useI18n>["t"];
    onClose: () => void;
    onSubmit: (rating: number, description: string, isAnonymous: boolean) => Promise<void>;
}) => {
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    return (
        <ModalOverlay isDismissable={!submitting} isOpen onOpenChange={(open) => !open && !submitting && onClose()}>
            <Modal className="w-full max-w-md">
                <Dialog className="w-full rounded-2xl bg-primary p-5 ring-1 ring-secondary sm:p-6">
                    <form
                        className="w-full"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            if (rating < 1 || rating > 5) { setError(t.clinicRecordsReviewPickRating); return; }
                            setSubmitting(true);
                            setError(null);
                            try { await onSubmit(rating, description, isAnonymous); }
                            catch (cause) { setError(cause instanceof Error ? cause.message : t.clinicRecordsReviewPickRating); }
                            finally { setSubmitting(false); }
                        }}
                    >
                        <h2 className="text-xl font-semibold text-primary">{t.clinicRecordsReviewTitle}</h2>
                        <p className="mt-1 text-sm text-tertiary">{record.doctorName} · #{record.id}</p>
                        <p className="mt-4 text-sm text-secondary">{t.clinicRecordsReviewHint}</p>
                        <fieldset className="mt-5">
                            <legend className="text-sm font-semibold text-primary">{t.clinicRecordsReviewRating} *</legend>
                            <div className="mt-2 flex gap-1" role="group">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-label={`${value} / 5`}
                                        aria-pressed={rating === value}
                                        onClick={() => { setRating(value); setError(null); }}
                                        className={`rounded-lg px-1 text-3xl transition-colors focus-visible:outline-2 focus-visible:outline-brand ${value <= rating ? "text-warning-primary" : "text-quaternary hover:text-warning-primary"}`}
                                    >★</button>
                                ))}
                            </div>
                        </fieldset>
                        <label htmlFor="doctor-review-description" className="mt-5 block text-sm font-semibold text-primary">{t.clinicRecordsReviewDescription}</label>
                        <textarea
                            id="doctor-review-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={1000}
                            rows={4}
                            className="mt-2 w-full resize-y rounded-lg border border-secondary bg-primary px-3 py-2 text-md text-primary outline-none sm:text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-secondary">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(event) => setIsAnonymous(event.target.checked)}
                                className="mt-0.5 size-4 accent-brand-secondary"
                            />
                            <span>{t.clinicRecordsReviewAnonymous}</span>
                        </label>
                        {error ? <FormStatus error={error} className="mt-4" /> : null}
                        <div className="mt-6 flex justify-end gap-2">
                            <Button type="button" color="tertiary" size="md" isDisabled={submitting} onClick={onClose}>{t.notifCancel}</Button>
                            <Button type="submit" size="md" isDisabled={submitting}>{t.clinicRecordsReviewSubmit}</Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const ClinicRecordDetailModal = ({
    detail,
    locale,
    t,
    formatWhen,
    onClose,
    onDownload,
    onReview,
}: {
    detail: ClinicRecord;
    locale: "en" | "zh";
    t: ReturnType<typeof useI18n>["t"];
    formatWhen: (iso: string) => string;
    onClose: () => void;
    onDownload: () => void;
    onReview: () => void;
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
                        {detail.review ? (
                            <div className="mt-4 rounded-xl bg-secondary p-3 text-sm text-primary">
                                <p className="font-semibold">{t.clinicRecordsReviewed} · {"★".repeat(detail.review.rating)}{"☆".repeat(5 - detail.review.rating)}</p>
                                {detail.review.description ? <p className="mt-1 whitespace-pre-wrap">{detail.review.description}</p> : null}
                            </div>
                        ) : null}
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
                            <div className="sm:col-span-2 rounded-xl bg-secondary p-4 ring-1 ring-secondary">
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
                                        <tr className="bg-secondary">
                                            <td colSpan={3} className="px-3 py-2.5 text-tertiary">
                                                {t.clinicRecordsSubtotal}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-primary tabular-nums whitespace-nowrap">
                                                {formatRm(totals.subtotal)}
                                            </td>
                                        </tr>
                                        <tr className="bg-secondary">
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
                            {!detail.review ? <Button size="md" className="w-full sm:w-auto" onClick={onReview}>{t.clinicRecordsReview}</Button> : null}
                        </div>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
