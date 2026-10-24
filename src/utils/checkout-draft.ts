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
        return draft;
    } catch {
        return null;
    }
};

export const clearCheckoutDraft = () => {
    sessionStorage.removeItem(KEY);
};
