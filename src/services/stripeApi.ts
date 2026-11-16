import { getAuthToken, request, type ApiResponse } from "./api";

export type StripeCheckoutSession = {
    sessionId: string;
    url: string;
    publishableKey: string;
};

export type StripeCardSetup = {
    setupIntentId: string;
    clientSecret: string;
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

    async createCardSetup(): Promise<StripeCardSetup> {
        const result = await request<ApiResponse<StripeCardSetup>>(
            "/api/Stripe/Setup/Card",
            {
                method: "POST",
                body: JSON.stringify({ returnOrigin: window.location.origin }),
            },
            true,
        );
        const setup = result.data;
        if (!result.isSuccess || !setup?.clientSecret || !setup.publishableKey) {
            const stale = setup && "url" in setup;
            throw new Error(
                stale
                    ? "The card form is not loaded yet. Restart the API, then add the card again."
                    : result.respMessage && result.respMessage !== "Success"
                      ? result.respMessage
                      : "Stripe could not open the card form.",
            );
        }
        return setup;
    },

    async completeCardSetup(sessionId: string): Promise<void> {
        const result = await request<ApiResponse<StripeCompletedCheckout>>(
            "/api/Stripe/Setup/Card/Complete",
            { method: "POST", body: JSON.stringify({ sessionId }) },
            true,
        );
        if (!result.isSuccess) {
            throw new Error(result.respMessage || "Stripe could not save this card.");
        }
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
