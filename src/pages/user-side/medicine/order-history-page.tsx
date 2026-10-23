import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy01, Receipt, SearchLg, Truck01 } from "@untitledui/icons";
import { Navigate, useLocation } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { FormStatus } from "@/components/application/form-status";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { useAuth } from "@/providers/auth-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n, type Copy, type Locale } from "@/providers/locale-provider";
import { copyText } from "@/utils/document-download";
import { orderApi } from "@/services/orderApi";
import { orderStatusColor, orderStatusLabel, showsPaymentHistory, type MedicineOrder } from "@/utils/order-history";
import { CLINIC_POINT, locateAddress, mapEmbedSrc, type MapPoint } from "@/utils/order-map";
import { formatRm, isMedicineId, medicineName, type Medicine } from "@/utils/prescribed-medicine";
import { cx } from "@/utils/cx";

type SortKey = "newest" | "oldest" | "total_high" | "total_low";

export const OrderHistoryPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const placedId = (useLocation().state as { placedId?: string } | null)?.placedId ?? null;
    const [orders, setOrders] = useState<MedicineOrder[]>([]);
    const { medicines: catalog } = useMedicineCatalog();
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("newest");
    const [expanded, setExpanded] = useState<string | null>(placedId);
    const [tracking, setTracking] = useState<MedicineOrder | null>(null);
    const [shot, setShot] = useState<Medicine | null>(null);
    const [notice, setNotice] = useState<string | null>(placedId ? t.checkoutPlaced.replace("{id}", placedId) : null);

    useEffect(() => {
        if (!profile?.id || profile.id.startsWith("fam-")) {
            setOrders([]);
            return;
        }
        let cancel = false;
        orderApi
            .list({
                confirmed: t.checkoutStepConfirmed,
                ready: orderStatusLabel(locale, "ready_pickup"),
                pickedUp: orderStatusLabel(locale, "picked_up"),
                delivered: orderStatusLabel(locale, "delivered"),
            })
            .then((remote) => {
                if (!cancel) setOrders(remote);
            })
            .catch(() => {
                if (!cancel) setOrders([]);
            });
        return () => {
            cancel = true;
        };
    }, [locale, profile?.id, t.checkoutStepConfirmed]);

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

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
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

                {filtered.length === 0 ? (
                    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl bg-primary px-6 py-10 text-center ring-1 ring-secondary">
                        <FeaturedIcon icon={Truck01} color="gray" theme="light" size="lg" />
                        <h2 className="mt-4 text-lg font-semibold text-primary">{query.trim() ? t.ordersNoMatch : t.ordersEmptyTitle}</h2>
                        <p className="mt-2 text-sm text-tertiary">{query.trim() ? t.historyNoMatchBody : t.ordersEmptyBody}</p>
                    </div>
                ) : null}
                <ul className={filtered.length === 0 ? "hidden" : "mt-8 space-y-4"}>
                    {filtered.map((order) => {
                        const open = expanded === order.id;
                        return (
                            <li key={order.id} className="overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={open}
                                    aria-label={open ? t.ordersCollapse : t.ordersExpand}
                                    className="flex cursor-pointer flex-wrap items-start gap-4 p-4 outline-focus-ring focus-visible:outline-2 md:p-5"
                                    onClick={() => setExpanded(open ? null : order.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            setExpanded(open ? null : order.id);
                                        }
                                    }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-left text-md font-semibold text-primary">
                                                {t.ordersOrderNumber}: {order.id}
                                            </p>
                                            <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                                                <Button
                                                    color="link-gray"
                                                    size="sm"
                                                    iconLeading={Copy01}
                                                    aria-label={t.ordersCopyId}
                                                    onClick={() => void copyOrderId(order.id)}
                                                />
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-tertiary">{formatDate(order.placedAt)}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <Badge color={orderStatusColor(order.status)} size="md">
                                                {orderStatusLabel(locale, order.status)}
                                            </Badge>
                                            <span className="flex flex-wrap items-center gap-3" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                                                <Button color="link-color" size="sm" iconLeading={Truck01} onClick={() => setTracking(order)}>
                                                    {t.ordersTrack}
                                                </Button>
                                                {showsPaymentHistory(order) ? (
                                                    <Button color="link-color" size="sm" iconLeading={Receipt} href={`/payments?order=${encodeURIComponent(order.id)}`}>
                                                        {t.payments}
                                                    </Button>
                                                ) : null}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-2">
                                            {order.lines.slice(0, 3).map((line) => {
                                                const medicine = catalog.find((item) => line.name.includes(item.name.split(" ")[0]));
                                                return medicine ? (
                                                    <button
                                                        key={line.id}
                                                        type="button"
                                                        aria-label={medicine.name}
                                                        className="size-10 cursor-pointer overflow-hidden rounded-lg bg-secondary ring-2 ring-primary"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setShot(medicine);
                                                        }}
                                                    >
                                                        <MedicineShot medicine={medicine} view="box" className="!size-10 !object-contain p-1" />
                                                    </button>
                                                ) : (
                                                    <div key={line.id} className="size-10 overflow-hidden rounded-lg bg-secondary ring-2 ring-primary" />
                                                );
                                            })}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-tertiary">{t.medCartTotal}</p>
                                            <p className="text-lg font-semibold text-primary">{formatRm(order.total)}</p>
                                        </div>
                                        <ChevronDown aria-hidden="true" className={cx("size-5 text-quaternary transition", open && "rotate-180")} />
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
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            </main>
            <LandingFooter />

            {tracking ? (
                <OrderTrackingDialog
                    order={tracking}
                    locale={locale}
                    catalog={catalog}
                    t={t}
                    formatDate={formatDate}
                    onClose={() => setTracking(null)}
                    onPreview={setShot}
                />
            ) : null}
            {shot ? <MedicinePreview medicine={shot} onClose={() => setShot(null)} /> : null}
        </div>
    );
};

