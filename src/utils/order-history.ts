import type { Locale } from "@/providers/locale-provider";

export type OrderStatus =
    | "awaiting_payment"
    | "paid"
    | "preparing"
    | "shipped"
    | "processing"
    | "waiting_delivery"
    | "ready_pickup"
    | "picked_up"
    | "delivered";

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
        awaiting_payment: "Awaiting payment",
        paid: "Paid",
        preparing: "Preparing",
        shipped: "Sent out",
        processing: "Processing",
        waiting_delivery: "Waiting for delivery",
        ready_pickup: "Ready to pickup",
        picked_up: "Picked up",
        delivered: "Delivered",
    };
    const zh: Record<OrderStatus, string> = {
        awaiting_payment: "待付款",
        paid: "已付款",
        preparing: "准备中",
        shipped: "已寄出",
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

const knownStatuses: OrderStatus[] = [
    "awaiting_payment",
    "paid",
    "preparing",
    "shipped",
    "processing",
    "waiting_delivery",
    "ready_pickup",
    "picked_up",
    "delivered",
];

/** Admin/DB rows may use "Picked_up", "Picked Up", etc.; always fold to snake_case. */
export const normalizeOrderStatus = (fulfilment: MedicineOrder["fulfilment"], status: string): OrderStatus => {
    const value = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (value === "completed" || value === "dispensed") {
        return fulfilment === "delivery" ? "delivered" : "picked_up";
    }
    return knownStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : "processing";
};

export type TrackingLabels = {
    awaiting: string;
    paid: string;
    preparing: string;
    shipped: string;
    ready: string;
    pickedUp: string;
    delivered: string;
};

export const trackingLabels = (locale: Locale): TrackingLabels => ({
    awaiting: orderStatusLabel(locale, "awaiting_payment"),
    paid: orderStatusLabel(locale, "paid"),
    preparing: orderStatusLabel(locale, "preparing"),
    shipped: orderStatusLabel(locale, "shipped"),
    ready: orderStatusLabel(locale, "ready_pickup"),
    pickedUp: orderStatusLabel(locale, "picked_up"),
    delivered: orderStatusLabel(locale, "delivered"),
});

const trackRank = (status: OrderStatus) => {
    if (status === "preparing" || status === "processing" || status === "waiting_delivery") return 1;
    if (status === "shipped" || status === "ready_pickup") return 2;
    if (status === "delivered" || status === "picked_up") return 3;
    return 0;
};

export const trackingStepsFor = (
    fulfilment: MedicineOrder["fulfilment"],
    status: OrderStatus,
    labels: TrackingLabels,
) => {
    if (status === "awaiting_payment") return [labels.awaiting];
    const names = fulfilment === "delivery"
        ? [labels.paid, labels.preparing, labels.shipped, labels.delivered]
        : [labels.paid, labels.preparing, labels.ready, labels.pickedUp];
    return names.slice(0, trackRank(status) + 1);
};

export const orderStatusColor = (status: OrderStatus): "warning" | "success" | "brand" | "gray" => {
    if (status === "awaiting_payment" || status === "waiting_delivery") return "warning";
    if (status === "delivered" || status === "picked_up") return "success";
    if (status === "preparing" || status === "shipped" || status === "ready_pickup") return "brand";
    return "gray";
};

/** Picked up or delivered; shown on dispensing history, not active order tracking. */
export const isCompletedOrder = (status: OrderStatus) => status === "picked_up" || status === "delivered";

export const isReadyPickupOrder = (status: OrderStatus) => status === "ready_pickup";
