import type { Locale } from "@/providers/locale-provider";

export type ClinicChargeCategory = "consultation" | "medicine" | "procedure" | "lab" | "other";
export type LabFlag = "normal" | "high" | "low";

export type LabMarker = { name: string; value: string; unit: string; range: string; flag: LabFlag };

export type ClinicChargeLine = {
    id: string;
    category: ClinicChargeCategory;
    item: string;
    detail: string;
    unitPrice: number;
    qty: number;
    markers?: LabMarker[];
};

export type ClinicRecord = {
    id: string;
    patientName: string;
    patientMeta: string;
    doctorId: string;
    doctorName: string;
    doctorPhoto: string;
    specialty: string;
    visitTypeId: string;
    visitType: string;
    visitedAt: string;
    status: "completed";
    diagnosis: string;
    doctorComment: string;
    medications: string[];
    ward: string;
    charges: ClinicChargeLine[];
    sstRate: number;
};

export type ClinicRecordTotals = { subtotal: number; sst: number; total: number };

export const clinicDoctorAvatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=0f766e&color=fff&bold=true`;

export const getClinicRecordTotals = (record: ClinicRecord): ClinicRecordTotals => {
    const subtotal = record.charges.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const sst = Number((subtotal * record.sstRate).toFixed(2));
    return { subtotal, sst, total: Number((subtotal + sst).toFixed(2)) };
};

export const listLabReports = (records: ClinicRecord[]) =>
    records.flatMap((record) =>
        record.charges
            .filter((line) => line.category === "lab" && line.markers && line.markers.length > 0)
            .map((line) => ({ id: `${record.id}-${line.id}`, record, line })),
    );

export const clinicChargeCategoryLabel = (locale: Locale, category: ClinicChargeCategory) => {
    const en: Record<ClinicChargeCategory, string> = {
        consultation: "Consultation",
        medicine: "Medicine",
        procedure: "Procedure",
        lab: "Lab",
        other: "Other",
    };
    const zh: Record<ClinicChargeCategory, string> = {
        consultation: "咨询",
        medicine: "药品",
        procedure: "程序",
        lab: "化验",
        other: "其他",
    };
    return locale === "zh" ? zh[category] : en[category];
};
