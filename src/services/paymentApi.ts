import { normalizeOrderStatus, type MedicineOrder } from "@/utils/order-history";
import { getAuthToken, request, type ApiResponse } from "./api";

type PaymentRow = {
    id: string;
    placedAt: string;
    status: string;
    fulfilment: "pickup" | "delivery";
    payment: string;
    address?: string | null;
    deliveryFee: number;
    total: number;
    lines: { id: string; name: string; detail: string; unitPrice: number; qty: number }[];
};

const toOrder = (row: PaymentRow): MedicineOrder => {
    const fulfilment = row.fulfilment === "delivery" ? "delivery" : "pickup";
    return {
        id: row.id,
        placedAt: row.placedAt,
        status: normalizeOrderStatus(fulfilment, row.status),
        fulfilment,
        payment: row.payment,
        address: row.address || undefined,
        lines: row.lines.map((line) => ({
            id: line.id,
            name: line.name,
            detail: line.detail,
            unitPrice: line.unitPrice,
            qty: line.qty,
        })),
        total: row.total,
        trackingSteps: [],
    };
};

export const paymentApi = {
    async list(): Promise<MedicineOrder[]> {
        if (!getAuthToken()) return [];
        const result = await request<ApiResponse<PaymentRow[]>>("/api/Payment", { method: "GET" }, true);
        if (!result.isSuccess) {
            throw new Error(result.respMessage || "Medicine payment history could not be loaded.");
        }
        return (result.data ?? []).map(toOrder);
    },
};
