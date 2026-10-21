import type { Locale } from "@/providers/locale-provider";

export type OrderStatus = "processing" | "waiting_delivery" | "ready_pickup" | "delivered";

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
};

const orders: Record<Locale, MedicineOrder[]> = {
    en: [
        {
            id: "CP-2026-0142",
            placedAt: "2026-02-18T10:30:00+08:00",
            status: "waiting_delivery",
            fulfilment: "delivery",
            payment: "Online banking (FPX)",
            address: "Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur",
            lines: [
                { id: "1", name: "Amoxicillin 500 mg capsules", detail: "16 capsules · CarePlus pharmacy", unitPrice: 12.5, qty: 2 },
                { id: "2", name: "Paracetamol 500 mg tablets", detail: "20 tablets · CarePlus pharmacy", unitPrice: 8.0, qty: 1 },
            ],
            total: 40.0,
            trackingSteps: [
                "Order confirmed at CarePlus pharmacy",
                "Packed and handed to courier",
                "Out for delivery in Setapak",
            ],
        },
        {
            id: "CP-2026-0098",
            placedAt: "2026-01-05T15:10:00+08:00",
            status: "delivered",
            fulfilment: "pickup",
            payment: "COD",
            lines: [{ id: "1", name: "Loratadine 10 mg tablets", detail: "10 tablets · CarePlus pharmacy", unitPrice: 9.5, qty: 1 }],
            total: 9.5,
            trackingSteps: ["Order confirmed", "Ready at clinic counter", "Collected by patient"],
        },
        {
            id: "CP-2025-0771",
            placedAt: "2025-11-22T09:00:00+08:00",
            status: "ready_pickup",
            fulfilment: "pickup",
            payment: "Card",
            lines: [{ id: "1", name: "Paracetamol 500 mg tablets", detail: "20 tablets · CarePlus pharmacy", unitPrice: 8.0, qty: 3 }],
            total: 24.0,
            trackingSteps: ["Order confirmed", "Ready for pickup at clinic counter"],
        },
    ],
    zh: [
        {
            id: "CP-2026-0142",
            placedAt: "2026-02-18T10:30:00+08:00",
            status: "waiting_delivery",
            fulfilment: "delivery",
            payment: "网上银行 (FPX)",
            address: "Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur",
            lines: [
                { id: "1", name: "阿莫西林 500 毫克胶囊", detail: "16 粒 · CarePlus 药房", unitPrice: 12.5, qty: 2 },
                { id: "2", name: "扑热息痛 500 毫克片剂", detail: "20 片 · CarePlus 药房", unitPrice: 8.0, qty: 1 },
            ],
            total: 40.0,
            trackingSteps: ["CarePlus 药房已确认订单", "已打包并交给配送员", "正在 Setapak 配送中"],
        },
        {
            id: "CP-2026-0098",
            placedAt: "2026-01-05T15:10:00+08:00",
            status: "delivered",
            fulfilment: "pickup",
            payment: "货到付款 (COD)",
            lines: [{ id: "1", name: "氯雷他定 10 毫克片剂", detail: "10 片 · CarePlus 药房", unitPrice: 9.5, qty: 1 }],
            total: 9.5,
            trackingSteps: ["订单已确认", "诊所柜台可取", "病人已领取"],
        },
        {
            id: "CP-2025-0771",
            placedAt: "2025-11-22T09:00:00+08:00",
            status: "ready_pickup",
            fulfilment: "pickup",
            payment: "银行卡",
            lines: [{ id: "1", name: "扑热息痛 500 毫克片剂", detail: "20 片 · CarePlus 药房", unitPrice: 8.0, qty: 3 }],
            total: 24.0,
            trackingSteps: ["订单已确认", "可在诊所柜台领取"],
        },
    ],
};

export const getOrderHistory = (locale: Locale) => orders[locale];

export const getOrderById = (locale: Locale, id: string) => getOrderHistory(locale).find((order) => order.id === id) ?? null;

export const orderStatusLabel = (locale: Locale, status: OrderStatus) => {
    const en: Record<OrderStatus, string> = {
        processing: "Processing",
        waiting_delivery: "Waiting for delivery",
        ready_pickup: "Ready for pickup",
        delivered: "Delivered",
    };
    const zh: Record<OrderStatus, string> = {
        processing: "处理中",
        waiting_delivery: "等待配送",
        ready_pickup: "待自取",
        delivered: "已送达",
    };
    return locale === "zh" ? zh[status] : en[status];
};

export const orderStatusColor = (status: OrderStatus): "warning" | "success" | "brand" | "gray" => {
    if (status === "waiting_delivery") return "warning";
    if (status === "delivered") return "success";
    if (status === "ready_pickup") return "brand";
    return "gray";
};
