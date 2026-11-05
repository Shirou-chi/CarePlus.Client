import type { Locale } from "@/providers/locale-provider";
import { request, type ApiResponse } from "@/services/api";
import { clinicDoctorAvatar, type ClinicRecord, type DoctorReview } from "@/utils/clinic-records";

const normalizeRecord = (record: ClinicRecord): ClinicRecord => ({
    ...record,
    doctorPhoto: record.doctorPhoto || clinicDoctorAvatar(record.doctorName),
    charges: record.charges ?? [],
    medications: record.medications ?? [],
    review: record.review ?? null,
});

export const clinicRecordApi = {
    async list(locale: Locale): Promise<ClinicRecord[]> {
        const response = await request<ApiResponse<ClinicRecord[]>>(
            `/api/ClinicRecord?locale=${encodeURIComponent(locale)}`,
            {},
            true,
        );
        if (!response.isSuccess) {
            throw new Error(response.respMessage || "Unable to load clinic records.");
        }
        return (response.data ?? []).map(normalizeRecord);
    },
    async review(recordId: string, rating: number, description: string, isAnonymous: boolean): Promise<DoctorReview> {
        const response = await request<ApiResponse<DoctorReview>>(
            `/api/ClinicRecord/${encodeURIComponent(recordId)}/review`,
            { method: "POST", body: JSON.stringify({ rating, description: description.trim() || null, isAnonymous }) },
            true,
        );
        if (!response.isSuccess || !response.data) {
            throw new Error(response.respMessage || "Unable to submit your review.");
        }
        return response.data;
    },
};
