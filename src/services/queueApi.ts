import { request, type ApiResponse } from "./api";

export type QueueStatus = {
    queueId: string;
    queueNumber: string;
    appointmentId: string;
    status: "Waiting" | "Called" | "InConsultation" | "Completed" | "Skipped" | "Cancelled" | string;
    checkedInAt: string;
    appointmentAt: string;
    doctorName: string;
    visitType: string;
    roomId: string | null;
    roomName: string | null;
    peopleAhead: number;
    estimatedWaitMinutes: number;
};

export type QueueCheckIn = {
    appointmentId: string;
    appointmentAt: string;
    doctorName: string;
    visitType: string;
    checkInOpensAt: string;
    checkInClosesAt: string;
    canCheckIn: boolean;
    message: string;
};

export type QueueOverview = {
    activeQueue: QueueStatus | null;
    checkIn: QueueCheckIn | null;
};

export type StaffQueueEntry = {
    queueId: string;
    queueNumber: string;
    appointmentId: string;
    patientName: string;
    doctorName: string;
    visitType: string;
    roomName: string | null;
    checkedInAt: string;
    status: string;
};

export type QueuePrescriptionItem = {
    medicineId: string;
    dosage: string;
    quantity: number;
    instructions: string;
};

export type QueueConsultationRequest = {
    diagnosis: string;
    notes: string;
    prescriptionItems: QueuePrescriptionItem[];
};

const unwrap = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const result = await request<ApiResponse<T>>(path, options, true);
    if (!result.isSuccess || result.data === null) {
        throw new Error(result.respMessage || "Unable to load the clinic queue.");
    }
    return result.data;
};

export const queueApi = {
    overview: (appointmentId?: string | null) =>
        unwrap<QueueOverview>(`/api/Queue${appointmentId ? `?appointmentId=${encodeURIComponent(appointmentId)}` : ""}`, { cache: "no-store" }),
    checkIn: (appointmentId: string) =>
        unwrap<QueueStatus>(`/api/Queue/check-in/${encodeURIComponent(appointmentId)}`, { method: "POST" }),
    staffList: (signal?: AbortSignal) =>
        unwrap<StaffQueueEntry[]>("/api/Queue/staff", { cache: "no-store", signal }),
    updateStatus: (entry: StaffQueueEntry, status: string) =>
        unwrap<QueueStatus>(`/api/Queue/${encodeURIComponent(entry.queueId)}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status, expectedStatus: entry.status }),
        }),
    completeConsultation: (queueId: string, body: QueueConsultationRequest) =>
        unwrap<QueueStatus>(`/api/Queue/${encodeURIComponent(queueId)}/consultation/complete`, {
            method: "POST",
            body: JSON.stringify(body),
        }),
};
