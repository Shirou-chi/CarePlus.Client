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

const at = (daysAgo: number, hour: number, minute = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
};

const onDay = (isoDate: string) => new Date(`${isoDate}T00:00:00+08:00`).toISOString();

export const dummyReadings: BloodPressureReading[] = [
    { id: "bp-1", systolic: 128, diastolic: 82, recordedAt: at(21, 7, 30), notes: "Home monitor, after breakfast." },
    { id: "bp-2", systolic: 124, diastolic: 80, recordedAt: at(14, 7, 15), notes: null },
    { id: "bp-3", systolic: 118, diastolic: 76, recordedAt: at(7, 8, 0), notes: "Clinic waiting room." },
    { id: "bp-4", systolic: 116, diastolic: 74, recordedAt: at(2, 7, 45), notes: null },
];

export const dummyItems: HealthItem[] = [
    { id: "al-1", kind: "allergy", label: "Penicillin", notes: "Rash as a teenager." },
    { id: "al-2", kind: "allergy", label: "Prawn", notes: null },
    { id: "co-1", kind: "condition", label: "Tension headache", notes: "Worse after long screens." },
    { id: "co-2", kind: "condition", label: "Seasonal rhinitis", notes: null },
    { id: "hi-1", kind: "history", label: "Childhood asthma", notes: "Quiet since secondary school." },
    { id: "hi-2", kind: "history", label: "Appendectomy, 2018", notes: null },
];

export const dummyHistory: MedicalHistoryEntry[] = [
    {
        id: "mh-1",
        treatment: "Wisdom tooth extraction",
        facility: "Pantai Hospital Kuala Lumpur",
        treatedAt: onDay("2024-03-12"),
        notes: "Local anaesthetic. No follow-up needed.",
    },
    {
        id: "mh-2",
        treatment: "Full body check",
        facility: "Sunway Medical Centre",
        treatedAt: onDay("2025-11-02"),
        notes: "Lipids slightly high. Diet advice given.",
    },
    {
        id: "mh-3",
        treatment: "Physiotherapy for ankle sprain",
        facility: "Klinik Mediviron Setapak",
        treatedAt: onDay("2026-01-18"),
        notes: "Six sessions. Walking is fine now.",
    },
];

export const newRecordId = () => `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
