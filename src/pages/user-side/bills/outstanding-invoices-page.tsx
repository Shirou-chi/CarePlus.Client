import { useMemo, useState } from "react";
import { Receipt } from "@untitledui/icons";
import { Navigate } from "react-router";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
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
import { clinicChargeCategoryLabel, getClinicRecordById, getClinicRecordTotals, getClinicRecords } from "@/utils/clinic-records";
import { listOutstandingInvoices, type InvoiceStatus, type OutstandingInvoice } from "@/utils/invoices";
import { formatRm } from "@/utils/prescribed-medicine";

type StatusFilter = "all" | InvoiceStatus;
type DueOrder = "oldest" | "latest";

export const OutstandingInvoicesPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [status, setStatus] = useState<StatusFilter>("all");
    const [order, setOrder] = useState<DueOrder>("oldest");
    const [openId, setOpenId] = useState<string | null>(null);

    const invoices = useMemo(() => listOutstandingInvoices(getClinicRecords(locale)), [locale]);
    const filtered = useMemo(() => {
        const list = invoices.filter((invoice) => status === "all" || invoice.status === status);
        return [...list].sort((left, right) => {
            const diff = Date.parse(left.dueAt) - Date.parse(right.dueAt);
            return order === "oldest" ? diff : -diff;
        });
    }, [invoices, status, order]);
    const totalDue = filtered.reduce((sum, invoice) => sum + invoice.amountDue, 0);
    const overdue = invoices.some((invoice) => invoice.status === "overdue");
    const filtering = status !== "all";
    const openInvoice = invoices.find((invoice) => invoice.id === openId) ?? null;

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
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.invoices}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.invoicesBody}</p>
                    </div>
                    <Button color="secondary" size="md" href="/payments">
                        {t.payments}
                    </Button>
                </div>
                {overdue ? (
                    <p role="alert" className="mt-4 w-full rounded-xl border border-error bg-primary px-4 py-3 text-sm text-error-primary">
                        {t.invoicesBlocked} {t.invoicesLateNote}
                    </p>
                ) : null}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.invoicesOpen}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{filtered.length}</p>
                    </div>
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.invoicesTotalDue}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{formatRm(totalDue)}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:grid-cols-2 lg:items-end">
                    <Select
                        label={t.historyStatus}
                        size="sm"
                        selectedKey={status}
                        onSelectionChange={(key) => key && setStatus(String(key) as StatusFilter)}
                        items={[
                            { id: "all", label: t.historyAll },
                            { id: "due", label: t.invoicesDue },
                            { id: "overdue", label: t.invoicesOverdue },
                        ]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    <Select
                        label={t.notifSort}
                        size="sm"
                        selectedKey={order}
                        onSelectionChange={(key) => key && setOrder(String(key) as DueOrder)}
                        items={[
                            { id: "oldest", label: t.notifSortOldest },
                            { id: "latest", label: t.notifSortLatest },
                        ]}
                    >
                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                    </Select>
                    {filtering && (
                        <Button color="link-gray" size="sm" className="sm:col-span-2 sm:justify-self-start" onClick={() => setStatus("all")}>
                            {t.historyClear}
                        </Button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={Receipt} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{filtering ? t.invoicesNoMatch : t.invoicesEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{filtering ? t.historyNoMatchBody : t.invoicesEmptyBody}</p>
                    </div>
                ) : (
                    <ul className="mt-6 grid gap-3 lg:grid-cols-2">
                        {filtered.map((invoice) => (
                            <li key={invoice.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-brand-secondary">{invoice.id}</p>
                                        <p className="mt-1 truncate text-md font-semibold text-primary">{invoice.doctorName}</p>
                                        <p className="truncate text-sm text-tertiary">{invoice.visitType}</p>
                                    </div>
                                    <Badge color={invoice.status === "overdue" ? "error" : "warning"} size="sm">
                                        {invoice.status === "overdue" ? t.invoicesOverdue : t.invoicesDue}
                                    </Badge>
                                </div>
                                <p className="mt-3 text-sm text-tertiary">{t.invoicesDueOn.replace("{date}", formatDate(invoice.dueAt))}</p>
                                {invoice.lateFee > 0 ? (
                                    <p className="mt-1 text-sm text-error-primary">
                                        {t.invoicesLateDays.replace("{days}", String(invoice.daysOverdue))} · {t.invoicesLateFee} {formatRm(invoice.lateFee)}
                                    </p>
                                ) : null}
                                <p className="mt-1 text-lg font-semibold text-primary tabular-nums">{formatRm(invoice.amountDue)}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button color="secondary" size="sm" onClick={() => setOpenId(invoice.id)}>
                                        {t.clinicRecordsView}
                                    </Button>
                                    <Button color="primary" size="sm" href={`/invoices/${invoice.id}/pay`}>
                                        {t.invoicesPay}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
            {openInvoice ? (
                <InvoiceDetail
                    invoice={openInvoice}
                    locale={locale}
                    formatDate={formatDate}
                    onClose={() => setOpenId(null)}
                />
            ) : null}
            <LandingFooter />
        </div>
    );
};

const InvoiceDetail = ({
    invoice,
    locale,
    formatDate,
    onClose,
}: {
    invoice: OutstandingInvoice;
    locale: "en" | "zh";
    formatDate: (iso: string) => string;
    onClose: () => void;
}) => {
    const { t } = useI18n();
    const record = getClinicRecordById(locale, invoice.recordId);
    if (!record) return null;
    const totals = getClinicRecordTotals(record);
    const sstLabel = t.clinicRecordsSst.replace("{rate}", String(record.sstRate * 100));

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-primary">{invoice.id}</h2>
                            <Badge color={invoice.status === "overdue" ? "error" : "warning"} size="sm">
                                {invoice.status === "overdue" ? t.invoicesOverdue : t.invoicesDue}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            {invoice.doctorName} · {invoice.visitType}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">
                            {t.invoicesIssued} {formatDate(invoice.issuedAt)} · {t.invoicesDueOn.replace("{date}", formatDate(invoice.dueAt))}
                        </p>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                        <ul className="divide-y divide-secondary">
                            {record.charges.map((line) => (
                                <li key={line.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium text-primary">{line.item}</p>
                                        <p className="text-tertiary">
                                            {clinicChargeCategoryLabel(locale, line.category)}
                                            {line.qty > 1 ? ` · ${formatRm(line.unitPrice)} × ${line.qty}` : ""}
                                        </p>
                                    </div>
                                    <p className="shrink-0 font-medium text-primary tabular-nums">{formatRm(line.unitPrice * line.qty)}</p>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-2 space-y-1 border-t border-secondary pt-3 text-sm">
                            <div className="flex justify-between gap-3 text-tertiary">
                                <dt>{t.clinicRecordsSubtotal}</dt>
                                <dd className="tabular-nums">{formatRm(totals.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-3 text-tertiary">
                                <dt>{sstLabel}</dt>
                                <dd className="tabular-nums">{formatRm(totals.sst)}</dd>
                            </div>
                            {invoice.lateFee > 0 ? (
                                <div className="flex justify-between gap-3 text-error-primary">
                                    <dt>
                                        {t.invoicesLateFee} · {t.invoicesLateDays.replace("{days}", String(invoice.daysOverdue))}
                                    </dt>
                                    <dd className="tabular-nums">{formatRm(invoice.lateFee)}</dd>
                                </div>
                            ) : null}
                            <div className="flex justify-between gap-3 pt-1 text-md font-semibold text-primary">
                                <dt>{t.invoicesAmountDue}</dt>
                                <dd className="tabular-nums">{formatRm(invoice.amountDue)}</dd>
                            </div>
                        </dl>
                    </div>
                    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button href={`/clinic-records?record=${invoice.recordId}&from=invoices`} color="secondary" size="md" className="w-full sm:w-auto">
                            {t.invoicesViewVisit}
                        </Button>
                        <Button color="primary" size="md" className="w-full sm:w-auto" href={`/invoices/${invoice.id}/pay`}>
                            {t.invoicesPay}
                        </Button>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
