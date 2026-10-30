import { request, type ApiResponse } from "./api";

export type ApiAnnouncement = {
    id: string;
    postedOn: string;
    title: string;
    body: string;
    titleZh: string;
    bodyZh: string;
};

export const announcementApi = {
    async list(): Promise<ApiAnnouncement[]> {
        const result = await request<ApiResponse<ApiAnnouncement[]>>("/api/Announcement");
        if (!result.isSuccess || result.data === null) {
            throw new Error(result.respMessage || "Unable to load clinic announcements.");
        }
        return result.data;
    },
};