const CLINIC_ADDRESS = "Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur";

const medicineAtClinic = (order: MedicineOrder) => order.fulfilment !== "delivery" || order.status !== "delivered";

const OrderMap = ({ order, title }: { order: MedicineOrder; title: string }) => {
    const atClinic = medicineAtClinic(order);
    const saved = order.latitude != null && order.longitude != null ? { lat: order.latitude, lng: order.longitude } : null;
    const [point, setPoint] = useState<MapPoint | null>(atClinic ? CLINIC_POINT : saved);
    const [looking, setLooking] = useState(!atClinic && saved == null && Boolean(order.address));

    useEffect(() => {
        if (medicineAtClinic(order)) {
            setPoint(CLINIC_POINT);
            setLooking(false);
            return;
        }
        if (order.latitude != null && order.longitude != null) {
            setPoint({ lat: order.latitude, lng: order.longitude });
            setLooking(false);
            return;
        }
        if (!order.address) {
            setPoint(CLINIC_POINT);
            setLooking(false);
            return;
        }
        let cancel = false;
        setPoint(null);
        setLooking(true);
        locateAddress(order.address).then((found) => {
            if (cancel) return;
            setPoint(found ?? CLINIC_POINT);
            setLooking(false);
        });
        return () => {
            cancel = true;
        };
    }, [order]);

    if (!point) {
        return looking ? <div className="h-44 w-full animate-pulse rounded-lg bg-secondary" /> : null;
    }

    return (
        <iframe
            title={title}
            src={mapEmbedSrc(point)}
            className="h-44 w-full rounded-lg border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
        />
    );
};

