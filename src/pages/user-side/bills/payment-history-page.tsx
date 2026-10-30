import { useEffect, useMemo, useRef, useState } from "react";
import { Download01, Receipt } from "@untitledui/icons";
import { Navigate, useSearchParams } from "react-router";
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
import { useI18n, type Copy } from "@/providers/locale-provider";
import { useClinicRecords } from "@/hooks/use-clinic-records";
import { clinicChargeCategoryLabel, getClinicRecordTotals, type ClinicRecord } from "@/utils/clinic-records";
import { printHtmlDocument } from "@/utils/document-download";
import { type PaidInvoice } from "@/utils/invoices";
import { paymentApi } from "@/services/paymentApi";
import { type MedicineOrder } from "@/utils/order-history";
import { formatRm } from "@/utils/prescribed-medicine";

type PaidOrder = "oldest" | "latest";

type HistoryEntry =
    | { kind: "clinic"; paidAt: string; invoice: PaidInvoice }
    | { kind: "medicine"; paidAt: string; order: MedicineOrder };

const escapeHtml = (value: string) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);

const downloadReceipt = (payment: PaidInvoice, record: ClinicRecord | null, locale: "en" | "zh", t: Copy, formatDate: (iso: string) => string) => {
    const rows = (record?.charges ?? [])
        .map(
            (line) =>
                `<tr><td>${escapeHtml(line.item)}</td><td>${escapeHtml(clinicChargeCategoryLabel(locale, line.category))}</td><td>${formatRm(line.unitPrice * line.qty)}</td></tr>`,
        )
        .join("");
    const late =
        payment.lateFee > 0
            ? `<tr><td>${escapeHtml(t.invoicesLateFee)}</td><td>${escapeHtml(t.invoicesLateDays.replace("{days}", String(payment.daysOverdue)))}</td><td>${formatRm(payment.lateFee)}</td></tr>`
            : "";
    printHtmlDocument(
        `${payment.id} receipt`,
        `<h1>${escapeHtml(t.paymentsDownloadReceipt)}</h1>
        <p class="muted">${escapeHtml(payment.id)}<br/>${escapeHtml(payment.doctorName)} · ${escapeHtml(payment.visitType)}<br/>${escapeHtml(t.paymentsPaidOn.replace("{date}", formatDate(payment.paidAt)))}<br/>${escapeHtml(t.paymentsMethod)} ${escapeHtml(payment.method)}</p>
        <table><thead><tr><th>${escapeHtml(t.clinicRecordsChargeItem)}</th><th>${escapeHtml(t.clinicRecordsChargeCategory)}</th><th>${escapeHtml(t.clinicRecordsChargeAmount)}</th></tr></thead><tbody>${rows}${late}</tbody></table>
        <p><strong>${escapeHtml(t.clinicRecordsTotal)}: ${formatRm(payment.total)}</strong></p>`,
    );
};

const downloadMedicineReceipt = (order: MedicineOrder, t: Copy, formatDate: (iso: string) => string) => {
    const rows = order.lines
        .map(
            (line) =>
                `<tr><td>${escapeHtml(line.name)}<br/><span class="muted">${escapeHtml(line.detail)}</span></td><td>${formatRm(line.unitPrice)} × ${line.qty}</td><td>${formatRm(line.unitPrice * line.qty)}</td></tr>`,
        )
        .join("");
    const fulfilment = order.fulfilment === "delivery" ? t.medCartDelivery : t.medCartPickup;
    const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const deliveryFee = Number((order.total - subtotal).toFixed(2));
    const feeRow = deliveryFee > 0 ? `<p>${escapeHtml(t.medCartDeliveryFee)}: ${formatRm(deliveryFee)}</p>` : "";
    printHtmlDocument(
        `${order.id} receipt`,
        `<h1>${escapeHtml(t.paymentsDownloadReceipt)}</h1>
        <p class="muted">${escapeHtml(order.id)}<br/>${escapeHtml(t.homeNavMedicine)}<br/>${escapeHtml(t.paymentsPaidOn.replace("{date}", formatDate(order.placedAt)))}<br/>${escapeHtml(t.paymentsMethod)} ${escapeHtml(order.payment)}<br/>${escapeHtml(t.medCartFulfilment)} ${escapeHtml(fulfilment)}</p>
        <table><thead><tr><th>${escapeHtml(t.ordersItem)}</th><th>${escapeHtml(t.ordersQty)}</th><th>${escapeHtml(t.clinicRecordsChargeAmount)}</th></tr></thead><tbody>${rows}</tbody></table>
        <p>${escapeHtml(t.medCartSubtotal)}: ${formatRm(subtotal)}</p>
        ${feeRow}
        <p><strong>${escapeHtml(t.medCartTotal)}: ${formatRm(order.total)}</strong></p>`,
    );
};

