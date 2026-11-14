import type { MedicineId } from "@/utils/prescribed-medicine";

export type CheckoutDraftLine = {
    medicineId: MedicineId;
    name: string;
    detail: string;
    unitPrice: number;
    qty: number;
};

export type CheckoutDraft = {
    profileId: string;
    fulfilment: "pickup" | "delivery";
    paymentLabel: string;
    /** Both kinds save the order first. Card and FPX then open Stripe for that order. */
    paymentKind: "cod" | "card" | "fpx";
    /** Set after the order row exists, so a retry does not place a second order. */
    orderId?: string;
    addressId?: string;
    address?: string;
    deliveryFee: number;
    lines: CheckoutDraftLine[];
};

const KEY = "careplus-checkout-draft";

export const writeCheckoutDraft = (draft: CheckoutDraft) => {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
};

export const readCheckoutDraft = (): CheckoutDraft | null => {
    try {
        const draft = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as CheckoutDraft | null;
        if (!draft?.profileId || !Array.isArray(draft.lines) || draft.lines.length === 0) {
            return null;
        }
        if (!draft.paymentKind) {
            draft.paymentKind = draft.paymentLabel.toLowerCase().includes("cash") ? "cod" : "fpx";
        }
        return draft;
    } catch {
        return null;
    }
};

export const clearCheckoutDraft = () => {
    sessionStorage.removeItem(KEY);
};
