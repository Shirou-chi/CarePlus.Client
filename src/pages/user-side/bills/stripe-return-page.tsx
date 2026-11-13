import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { FormStatus } from "@/components/application/form-status";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useI18n } from "@/providers/locale-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { orderApi } from "@/services/orderApi";
import { stripeApi } from "@/services/stripeApi";
import { clearCheckoutDraft, readCheckoutDraft } from "@/utils/checkout-draft";
import { PROFILE_ADDRESS_ID } from "@/utils/delivery-address";
import { orderStatusLabel } from "@/utils/order-history";
import { clearPaymentCheckout, readPaymentCheckout } from "@/utils/payment-checkout";
import { getClinicPharmacy, medicineName } from "@/utils/prescribed-medicine";

export const StripeReturnPage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { reload } = useOutstandingInvoices();
    const { removeMany } = useCart();
    const { medicines: catalog } = useMedicineCatalog();
    const pending = readPaymentCheckout();
    const sessionId = params.get("session_id")?.trim() ?? "";
    const [error, setError] = useState<string | null>(null);
    const ran = useRef(false);

    useEffect(() => {
        if (!isReady || !profile || ran.current) return;
        if (!sessionId) {
            setError(t.stripeReturnMissing);
            return;
        }
        ran.current = true;

        const finish = async () => {
            try {
                const completed = await stripeApi.complete(sessionId);

                if (completed.kind === "invoice") {
                    clearPaymentCheckout();
                    const rows = await reload();
                    navigate(rows.some((item) => item.status === "overdue") ? "/invoices" : pending?.returnTo ?? "/payments", {
                        replace: true,
                    });
                    return;
                }

                const draft = readCheckoutDraft();
                if (!draft || draft.profileId !== profile.id) {
                    clearPaymentCheckout();
                    navigate("/cart", { replace: true });
                    return;
                }

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
                const addressId = draft.addressId && draft.addressId !== PROFILE_ADDRESS_ID ? Number(draft.addressId) : null;
                const order = await orderApi.place(
                    {
                        fulfilment: draft.fulfilment,
                        paymentMethod: completed.methodLabel || draft.paymentLabel,
                        deliveryAddressId: Number.isFinite(addressId) ? addressId : null,
                        deliveryFee: draft.deliveryFee,
                        lines,
                    },
                    labels,
                );
                removeMany(draft.lines.map((line) => line.medicineId));
                clearCheckoutDraft();
                clearPaymentCheckout();
                navigate(pending?.returnTo ?? "/orders", { replace: true, state: { placedId: order.id } });
            } catch (caught) {
                const monthLimit = caught instanceof Error && caught.message.includes("one month");
                setError(
                    monthLimit
                        ? t.medQtyMax
                        : caught instanceof Error
                          ? caught.message
                          : pending?.kind === "invoice"
                            ? t.invoicesPayFailed
                            : t.checkoutPlaceFailed,
                );
            }
        };

        void finish();
    }, [catalog, isReady, locale, navigate, pending?.kind, pending?.returnTo, profile, reload, removeMany, sessionId, t]);

    if (!isReady) return <div className="careplus-landing min-h-dvh" />;
    if (!profile) return <Navigate to="/login" replace />;

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-lg px-4 py-6 md:px-8 md:py-10">
                <div className="rounded-2xl bg-primary p-5 ring-1 ring-secondary sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-display-xs font-semibold text-primary [font-family:var(--font-display)]">{t.stripeReturnTitle}</h1>
                        <Badge color="brand" size="sm">
                            Stripe
                        </Badge>
                    </div>
                    <p className="mt-2 text-sm text-tertiary">{error ? t.stripeReturnFailedBody : t.stripeReturnBody}</p>
                    <FormStatus error={error} className="mt-4" />
                    {error ? (
                        <div className="mt-6 flex flex-col gap-2">
                            <Button
                                color="primary"
                                size="md"
                                onClick={() => navigate(pending?.cancelTo ?? "/invoices", { replace: true })}
                            >
                                {t.stripeReturnBack}
                            </Button>
                        </div>
                    ) : (
                        <p className="mt-4 text-xs text-tertiary">{t.stripeReturnHint}</p>
                    )}
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
