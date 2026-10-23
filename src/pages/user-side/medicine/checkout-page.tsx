import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n } from "@/providers/locale-provider";
import { orderApi } from "@/services/orderApi";
import { TOKEN_KEY } from "@/services/api";
import { clearCheckoutDraft, readCheckoutDraft } from "@/utils/checkout-draft";
import { getOrderHistory, nextOrderId, normalizeOrderStatus, orderStatusLabel, rememberPlacedOrder, trackingStepsFor, type MedicineOrder } from "@/utils/order-history";
import { PROFILE_ADDRESS_ID } from "@/utils/delivery-address";
import { formatRm, getClinicPharmacy, medicineName } from "@/utils/prescribed-medicine";

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { removeMany } = useCart();
    const [placing, setPlacing] = useState(false);
    const [placed, setPlaced] = useState(false);
    const [placeError, setPlaceError] = useState<string | null>(null);
    const draft = profile ? readCheckoutDraft() : null;
    const { medicines: catalog } = useMedicineCatalog();

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }
    if (!profile) {
        return <Navigate to="/login" replace />;
    }
    if (placed) {
        return <div className="careplus-landing min-h-dvh" />;
    }
    if (!draft || draft.profileId !== profile.id) {
        return <Navigate to="/cart" replace />;
    }

    const subtotal = draft.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const total = subtotal + draft.deliveryFee;

    const placeOrder = async () => {
        if (placing) return;
        setPlacing(true);
        setPlaceError(null);
        const lines = draft.lines.map((line) => {
            const medicine = catalog.find((item) => item.id === line.medicineId);
            return {
                id: line.medicineId,
                medicineId: line.medicineId,
                name: medicineName(locale, line.medicineId, line.name),
                detail: medicine ? `${medicine.pack} · ${getClinicPharmacy(locale).name}` : line.detail,
                unitPrice: line.unitPrice,
                qty: line.qty,
            };
        });
        const labels = {
            confirmed: t.checkoutStepConfirmed,
            ready: orderStatusLabel(locale, "ready_pickup"),
            pickedUp: orderStatusLabel(locale, "picked_up"),
            delivered: orderStatusLabel(locale, "delivered"),
        };
        const status = normalizeOrderStatus(draft.fulfilment, "processing");
        const local: MedicineOrder = {
            id: nextOrderId(getOrderHistory(locale, profile.id)),
            placedAt: new Date().toISOString(),
            status,
            fulfilment: draft.fulfilment,
            payment: draft.paymentLabel,
            address: draft.address,
            lines,
            total,
            trackingSteps: trackingStepsFor(draft.fulfilment, status, labels),
        };
        let order = local;
        const savedAccount = Boolean(localStorage.getItem(TOKEN_KEY)) && !profile.id.startsWith("fam-");
        if (savedAccount) {
            try {
                const addressId = draft.addressId && draft.addressId !== PROFILE_ADDRESS_ID ? Number(draft.addressId) : null;
                order = await orderApi.place(
                    {
                        fulfilment: draft.fulfilment,
                        paymentMethod: draft.paymentLabel,
                        deliveryAddressId: Number.isFinite(addressId) ? addressId : null,
                        deliveryFee: draft.deliveryFee,
                        lines,
                    },
                    labels,
                );
            } catch (error) {
                const monthLimit = error instanceof Error && error.message.includes("one month");
                setPlaceError(monthLimit ? t.medQtyMax : t.checkoutPlaceFailed);
                setPlacing(false);
                return;
            }
        } else {
            rememberPlacedOrder(profile.id, order);
        }
        setPlaced(true);
        removeMany(draft.lines.map((line) => line.medicineId));
        clearCheckoutDraft();
        navigate("/orders", { replace: true, state: { placedId: order.id } });
    };

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.checkoutTitle}</h1>
                <p className="mt-2 max-w-2xl text-md text-tertiary">{t.checkoutBody}</p>

                <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                        <h2 className="text-lg font-semibold text-primary">{t.ordersItems}</h2>
                        <ul className="mt-4 divide-y divide-secondary border-y border-secondary">
                            {draft.lines.map((line) => {
                                const medicine = catalog.find((item) => item.id === line.medicineId);
                                return (
                                    <li key={line.medicineId} className="flex items-center gap-3 py-3">
                                        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                                            {medicine ? <MedicineShot medicine={medicine} view="box" className="size-14 object-contain p-1" /> : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-primary">{medicineName(locale, line.medicineId, line.name)}</p>
                                            <p className="text-sm text-tertiary">
                                                {medicine ? `${medicine.pack} · ${getClinicPharmacy(locale).name}` : line.detail} · {formatRm(line.unitPrice)} × {line.qty}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatRm(line.unitPrice * line.qty)}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <aside className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary lg:sticky lg:top-28">
                        <h2 className="text-lg font-semibold text-primary">{t.medCartOrderSummary}</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div>
                                <dt className="text-tertiary">{t.medCartFulfilment}</dt>
                                <dd className="mt-1 font-medium text-primary">{draft.fulfilment === "delivery" ? t.medCartDelivery : t.medCartPickup}</dd>
                                {draft.address ? <dd className="mt-1 text-tertiary">{draft.address}</dd> : null}
                            </div>
                            <div>
                                <dt className="text-tertiary">{t.medCartPayment}</dt>
                                <dd className="mt-1 font-medium text-primary">{draft.paymentLabel}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-tertiary">{t.medCartSubtotal}</dt>
                                <dd className="font-semibold text-primary">{formatRm(subtotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-tertiary">{t.medCartDeliveryFee}</dt>
                                <dd className="font-semibold text-primary">{formatRm(draft.deliveryFee)}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-secondary pt-3">
                                <dt className="text-md font-semibold text-primary">{t.medCartTotal}</dt>
                                <dd className="text-lg font-semibold text-primary">{formatRm(total)}</dd>
                            </div>
                        </dl>
                        {placeError ? <p className="mt-4 text-sm font-medium text-fg-error-primary">{placeError}</p> : null}
                        <Button color="primary" size="lg" className="careplus-ink mt-6 w-full" isDisabled={placing} isLoading={placing} onClick={() => void placeOrder()}>
                            {t.checkoutPlace}
                        </Button>
                        <Button color="secondary" size="md" className="mt-3 w-full" href="/cart">
                            {t.checkoutBack}
                        </Button>
                    </aside>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
