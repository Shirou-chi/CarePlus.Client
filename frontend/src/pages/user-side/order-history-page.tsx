import { useMemo, useState } from "react";
import { ChevronDown, Copy01, Download01, SearchLg, Truck01 } from "@untitledui/icons";
import { Link, Navigate } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { FormStatus } from "@/components/application/form-status";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { copyText, printHtmlDocument } from "@/utils/document-download";
import {
    getOrderHistory,
    orderStatusColor,
    orderStatusLabel,
    type MedicineOrder,
} from "@/utils/order-history";
import { formatRm, getMedicineCatalog } from "@/utils/prescribed-medicine";
import { cx } from "@/utils/cx";

type SortKey = "newest" | "oldest" | "total_high" | "total_low";

export const OrderHistoryPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const orders = getOrderHistory(locale);
    const catalog = getMedicineCatalog(locale);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("newest");
    const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null);
    const [tracking, setTracking] = useState<MedicineOrder | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = orders.filter(
            (order) =>
                !q ||
                order.id.toLowerCase().includes(q) ||
                order.lines.some((line) => line.name.toLowerCase().includes(q)),
        );
        list = [...list].sort((a, b) => {
            if (sort === "oldest") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
            if (sort === "total_high") return b.total - a.total;
            if (sort === "total_low") return a.total - b.total;
            return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
        });
        return list;
    }, [orders, query, sort]);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kuala_Lumpur",
        });

    const copyOrderId = async (id: string) => {
        await copyText(id);
        setNotice(t.ordersCopiedId);
    };

    const receiptHtml = (order: MedicineOrder) => {
        const rows = order.lines
            .map(
                (line) =>
                    `<tr><td>${line.name}<br/><span class="muted">${line.detail}</span></td><td>${formatRm(line.unitPrice)} × ${line.qty}</td><td>${formatRm(line.unitPrice * line.qty)}</td></tr>`,
            )
            .join("");
        return `
          <h1>${t.ordersReceiptTitle}</h1>
          <p class="muted">${t.ordersOrderNumber}: ${order.id}<br/>${formatDate(order.placedAt)}</p>
          <h2>${t.ordersItems}</h2>
          <table><thead><tr><th>${t.ordersItem}</th><th>${t.ordersQty}</th><th>${t.ordersLineTotal}</th></tr></thead><tbody>${rows}</tbody></table>
          <p><strong>${t.medCartTotal}: ${formatRm(order.total)}</strong></p>
          <p class="muted">${t.medCartPayment}: ${order.payment}<br/>${t.medCartFulfilment}: ${order.fulfilment === "delivery" ? t.medCartDelivery : t.medCartPickup}</p>
        `;
    };

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <nav aria-label="Breadcrumb" className="text-sm text-tertiary">
                    <ol className="flex flex-wrap items-center gap-2">
                        <li><Link to="/home" className="hover:text-primary">{t.medHome}</Link></li>
                        <li aria-hidden="true">/</li>
                        <li className="font-medium text-primary">{t.ordersTitle}</li>
                    </ol>
                </nav>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.ordersTitle}</h1>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                        <Input placeholder={t.search} icon={SearchLg} value={query} onChange={setQuery} className="w-full sm:w-64" />
                        <Select selectedKey={sort} onSelectionChange={(key) => setSort(String(key) as SortKey)} className="w-full sm:w-44" items={[
                            { id: "newest", label: t.ordersSortNewest },
                            { id: "oldest", label: t.ordersSortOldest },
                            { id: "total_high", label: t.ordersSortTotalHigh },
                            { id: "total_low", label: t.ordersSortTotalLow },
                        ]}>
                            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                        </Select>
                    </div>
                </div>

                <FormStatus success={notice} className="mt-4" />

                <ul className="mt-8 space-y-4">
                    {filtered.map((order) => {
                        const open = expanded === order.id;
                        return (
                            <li key={order.id} className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary">
                                <div className="flex flex-wrap items-start gap-4 p-4 md:p-5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="cursor-pointer text-left text-md font-semibold text-primary outline-focus-ring hover:text-brand-secondary focus-visible:outline-2"
                                                onClick={() => setExpanded(open ? null : order.id)}
                                            >
                                                {t.ordersOrderNumber}: {order.id}
                                            </button>
                                            <Button
                                                color="link-gray"
                                                size="sm"
                                                iconLeading={Copy01}
                                                aria-label={t.ordersCopyId}
                                                onClick={() => void copyOrderId(order.id)}
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-tertiary">{formatDate(order.placedAt)}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <Badge color={orderStatusColor(order.status)} size="md">
                                                {orderStatusLabel(locale, order.status)}
                                            </Badge>
                                            <Button color="link-color" size="sm" iconLeading={Truck01} onClick={() => setTracking(order)}>
                                                {t.ordersTrack}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {order.lines.slice(0, 3).map((line) => {
                                                const medicine = catalog.find((item) => line.name.includes(item.name.split(" ")[0]));
                                                return (
                                                    <div key={line.id} className="size-10 overflow-hidden rounded-lg bg-secondary ring-2 ring-primary">
                                                        {medicine ? <MedicineShot medicine={medicine} view="box" className="!size-10 !object-contain p-1" /> : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-tertiary">{t.medCartTotal}</p>
                                            <p className="text-lg font-semibold text-primary">{formatRm(order.total)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={open ? t.ordersCollapse : t.ordersExpand}
                                            aria-expanded={open}
                                            className="cursor-pointer rounded-lg p-1 text-quaternary hover:bg-secondary_subtle"
                                            onClick={() => setExpanded(open ? null : order.id)}
                                        >
                                            <ChevronDown className={cx("size-5 transition", open && "rotate-180")} />
                                        </button>
                                    </div>
                                </div>

                                {open ? (
                                    <div className="border-t border-secondary bg-secondary_subtle px-4 py-4 md:px-5">
                                        <ul className="space-y-3">
                                            {order.lines.map((line) => (
                                                <li key={line.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary p-3 ring-1 ring-secondary">
                                                    <div>
                                                        <p className="font-semibold text-primary">{line.name}</p>
                                                        <p className="text-sm text-tertiary">{line.detail}</p>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <p className="text-tertiary">{formatRm(line.unitPrice)} × {line.qty}</p>
                                                        <p className="font-semibold text-primary">{formatRm(line.unitPrice * line.qty)}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button color="secondary" size="sm" iconLeading={Download01} onClick={() => printHtmlDocument(`${order.id} receipt`, receiptHtml(order))}>
                                                {t.ordersDownloadReceipt}
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            </main>
            <LandingFooter />

            {tracking ? (
                <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && setTracking(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="rounded-2xl bg-primary p-6 ring-1 ring-secondary outline-hidden">
                            <h2 className="text-lg font-semibold text-primary">{t.ordersTrackTitle}</h2>
                            <p className="mt-1 text-sm text-tertiary">{tracking.id}</p>
                            <ol className="mt-4 space-y-3">
                                {tracking.trackingSteps.map((step, index) => (
                                    <li key={step} className="flex gap-3 text-sm">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-brand-primary">{index + 1}</span>
                                        <span className="text-secondary">{step}</span>
                                    </li>
                                ))}
                            </ol>
                            <Button color="secondary" size="md" className="mt-6 w-full" onClick={() => setTracking(null)}>
                                {t.notifCancel}
                            </Button>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </div>
    );
};