const OrderTrackingDialog = ({
    order,
    locale,
    catalog,
    t,
    formatDate,
    onClose,
    onPreview,
}: {
    order: MedicineOrder;
    locale: Locale;
    catalog: Medicine[];
    t: Copy;
    formatDate: (iso: string) => string;
    onClose: () => void;
    onPreview: (medicine: Medicine) => void;
}) => {
    const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const deliveryFee = Math.max(0, order.total - subtotal);
    const placed = new Date(order.placedAt).toLocaleString(locale === "zh" ? "zh-MY" : "en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kuala_Lumpur",
    });

    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-5xl">
                <Dialog className="flex max-h-[85dvh] w-full flex-col items-stretch justify-start overflow-y-auto rounded-2xl bg-primary p-5 shadow-xl ring-1 ring-secondary outline-hidden md:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">{t.ordersTrackTitle}</h2>
                            <p className="mt-1 text-sm text-tertiary">{t.ordersTrackBody}</p>
                        </div>
                        <button
                            type="button"
                            aria-label={t.ordersTrackClose}
                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-quaternary hover:bg-secondary"
                            onClick={onClose}
                        >
                            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                                <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
                        <section className="rounded-xl p-4 ring-1 ring-secondary">
                            <p className="text-xs font-medium text-tertiary">{t.ordersOrderNumber}</p>
                            <p className="mt-1 text-lg font-semibold text-primary">{order.id}</p>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium text-tertiary">{t.ordersCreated}</p>
                                    <p className="mt-1 text-sm text-primary">{placed}</p>
                                </div>
                                <Badge color={orderStatusColor(order.status)} size="md">
                                    {orderStatusLabel(locale, order.status)}
                                </Badge>
                            </div>

                            <p className="mt-6 text-sm font-semibold text-primary">{t.ordersItems}</p>
                            <ul className="mt-3 divide-y divide-secondary border-y border-secondary">
                                {order.lines.map((line) => {
                                    const medicine = isMedicineId(line.id)
                                        ? catalog.find((item) => item.id === line.id)
                                        : catalog.find((item) => item.name === line.name);
                                    const name = medicine ? medicineName(locale, medicine.id, line.name) : line.name;
                                    return (
                                        <li key={line.id} className="flex items-center gap-3 py-3">
                                            {medicine ? (
                                                <button
                                                    type="button"
                                                    aria-label={name}
                                                    className="size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-secondary"
                                                    onClick={() => onPreview(medicine)}
                                                >
                                                    <MedicineShot medicine={medicine} view="box" className="size-14 object-contain p-1" />
                                                </button>
                                            ) : (
                                                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-primary">{name}</p>
                                                <p className="text-sm text-tertiary">{line.detail}</p>
                                            </div>
                                            <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatRm(line.unitPrice * line.qty)}</p>
                                        </li>
                                    );
                                })}
                            </ul>

                            <p className="mt-6 text-sm font-semibold text-primary">{t.medCartPayment}</p>
                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-tertiary">{t.medCartSubtotal}</dt>
                                    <dd className="font-medium text-primary">{formatRm(subtotal)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-tertiary">{t.medCartDeliveryFee}</dt>
                                    <dd className="font-medium text-primary">{formatRm(deliveryFee)}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-secondary pt-2">
                                    <dt className="font-semibold text-primary">{t.medCartTotal}</dt>
                                    <dd className="text-md font-semibold text-primary">{formatRm(order.total)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-tertiary">{t.medCartPayment}</dt>
                                    <dd className="text-right text-primary">{order.payment}</dd>
                                </div>
                            </dl>
                            {showsPaymentHistory(order) ? (
                                <Button color="secondary" size="sm" className="mt-4" href={`/payments?order=${encodeURIComponent(order.id)}`}>
                                    {t.payments}
                                </Button>
                            ) : null}
                        </section>

                        <section className="rounded-xl p-4 ring-1 ring-secondary">
                            <OrderMap order={order} title={t.ordersTrackTitle} />
                            <p className="mt-2 text-[11px] text-quaternary">{t.contactMapAttribution}</p>
                            <p className="mt-1 text-xs text-tertiary">{medicineAtClinic(order) ? CLINIC_ADDRESS : order.address || CLINIC_ADDRESS}</p>
                            <h3 className="mt-5 text-sm font-semibold text-primary">{t.ordersTrackTitle}</h3>
                            <ol className="mt-4">
                                {order.trackingSteps.map((step, index) => {
                                    const last = index === order.trackingSteps.length - 1;
                                    return (
                                        <li key={step} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <span className="flex h-5 w-2.5 items-center justify-center">
                                                    <span className={cx("size-2.5 rounded-full", last ? "bg-brand-solid" : "bg-brand-secondary")} />
                                                </span>
                                                {last ? null : <span className="w-px flex-1 bg-secondary" />}
                                            </div>
                                            <div className={cx("flex min-w-0 flex-1 items-center justify-between gap-3", last ? "" : "pb-4")}>
                                                <p className="text-sm leading-5 text-primary">{step}</p>
                                                <p className="shrink-0 text-xs leading-5 text-tertiary">{index === 0 ? formatDate(order.placedAt) : ""}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};

const MedicinePreview = ({ medicine, onClose }: { medicine: Medicine; onClose: () => void }) => {
    const { t } = useI18n();
    return (
        <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && onClose()}>
            <Modal className="w-full max-w-lg">
                <Dialog className="flex w-full flex-col items-stretch rounded-2xl bg-primary p-4 shadow-xl ring-1 ring-secondary outline-hidden">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-md font-semibold text-primary">{medicine.name}</p>
                        <button
                            type="button"
                            aria-label={t.ordersTrackClose}
                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-quaternary hover:bg-secondary"
                            onClick={onClose}
                        >
                            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
                                <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-3 aspect-square overflow-hidden rounded-xl bg-secondary">
                        <MedicineShot medicine={medicine} view="box" className="size-full object-contain p-8" />
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