export const PaymentHistoryPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { records } = useClinicRecords();
    const [order, setOrder] = useState<PaidOrder>("latest");
    const [openId, setOpenId] = useState<string | null>(null);
    const [medicineOrders, setMedicineOrders] = useState<MedicineOrder[]>([]);
    const [params] = useSearchParams();
    const requestedOrder = params.get("order");
    const openedOrder = useRef(false);
    useEffect(() => {
        if (openedOrder.current || !requestedOrder) return;
        if (!medicineOrders.some((item) => item.id === requestedOrder)) return;
        openedOrder.current = true;
        setOpenId(requestedOrder);
    }, [medicineOrders, requestedOrder]);
    useEffect(() => {
        if (!profile?.id || profile.id.startsWith("fam-")) {
            setMedicineOrders([]);
            return;
        }
        let cancel = false;
        paymentApi
            .list()
            .then((remote) => {
                if (!cancel) setMedicineOrders(remote);
            })
            .catch(() => {
                if (!cancel) setMedicineOrders([]);
            });
        return () => {
            cancel = true;
        };
    }, [profile?.id]);
    const filtered = useMemo(() => {
        const clinic: HistoryEntry[] = [];
        const medicine: HistoryEntry[] = medicineOrders.map((item) => ({ kind: "medicine", paidAt: item.placedAt, order: item }));
        return [...clinic, ...medicine].sort((left, right) => {
            const diff = Date.parse(left.paidAt) - Date.parse(right.paidAt);
            return order === "oldest" ? diff : -diff;
        });
    }, [medicineOrders, order]);
    const totalPaid = filtered.reduce((sum, entry) => sum + (entry.kind === "clinic" ? entry.invoice.total : entry.order.total), 0);
    const openEntry = filtered.find((entry) => (entry.kind === "clinic" ? entry.invoice.id : entry.order.id) === openId) ?? null;

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
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.payments}</h1>
                <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.paymentsBody}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.paymentsPaid}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{filtered.length}</p>
                    </div>
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                        <p className="text-sm text-tertiary">{t.paymentsTotalPaid}</p>
                        <p className="mt-1 text-display-xs font-semibold text-primary tabular-nums">{formatRm(totalPaid)}</p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                    <div className="max-w-xs">
                        <Select
                            label={t.notifSort}
                            size="sm"
                            selectedKey={order}
                            onSelectionChange={(key) => key && setOrder(String(key) as PaidOrder)}
                            items={[
                                { id: "latest", label: t.notifSortLatest },
                                { id: "oldest", label: t.notifSortOldest },
                            ]}
                        >
                            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                        </Select>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={Receipt} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{t.paymentsEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{t.paymentsEmptyBody}</p>
                    </div>
                ) : (
                    <ul className="mt-6 grid gap-3 lg:grid-cols-2">
                        {filtered.map((entry) => {
                            const id = entry.kind === "clinic" ? entry.invoice.id : entry.order.id;
                            const title = entry.kind === "clinic" ? entry.invoice.doctorName : entry.order.lines.map((line) => line.name).join(", ");
                            const subtitle =
                                entry.kind === "clinic"
                                    ? entry.invoice.visitType
                                    : entry.order.fulfilment === "delivery"
                                      ? t.medCartDelivery
                                      : t.medCartPickup;
                            const method = entry.kind === "clinic" ? entry.invoice.method : entry.order.payment;
                            const total = entry.kind === "clinic" ? entry.invoice.total : entry.order.total;
                            return (
                                <li key={id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-brand-secondary">{id}</p>
                                            <p className="mt-1 truncate text-md font-semibold text-primary">{title}</p>
                                            <p className="truncate text-sm text-tertiary">{subtitle}</p>
                                        </div>
                                        <Badge color="success" size="sm">
                                            {t.paymentsPaid}
                                        </Badge>
                                    </div>
                                    <p className="mt-3 text-sm text-tertiary">{t.paymentsPaidOn.replace("{date}", formatDate(entry.paidAt))}</p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        {t.paymentsMethod} {method}
                                    </p>
                                    {entry.kind === "clinic" && entry.invoice.lateFee > 0 ? (
                                        <p className="mt-1 text-sm text-tertiary">
                                            {t.invoicesLateFee} {formatRm(entry.invoice.lateFee)}
                                        </p>
                                    ) : null}
                                    <p className="mt-1 text-lg font-semibold text-primary tabular-nums">{formatRm(total)}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button color="secondary" size="sm" onClick={() => setOpenId(id)}>
                                            {t.clinicRecordsView}
                                        </Button>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={Download01}
                                            onClick={() =>
                                                entry.kind === "clinic"
                                                    ? downloadReceipt(entry.invoice, records.find((record) => record.id === entry.invoice.recordId) ?? null, locale, t, formatDate)
                                                    : downloadMedicineReceipt(entry.order, t, formatDate)
                                            }
                                        >
                                            {t.paymentsDownloadReceipt}
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
            {openEntry?.kind === "clinic" ? (
                <PaymentDetail payment={openEntry.invoice} record={records.find((record) => record.id === openEntry.invoice.recordId) ?? null} locale={locale} formatDate={formatDate} onClose={() => setOpenId(null)} />
            ) : null}
            {openEntry?.kind === "medicine" ? (
                <MedicinePaymentDetail order={openEntry.order} formatDate={formatDate} onClose={() => setOpenId(null)} />
            ) : null}
            <LandingFooter />
        </div>
    );
};

const PaymentDetail = ({
    payment,
    record,
    locale,
    formatDate,
    onClose,
}: {
    payment: PaidInvoice;
    record: ClinicRecord | null;
    locale: "en" | "zh";
    formatDate: (iso: string) => string;
    onClose: () => void;
}) => {
    const { t } = useI18n();
    if (!record) return null;
    const totals = getClinicRecordTotals(record);
    const sstLabel = t.clinicRecordsSst.replace("{rate}", String(record.sstRate * 100));

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-primary">{payment.id}</h2>
                            <Badge color="success" size="sm">
                                {t.paymentsPaid}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            {payment.doctorName} · {payment.visitType}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">
                            {t.paymentsPaidOn.replace("{date}", formatDate(payment.paidAt))} · {t.paymentsMethod} {payment.method}
                        </p>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                        <ul className="divide-y divide-secondary">
                            {record.charges.map((line) => (
                                <li key={line.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium text-primary">{line.item}</p>
                                        <p className="text-tertiary">{clinicChargeCategoryLabel(locale, line.category)}</p>
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
                            {payment.lateFee > 0 ? (
                                <div className="flex justify-between gap-3 text-tertiary">
                                    <dt>
                                        {t.invoicesLateFee} · {t.invoicesLateDays.replace("{days}", String(payment.daysOverdue))}
                                    </dt>
                                    <dd className="tabular-nums">{formatRm(payment.lateFee)}</dd>
                                </div>
                            ) : null}
                            <div className="flex justify-between gap-3 pt-1 text-md font-semibold text-primary">
                                <dt>{t.clinicRecordsTotal}</dt>
                                <dd className="tabular-nums">{formatRm(payment.total)}</dd>
                            </div>
                        </dl>
                    </div>
                    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button href={`/clinic-records?record=${payment.recordId}&from=payments`} color="secondary" size="md" className="w-full sm:w-auto">
                            {t.invoicesViewVisit}
                        </Button>
                        <Button color="primary" size="md" className="w-full sm:w-auto" iconLeading={Download01} onClick={() => downloadReceipt(payment, record, locale, t, formatDate)}>
                            {t.paymentsDownloadReceipt}
                        </Button>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const MedicinePaymentDetail = ({
    order,
    formatDate,
    onClose,
}: {
    order: MedicineOrder;
    formatDate: (iso: string) => string;
    onClose: () => void;
}) => {
    const { t } = useI18n();
    const fulfilment = order.fulfilment === "delivery" ? t.medCartDelivery : t.medCartPickup;
    const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const deliveryFee = Number((order.total - subtotal).toFixed(2));

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-xl">
                <Dialog className="flex max-h-[min(85dvh,720px)] w-full flex-col items-stretch justify-start overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-hidden">
                    <header className="shrink-0 border-b border-secondary px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-primary">{order.id}</h2>
                            <Badge color="success" size="sm">
                                {t.paymentsPaid}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            {t.homeNavMedicine} · {fulfilment}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">
                            {t.paymentsPaidOn.replace("{date}", formatDate(order.placedAt))} · {t.paymentsMethod} {order.payment}
                        </p>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                        <ul className="divide-y divide-secondary">
                            {order.lines.map((line) => (
                                <li key={line.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium text-primary">{line.name}</p>
                                        <p className="text-tertiary">{line.detail}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-tertiary">
                                            {formatRm(line.unitPrice)} × {line.qty}
                                        </p>
                                        <p className="font-medium text-primary tabular-nums">{formatRm(line.unitPrice * line.qty)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-2 space-y-1 border-t border-secondary pt-3 text-sm">
                            <div className="flex justify-between gap-3 text-tertiary">
                                <dt>{t.medCartSubtotal}</dt>
                                <dd className="tabular-nums">{formatRm(subtotal)}</dd>
                            </div>
                            {deliveryFee > 0 ? (
                                <div className="flex justify-between gap-3 text-tertiary">
                                    <dt>{t.medCartDeliveryFee}</dt>
                                    <dd className="tabular-nums">{formatRm(deliveryFee)}</dd>
                                </div>
                            ) : null}
                            <div className="flex justify-between gap-3 pt-1 text-md font-semibold text-primary">
                                <dt>{t.medCartTotal}</dt>
                                <dd className="tabular-nums">{formatRm(order.total)}</dd>
                            </div>
                        </dl>
                    </div>
                    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Button color="tertiary" size="md" className="w-full sm:w-auto" onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button href="/orders" color="secondary" size="md" className="w-full sm:w-auto">
                            {t.ordersTitle}
                        </Button>
                        <Button color="primary" size="md" className="w-full sm:w-auto" iconLeading={Download01} onClick={() => downloadMedicineReceipt(order, t, formatDate)}>
                            {t.paymentsDownloadReceipt}
                        </Button>
                    </footer>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
