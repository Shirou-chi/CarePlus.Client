import type { Locale } from "@/providers/locale-provider";

export type OrderStatus = "processing" | "waiting_delivery" | "ready_pickup" | "picked_up" | "delivered";

export type OrderLine = {
    id: string;
    name: string;
    detail: string;
    unitPrice: number;
    qty: number;
};

export type MedicineOrder = {
    id: string;
    placedAt: string;
    status: OrderStatus;
    fulfilment: "pickup" | "delivery";
    payment: string;
    address?: string;
    lines: OrderLine[];
    total: number;
    trackingSteps: string[];
    latitude?: number | null;
    longitude?: number | null;
};

export const orderStatusLabel = (locale: Locale, status: OrderStatus) => {
    const en: Record<OrderStatus, string> = {
        processing: "Processing",
        waiting_delivery: "Waiting for delivery",
        ready_pickup: "Ready to pickup",
        picked_up: "Picked up",
        delivered: "Delivered",
    };
    const zh: Record<OrderStatus, string> = {
        processing: "处理中",
        waiting_delivery: "等待配送",
        ready_pickup: "待自取",
        picked_up: "已领取",
        delivered: "已送达",
    };
    return locale === "zh" ? zh[status] : en[status];
};

export const isCashOnDelivery = (payment: string) => {
    const value = payment.trim().toLowerCase();
    return value === "cod" || value === "cash on delivery" || value.includes("货到付款");
};

export const showsPaymentHistory = (order: Pick<MedicineOrder, "payment" | "status" | "fulfilment">) => {
    if (!isCashOnDelivery(order.payment)) return true;
    return order.fulfilment === "pickup" ? order.status === "picked_up" : order.status === "delivered";
};

const knownStatuses: OrderStatus[] = ["processing", "waiting_delivery", "ready_pickup", "picked_up", "delivered"];

export const normalizeOrderStatus = (fulfilment: MedicineOrder["fulfilment"], status: string): OrderStatus => {
    const value = status.trim().toLowerCase();
    const known = knownStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : "processing";
    if (fulfilment === "pickup" && known === "processing") return "ready_pickup";
    return known;
};

export const trackingStepsFor = (
    fulfilment: MedicineOrder["fulfilment"],
    status: OrderStatus,
    labels: { confirmed: string; ready: string; pickedUp: string; delivered: string },
) => {
    const steps = [labels.confirmed];
    if (fulfilment === "pickup") steps.push(labels.ready);
    if (status === "picked_up") steps.push(labels.pickedUp);
    if (status === "delivered") steps.push(labels.delivered);
    return steps;
};

export const orderStatusColor = (status: OrderStatus): "warning" | "success" | "brand" | "gray" => {
    if (status === "waiting_delivery") return "warning";
    if (status === "delivered" || status === "picked_up") return "success";
    if (status === "ready_pickup") return "brand";
    return "gray";
};
