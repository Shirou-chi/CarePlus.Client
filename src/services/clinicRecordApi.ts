import type { Locale } from "@/providers/locale-provider";
import { request, type ApiResponse } from "@/services/api";
import { clinicDoctorAvatar, type ClinicRecord } from "@/utils/clinic-records";

const normalizeRecord = (record: ClinicRecord): ClinicRecord => ({
    ...record,
    doctorPhoto: record.doctorPhoto || clinicDoctorAvatar(record.doctorName),
    charges: record.charges ?? [],
    medications: record.medications ?? [],
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
};
