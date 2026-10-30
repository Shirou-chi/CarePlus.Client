import { request, type ApiResponse } from "./api";

export type BookingDoctor = {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    qualification: string;
    yearsOfExperience: number;
};

export type BookingVisitType = { id: string; name: string; description: string };
export type BookingCatalog = {
    doctors: BookingDoctor[];
    types: BookingVisitType[];
    bookingClosed: boolean;
    cancelsToday: number;
    cancelLimit: number;
    rescheduleLimit: number;
};

export type TimeSlot = { startAt: string; label: string; booked: boolean };
export type BookingSlots = { date: string; doctorId: string; morning: TimeSlot[]; night: TimeSlot[] };

export type Appointment = {
    id: string;
    forName: string;
    doctorId: string;
    doctorName: string;
    type: "general" | "mental" | "screening" | string;
    notes: string | null;
    recordId?: string | null;
    startAt: string;
    endAt: string;
    status: "confirmed" | "completed" | "cancelled" | string;
    rescheduleCount: number;
    rescheduleBlocked: boolean;
};

const unwrap = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const result = await request<ApiResponse<T>>(path, options, true);
    if (!result.isSuccess || result.data === null) {
        throw new Error(result.respMessage || "Unable to load appointment information.");
    }
    return result.data;
};

export const appointmentApi = {
    catalog: () => unwrap<BookingCatalog>("/api/Appointment/Catalog"),
    slots: (date: string, doctorId: string) =>
        unwrap<BookingSlots>(`/api/Appointment/Slots?date=${encodeURIComponent(date)}&doctorId=${encodeURIComponent(doctorId)}`),
    upcoming: () => unwrap<Appointment[]>("/api/Appointment/Upcoming"),
    history: () => unwrap<Appointment[]>("/api/Appointment/History"),
    book: (body: { doctorId: string; startAt: string; type: string; forName: string; notes?: string }) =>
        unwrap<Appointment>("/api/Appointment", { method: "POST", body: JSON.stringify(body) }),
    cancel: (id: string) => unwrap<Appointment>(`/api/Appointment/${encodeURIComponent(id)}/Cancel`, { method: "POST" }),
    reschedule: (id: string, startAt: string) =>
        unwrap<Appointment>(`/api/Appointment/${encodeURIComponent(id)}/Reschedule`, { method: "POST", body: JSON.stringify({ startAt }) }),
};
