import { request, type ApiResponse } from "./api";

export type ApiNotification = {
    id: string;
    title: string;
    message: string;
    titleZh: string;
    messageZh: string;
    actor: string;
    initials: string;
    type: string;
    href: string;
    createdAt: string;
    unread: boolean;
};

const unwrap = async <T>(path: string, options?: RequestInit) => {
    const result = await request<ApiResponse<T>>(path, options, true);
    if (!result.isSuccess || result.data === null) {
        throw new Error(result.respMessage || "Unable to load notifications.");
    }
    return result.data;
};

export const notificationApi = {
    async list(): Promise<ApiNotification[]> {
        return unwrap<ApiNotification[]>("/api/Notification", { cache: "no-store" });
    },
    async markRead(id: string): Promise<ApiNotification[]> {
        return unwrap<ApiNotification[]>(`/api/Notification/${encodeURIComponent(id)}/read`, { method: "POST" });
    },
    async markManyRead(ids: string[]): Promise<ApiNotification[]> {
        return unwrap<ApiNotification[]>("/api/Notification/read", { method: "POST", body: JSON.stringify({ ids }) });
    },
    async markAllRead(): Promise<ApiNotification[]> {
        return unwrap<ApiNotification[]>("/api/Notification/read-all", { method: "POST" });
    },
    async remove(ids: string[]): Promise<ApiNotification[]> {
        return unwrap<ApiNotification[]>("/api/Notification", { method: "DELETE", body: JSON.stringify({ ids }) });
    },
};
