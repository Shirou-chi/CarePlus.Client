import { normalizeOrderStatus, trackingStepsFor, type MedicineOrder } from "@/utils/order-history";
import { request, TOKEN_KEY, type ApiResponse } from "./api";

type MedicineOrderResponse = {
    id: string;
    placedAt: string;
    status: string;
    fulfilment: "pickup" | "delivery";
    payment: string;
    address?: string | null;
    deliveryFee: number;
    total: number;
    latitude?: number | null;
    longitude?: number | null;
    lines: { id: string; name: string; detail: string; unitPrice: number; qty: number }[];
};

export type PlaceMedicineOrderRequest = {
    fulfilment: "pickup" | "delivery";
    paymentMethod: string;
    deliveryAddressId?: number | null;
    deliveryFee: number;
    lines: { medicineId: string; name: string; detail: string; unitPrice: number; qty: number }[];
};

export type TrackingLabels = { confirmed: string; ready: string; pickedUp: string; delivered: string };

const toOrder = (row: MedicineOrderResponse, labels: TrackingLabels): MedicineOrder => {
    const fulfilment = row.fulfilment === "delivery" ? "delivery" : "pickup";
    const status = normalizeOrderStatus(fulfilment, row.status);
    return {
        id: row.id,
        placedAt: row.placedAt,
        status,
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
        trackingSteps: trackingStepsFor(fulfilment, status, labels),
        latitude: row.latitude,
        longitude: row.longitude,
    };
};

export const orderApi = {
    async list(labels: TrackingLabels): Promise<MedicineOrder[]> {
        if (!localStorage.getItem(TOKEN_KEY)) return [];
        const result = await request<ApiResponse<MedicineOrderResponse[]>>("/api/MedicineOrder", { method: "GET" }, true);
        if (!result.isSuccess || !result.data) return [];
        return result.data.map((row) => toOrder(row, labels));
    },

    async place(body: PlaceMedicineOrderRequest, labels: TrackingLabels): Promise<MedicineOrder> {
        const result = await request<ApiResponse<MedicineOrderResponse>>(
            "/api/MedicineOrder",
            { method: "POST", body: JSON.stringify(body) },
            true,
        );
        if (!result.isSuccess || !result.data) {
            throw new Error(result.respMessage || "Unable to place the order.");
        }
        return toOrder(result.data, labels);
    },
};
