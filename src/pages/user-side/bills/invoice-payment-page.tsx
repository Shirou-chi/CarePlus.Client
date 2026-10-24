import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { FormStatus } from "@/components/application/form-status";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { profileApi } from "@/services/profileApi";
import { useI18n } from "@/providers/locale-provider";
import { clinicChargeCategoryLabel, getClinicRecordById, getClinicRecordTotals, getClinicRecords } from "@/utils/clinic-records";
import { hasOverdueInvoice, listOutstandingInvoices, listPaymentHistory, payInvoice } from "@/utils/invoices";
import { formatRm } from "@/utils/prescribed-medicine";
import { applyPaymentCards, readProfileSettings, writeProfileSettings } from "@/utils/profile-settings";

type PaymentMethod = "card" | "fpx";

export const InvoicePaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const [method, setMethod] = useState<PaymentMethod>("fpx");
    const [cardId, setCardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cardTick, setCardTick] = useState(0);

    useEffect(() => {
        if (!profile || profile.id.startsWith("fam-")) {
            return;
        }
        let cancelled = false;
        profileApi
            .listPaymentCards()
            .then((rows) => {
                if (cancelled) {
                    return;
                }
                writeProfileSettings(profile.id, applyPaymentCards(readProfileSettings(profile.id), rows));
                setCardTick((tick) => tick + 1);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [profile]);

    const invoice = useMemo(() => (profile ? listOutstandingInvoices(getClinicRecords(locale)).find((item) => item.id === id) : undefined), [profile, locale, id]);
    const settings = useMemo(() => (profile ? readProfileSettings(profile.id) : null), [profile, cardTick]);
    const cards = settings?.paymentCards ?? [];
    const selectedCard = cards.find((card) => card.id === (cardId ?? settings?.defaultCardId)) ?? cards[0];

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kuala_Lumpur",
        });

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;
    if (!invoice) {
        const records = getClinicRecords(locale);
        const settled = listPaymentHistory(records).some((item) => item.id === id);
        return <Navigate to={settled && !hasOverdueInvoice(records) ? "/payments" : "/invoices"} replace />;
    }

    const record = getClinicRecordById(locale, invoice.recordId);
    if (!record) return <Navigate to="/invoices" replace />;
    const totals = getClinicRecordTotals(record);
    const sstLabel = t.clinicRecordsSst.replace("{rate}", String(record.sstRate * 100));

    const confirm = () => {
        if (method === "card" && !selectedCard) {
            setError(t.invoicesNoCard);
            return;
        }
        const paidWith = method === "card" && selectedCard ? `${selectedCard.brand} ···· ${selectedCard.last4}` : t.medCartPayFpx;
        payInvoice(invoice.id, paidWith, new Date().toISOString(), invoice.lateFee, invoice.daysOverdue);
        const records = getClinicRecords(locale);
        navigate(hasOverdueInvoice(records) ? "/invoices" : "/payments");
    };

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8 md:py-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.invoicesPayTitle}</h1>
                <p className="mt-2 max-w-2xl text-sm text-tertiary md:text-md">{t.invoicesPayBody}</p>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-lg font-semibold text-primary">{invoice.id}</h2>
                            <Badge color={invoice.status === "overdue" ? "error" : "warning"} size="sm">
                                {invoice.status === "overdue" ? t.invoicesOverdue : t.invoicesDue}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            {invoice.doctorName} · {invoice.visitType}
                        </p>
                        <p className="mt-1 text-sm text-tertiary">{t.invoicesDueOn.replace("{date}", formatDate(invoice.dueAt))}</p>

                        <ul className="mt-4 divide-y divide-secondary border-y border-secondary">
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
                        <dl className="mt-3 space-y-1 text-sm">
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
                            <div className="flex justify-between gap-3 pt-2 text-md font-semibold text-primary">
                                <dt>{t.invoicesAmountDue}</dt>
                                <dd className="tabular-nums">{formatRm(invoice.amountDue)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-6">
                        <h2 className="text-md font-semibold text-primary">{t.medCartPayment}</h2>
                        <RadioGroup value={method} onChange={(value) => setMethod(value as PaymentMethod)} className="mt-4">
                            <RadioButton value="card" label={t.medCartPayCard} hint={t.medCartPayCardHint} />
                            <RadioButton value="fpx" label={t.medCartPayFpx} hint={t.medCartPayFpxHint} />
                        </RadioGroup>

                        {method === "card" ? (
                            <div className="mt-5">
                                <p className="text-sm font-semibold text-primary">{t.medCartPaymentCard}</p>
                                {cards.length === 0 ? (
                                    <div className="mt-3 rounded-xl bg-secondary p-3">
                                        <p className="text-sm text-tertiary">{t.invoicesNoCard}</p>
                                        <Button color="link-color" size="sm" href="/account" className="mt-2">
                                            {t.medCartAddPaymentCard}
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        className="mt-3"
                                        label={t.medCartPaymentCard}
                                        size="sm"
                                        selectedKey={selectedCard?.id}
                                        onSelectionChange={(key) => key && setCardId(String(key))}
                                        items={cards.map((card) => ({
                                            id: card.id,
                                            label: `${card.brand} ···· ${card.last4}`,
                                        }))}
                                    >
                                        {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                                    </Select>
                                )}
                            </div>
                        ) : null}

                        <FormStatus error={error} className="mt-4" />
                        <div className="mt-6 flex flex-col gap-2">
                            <Button color="primary" size="md" onClick={confirm} isDisabled={method === "card" && cards.length === 0}>
                                {t.invoicesPayConfirm}
                            </Button>
                            <Button color="secondary" size="md" href="/invoices">
                                {t.notifCancel}
                            </Button>
                        </div>
                    </section>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
