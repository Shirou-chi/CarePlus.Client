import type { OutstandingInvoice, PaidInvoice } from "@/utils/invoices";
import { request, TOKEN_KEY, type ApiResponse } from "./api";

type OutstandingInvoiceRow = OutstandingInvoice;

export const invoiceApi = {
    async listOutstanding(): Promise<OutstandingInvoice[]> {
        if (!localStorage.getItem(TOKEN_KEY)) return [];
        const result = await request<ApiResponse<OutstandingInvoiceRow[]>>(
            "/api/Invoice/Outstanding",
            { method: "GET", cache: "no-store" },
            true,
        );
        if (!result.isSuccess) {
            throw new Error(result.respMessage || "Outstanding invoices could not be loaded.");
        }
        return result.data ?? [];
    },

    async listPaid(): Promise<PaidInvoice[]> {
        if (!localStorage.getItem(TOKEN_KEY)) return [];
        const result = await request<ApiResponse<PaidInvoice[]>>(
            "/api/Invoice/History",
            { method: "GET", cache: "no-store" },
            true,
        );
        if (!result.isSuccess) {
            throw new Error(result.respMessage || "Payment history could not be loaded.");
        }
        return result.data ?? [];
    },

    async pay(id: string, paymentMethod: string): Promise<void> {
        const result = await request<ApiResponse<OutstandingInvoiceRow>>(
            `/api/Invoice/${encodeURIComponent(id)}/Pay`,
            { method: "POST", body: JSON.stringify({ paymentMethod }) },
            true,
        );
        if (!result.isSuccess) {
            throw new Error(result.respMessage || "The invoice was not paid.");
        }
    },
};
