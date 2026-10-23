import type { MedicineOrder, OrderStatus } from "@/utils/order-history";
import { request, TOKEN_KEY, type ApiResponse } from "./api";

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

const statuses: OrderStatus[] = ["processing", "waiting_delivery", "ready_pickup", "picked_up", "delivered"];

const toOrder = (row: PaymentRow): MedicineOrder => ({
    id: row.id,
    placedAt: row.placedAt,
    status: statuses.includes(row.status as OrderStatus) ? (row.status as OrderStatus) : "processing",
    fulfilment: row.fulfilment === "delivery" ? "delivery" : "pickup",
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
});

export const paymentApi = {
    async list(): Promise<MedicineOrder[]> {
        if (!localStorage.getItem(TOKEN_KEY)) return [];
        const result = await request<ApiResponse<PaymentRow[]>>("/api/Payment", { method: "GET" }, true);
        if (!result.isSuccess || !result.data) return [];
        return result.data.map(toOrder);
    },
};
