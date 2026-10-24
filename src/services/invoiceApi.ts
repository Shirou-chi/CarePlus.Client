import type { OutstandingInvoice } from "@/utils/invoices";
import { request, TOKEN_KEY, type ApiResponse } from "./api";

type OutstandingInvoiceRow = OutstandingInvoice;

export const invoiceApi = {
    async listOutstanding(): Promise<OutstandingInvoice[]> {
        if (!localStorage.getItem(TOKEN_KEY)) return [];
        const result = await request<ApiResponse<OutstandingInvoiceRow[]>>("/api/Invoice/Outstanding", { method: "GET" }, true);
        if (!result.isSuccess || !result.data) return [];
        return result.data;
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
