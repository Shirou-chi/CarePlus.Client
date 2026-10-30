import { request, type ApiResponse } from "@/services/api";

export type DoctorSchedule = {
    workingDate: string;
    startTime: string;
    endTime: string;
};

export type DoctorRecord = {
    staffId: string;
    name: string;
    specialization: string;
    qualification: string;
    yearsOfExperience: number;
    schedules: DoctorSchedule[];
};

const unwrap = async <T>(path: string): Promise<T> => {
    const result = await request<ApiResponse<T>>(path);
    if (!result.isSuccess || result.data === null) {
        throw new Error(result.respMessage || "Unable to load doctor information.");
    }
    return result.data;
};

export const doctorPhotoUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=512&background=0f766e&color=fff&bold=true`;

export const doctorApi = {
    list: () => unwrap<DoctorRecord[]>("/api/Doctor/Public"),
    get: (staffId: string) => unwrap<DoctorRecord>(`/api/Doctor/Public/${encodeURIComponent(staffId)}`),
};
