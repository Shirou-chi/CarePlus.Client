import { request, type ApiResponse } from "@/services/api";
import { getClinicPharmacy, type CartLine } from "@/utils/prescribed-medicine";

type CartRow = {
    medicineId: string;
    name: string;
    unitPrice: number;
    qty: number;
};

const toLines = (rows: CartRow[]): CartLine[] => {
    const pharmacy = getClinicPharmacy("en");
    return rows.map((row) => ({
        medicineId: row.medicineId,
        pharmacyId: "clinic",
        name: row.name,
        pharmacy: pharmacy.name,
        unitPrice: Number(row.unitPrice),
        qty: row.qty,
    }));
};

export type CartState = {
    lines: CartLine[];
    bought: Record<string, number>;
};

const read = async (path: string, options: RequestInit): Promise<CartState> => {
    const result = await request<ApiResponse<{ lines: CartRow[]; bought: { medicineId: string; qty: number }[] }>>(path, options, true);
    if (!result.isSuccess || !result.data) {
        throw new Error(result.respMessage || "Cart update failed.");
    }
    return {
        lines: toLines(result.data.lines ?? []),
        bought: Object.fromEntries((result.data.bought ?? []).map((row) => [row.medicineId, row.qty])),
    };
};

export const cartApi = {
    list: () => read("/api/Cart", { method: "GET" }),
    setQty: (medicineId: string, qty: number) => read("/api/Cart", { method: "PUT", body: JSON.stringify({ medicineId, qty }) }),
    removeMany: (medicineIds: string[]) => read("/api/Cart/Remove", { method: "POST", body: JSON.stringify({ medicineIds }) }),
    clear: () => read("/api/Cart", { method: "DELETE" }),
};
