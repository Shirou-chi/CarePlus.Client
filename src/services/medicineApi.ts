import { request, type ApiResponse } from "@/services/api";
import type { MedicineRow } from "@/utils/prescribed-medicine";

export const medicineApi = {
    async list(): Promise<MedicineRow[]> {
        const result = await request<ApiResponse<MedicineRow[]>>("/api/Medicine/Retrieve");
        if (!result.isSuccess || !result.data) {
            return [];
        }
        return result.data.filter((row) => row.status === "Available");
    },
};
