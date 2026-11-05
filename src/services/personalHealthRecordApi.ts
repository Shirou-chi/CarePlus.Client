import { baseUrl, messageFromBody, request, TOKEN_KEY, type ApiResponse } from "@/services/api";

export type PersonalRecord = {
    id: string;
    type: "bp" | "allergy" | "condition" | "history" | "medical";
    label: string | null;
    notes: string | null;
    systolic: number | null;
    diastolic: number | null;
    recordedAt: string;
    pdfFileName: string | null;
};

export type PersonalRecordInput = {
    type: "bp" | "allergy" | "condition" | "history";
    label?: string;
    notes?: string;
    systolic?: number;
    diastolic?: number;
    recordedAt?: string;
};

function data<T>(response: ApiResponse<T>): T {
    if (!response.isSuccess || response.data == null) throw new Error(messageFromBody(response, "Unable to save health record."));
    return response.data;
}

export const personalHealthRecordApi = {
    async list() {
        return data(await request<ApiResponse<PersonalRecord[]>>("/api/PersonalHealthRecord", {}, true));
    },
    async save(payload: PersonalRecordInput, id?: string) {
        return data(await request<ApiResponse<PersonalRecord>>(
            `/api/PersonalHealthRecord${id ? `/${encodeURIComponent(id)}` : ""}`,
            { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }, true,
        ));
    },
    async uploadPdf(file: File) {
        const body = new FormData();
        body.append("file", file);
        return data(await request<ApiResponse<PersonalRecord>>("/api/PersonalHealthRecord/pdf", { method: "POST", body }, true));
    },
    async viewPdf(id: string) {
        const response = await fetch(`${baseUrl}/api/PersonalHealthRecord/${encodeURIComponent(id)}/pdf`, {
            headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ""}` },
        });
        if (!response.ok) throw new Error("Unable to open this PDF.");
        return URL.createObjectURL(await response.blob());
    },
    async remove(id: string) {
        data(await request<ApiResponse<{ deleted: boolean }>>(`/api/PersonalHealthRecord/${encodeURIComponent(id)}`, { method: "DELETE" }, true));
    },
};
