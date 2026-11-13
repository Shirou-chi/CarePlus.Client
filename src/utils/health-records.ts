export type BloodPressureReading = {
    id: string;
    systolic: number;
    diastolic: number;
    recordedAt: string;
    notes: string | null;
};

export type HealthItemKind = "allergy" | "condition" | "history";

export type HealthItem = {
    id: string;
    kind: HealthItemKind;
    label: string;
    notes: string | null;
};

export type MedicalHistoryEntry = {
    id: string;
    treatment: string;
    facility: string;
    treatedAt: string;
    notes: string | null;
};

export type HealthScore = {
    value: number;
    band: "empty" | "good" | "fair" | "watch" | "attention";
    hasBloodPressure: boolean;
    trendPercent: number | null;
};

export const scoreHealth = (readings: BloodPressureReading[], items: HealthItem[]): HealthScore => {
    const sorted = [...readings].sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
    const latest = sorted.at(-1);
    const allergies = items.filter((item) => item.kind === "allergy").length;
    const conditions = items.filter((item) => item.kind === "condition").length;
    const historyItems = items.filter((item) => item.kind === "history").length;
    const hasBp = Boolean(latest);
    const hasAnything = hasBp || allergies > 0 || conditions > 0 || historyItems > 0;

    if (!hasAnything) {
        return { value: 0, band: "empty", hasBloodPressure: false, trendPercent: null };
    }

    let penalty = 0;
    if (latest) {
        penalty += bloodPressurePenalty(latest.systolic, latest.diastolic);
    }
    penalty += Math.min(allergies * 4, 16);
    penalty += Math.min(conditions * 6, 30);
    penalty += Math.min(historyItems * 3, 12);

    const value = Math.min(100, Math.max(0, 100 - penalty));
    const band = value >= 90 ? "good" : value >= 70 ? "fair" : value >= 50 ? "watch" : "attention";
    let trendPercent: number | null = null;
    if (sorted.length >= 2) {
        const older = sorted.at(-2)!.systolic;
        if (older > 0) {
            trendPercent = Math.round(((sorted.at(-1)!.systolic - older) * 100) / older);
        }
    }

    return { value, band, hasBloodPressure: hasBp, trendPercent };
};

const bloodPressurePenalty = (systolic: number, diastolic: number) => {
    if (systolic >= 180 || diastolic >= 120) return 45;
    if (systolic >= 140 || diastolic >= 90) return 30;
    if (systolic >= 130 || diastolic >= 80) return 18;
    if (systolic >= 120 && diastolic < 80) return 8;
    return 0;
};

export const isValidBloodPressure = (systolic: number, diastolic: number) =>
    Number.isInteger(systolic) && Number.isInteger(diastolic) && systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150 && systolic > diastolic;
