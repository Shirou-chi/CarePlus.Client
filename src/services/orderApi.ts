import { normalizeOrderStatus, trackingStepsFor, type MedicineOrder, type TrackingLabels } from "@/utils/order-history";
import { getAuthToken, request, type ApiResponse } from "./api";

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
    /** Required for card/FPX; server verifies Stripe paid this session before marking Paid. */
    stripeSessionId?: string | null;
    deliveryAddressId?: number | null;
    deliveryFee: number;
    lines: { medicineId: string; name: string; detail: string; unitPrice: number; qty: number }[];
};

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
        if (!getAuthToken()) return [];
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

    async pay(orderId: string, stripeSessionId: string, labels: TrackingLabels): Promise<MedicineOrder> {
        const result = await request<ApiResponse<MedicineOrderResponse>>(
            `/api/MedicineOrder/${encodeURIComponent(orderId)}/pay`,
            { method: "POST", body: JSON.stringify({ stripeSessionId }) },
            true,
        );
        if (!result.isSuccess || !result.data) {
            throw new Error(result.respMessage || "Unable to mark the order paid.");
        }
        return toOrder(result.data, labels);
    },
};
