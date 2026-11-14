import { getAuthToken, request, type ApiResponse } from "./api";

export type StripeCheckoutSession = {
    sessionId: string;
    url: string;
    publishableKey: string;
};

export type StripeCompletedCheckout = {
    kind: "invoice" | "medicine" | string;
    method: string;
    methodLabel: string;
    invoiceId?: string | null;
    orderId?: string | null;
    amount: number;
    paid: boolean;
};

type CheckoutBase = {
    method: "card" | "fpx";
    methodLabel: string;
    successPath?: string;
    cancelPath: string;
};

export const stripeApi = {
    async createInvoiceCheckout(input: CheckoutBase & { invoiceId: string }): Promise<StripeCheckoutSession> {
        const result = await request<ApiResponse<StripeCheckoutSession>>(
            "/api/Stripe/Checkout/Invoice",
            {
                method: "POST",
                body: JSON.stringify({
                    invoiceId: input.invoiceId,
                    method: input.method,
                    methodLabel: input.methodLabel,
                    successPath: input.successPath ?? "/pay/stripe/return",
                    cancelPath: input.cancelPath,
                    returnOrigin: window.location.origin,
                }),
            },
            true,
        );
        if (!result.isSuccess || !result.data?.url) {
            throw new Error(result.respMessage || "Stripe checkout could not be started.");
        }
        return result.data;
    },

    async createMedicineCheckout(input: CheckoutBase & { amount: number; orderId?: string }): Promise<StripeCheckoutSession> {
        const result = await request<ApiResponse<StripeCheckoutSession>>(
            "/api/Stripe/Checkout/Medicine",
            {
                method: "POST",
                body: JSON.stringify({
                    amount: input.amount,
                    orderId: input.orderId,
                    method: input.method,
                    methodLabel: input.methodLabel,
                    successPath: input.successPath ?? "/pay/stripe/return",
                    cancelPath: input.cancelPath,
                    returnOrigin: window.location.origin,
                }),
            },
            true,
        );
        if (!result.isSuccess || !result.data?.url) {
            throw new Error(result.respMessage || "Stripe checkout could not be started.");
        }
        return result.data;
    },

    async complete(sessionId: string): Promise<StripeCompletedCheckout> {
        if (!getAuthToken()) {
            throw new Error("Sign in to finish payment.");
        }
        const result = await request<ApiResponse<StripeCompletedCheckout>>(
            "/api/Stripe/Checkout/Complete",
            { method: "POST", body: JSON.stringify({ sessionId }) },
            true,
        );
        if (!result.isSuccess || !result.data?.paid) {
            throw new Error(result.respMessage || "Stripe payment could not be confirmed.");
        }
        return result.data;
    },
};
