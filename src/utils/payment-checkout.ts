const KEY = "careplus-payment-checkout";

export type PaymentCheckoutPending =
    | {
          kind: "invoice";
          invoiceId: string;
          amount: number;
          methodLabel: string;
          method: "card" | "fpx";
          returnTo: string;
          cancelTo: string;
      }
      | {
          kind: "medicine";
          orderId?: string;
          amount: number;
          methodLabel: string;
          method: "card" | "fpx";
          returnTo: string;
          cancelTo: string;
      };

export const writePaymentCheckout = (pending: PaymentCheckoutPending) => {
    sessionStorage.setItem(KEY, JSON.stringify(pending));
};

export const readPaymentCheckout = (): PaymentCheckoutPending | null => {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return null;
        const pending = JSON.parse(raw) as PaymentCheckoutPending;
        if (!pending?.kind || !pending.methodLabel || !(pending.amount >= 0)) return null;
        if (pending.kind === "invoice" && !pending.invoiceId) return null;
        return pending;
    } catch {
        return null;
    }
};

export const clearPaymentCheckout = () => {
    sessionStorage.removeItem(KEY);
};
