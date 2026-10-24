import type { ClinicRecord } from "./clinic-records";

export type InvoiceStatus = "due" | "overdue";

export const LATE_FEE_PER_DAY = 10;

export type OutstandingInvoice = {
    id: string;
    recordId: string;
    issuedAt: string;
    dueAt: string;
    status: InvoiceStatus;
    doctorId: string;
    doctorName: string;
    visitType: string;
    total: number;
    daysOverdue: number;
    lateFee: number;
    amountDue: number;
};

const PAID_KEY = "careplus-paid-invoices";

type StoredPayment = {
    id: string;
    paidAt: string;
    method: string;
    lateFee: number;
    daysOverdue: number;
};

const seeds = [
    { id: "INV-2405", recordId: "CR-2405", issuedAt: "2026-02-12T09:30:00+08:00", dueAt: "2026-10-28T23:59:00+08:00" },
    { id: "INV-2398", recordId: "CR-2398", issuedAt: "2026-01-20T08:00:00+08:00", dueAt: "2026-10-10T23:59:00+08:00" },
    { id: "INV-2311", recordId: "CR-2311", issuedAt: "2025-12-08T14:00:00+08:00", dueAt: "2026-11-04T23:59:00+08:00" },
];

/** Already settled before this login, so it starts on payment history. */
const settled = [
    { id: "INV-2280", recordId: "CR-2280", issuedAt: "2025-11-03T21:15:00+08:00", paidAt: "2025-11-04T10:12:00+08:00", method: "Visa ···· 1881" },
];

const klDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

const dayNumber = (isoDay: string) => {
    const [year, month, day] = isoDay.split("-").map(Number);
    return Math.round(Date.UTC(year, month - 1, day) / 86400000);
};

/** Whole KL days after the due date. The due date itself is not charged. */
export const overdueDays = (dueAt: string, now = Date.now()) => Math.max(0, dayNumber(klDay(now)) - dayNumber(klDay(Date.parse(dueAt))));

const readPaid = (): StoredPayment[] => {
    try {
        const raw = sessionStorage.getItem(PAID_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.flatMap((item) => {
            if (typeof item === "string") return [{ id: item, paidAt: new Date().toISOString(), method: "Card", lateFee: 0, daysOverdue: 0 }];
            if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
                const paidAt = "paidAt" in item && typeof item.paidAt === "string" ? item.paidAt : new Date().toISOString();
                const method = "method" in item && typeof item.method === "string" ? item.method : "Card";
                const lateFee = "lateFee" in item && typeof item.lateFee === "number" ? item.lateFee : 0;
                const daysOverdue = "daysOverdue" in item && typeof item.daysOverdue === "number" ? item.daysOverdue : 0;
                return [{ id: item.id, paidAt, method, lateFee, daysOverdue }];
            }
            return [];
        });
    } catch {
        return [];
    }
};

export const payInvoice = (id: string, method = "Card", paidAt = new Date().toISOString(), lateFee = 0, daysOverdue = 0) => {
    const paid = readPaid().filter((item) => item.id !== id);
    paid.push({ id, paidAt, method, lateFee, daysOverdue });
    sessionStorage.setItem(PAID_KEY, JSON.stringify(paid));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("careplus-invoices"));
};

const totalOf = (record: ClinicRecord) => {
    const subtotal = record.charges.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const sst = Number((subtotal * record.sstRate).toFixed(2));
    return Number((subtotal + sst).toFixed(2));
};

export type PaidInvoice = {
    id: string;
    recordId: string;
    issuedAt: string;
    paidAt: string;
    method: string;
    doctorId: string;
    doctorName: string;
    visitType: string;
    bill: number;
    lateFee: number;
    daysOverdue: number;
    total: number;
};

const toPaid = (
    row: { id: string; recordId: string; issuedAt: string; paidAt: string; method: string; lateFee: number; daysOverdue: number },
    records: Map<string, ClinicRecord>,
): PaidInvoice | null => {
    const record = records.get(row.recordId);
    if (!record) return null;
    const bill = totalOf(record);
    return {
        ...row,
        doctorId: record.doctorId,
        doctorName: record.doctorName,
        visitType: record.visitType,
        bill,
        total: Number((bill + row.lateFee).toFixed(2)),
    };
};

export const listPaymentHistory = (records: ClinicRecord[]): PaidInvoice[] => {
    const byId = new Map(records.map((record) => [record.id, record]));
    const paid = new Map(readPaid().map((item) => [item.id, item]));
    const fromThisLogin = seeds.flatMap((seed) => {
        const payment = paid.get(seed.id);
        if (!payment) return [];
        const row = toPaid({ ...seed, ...payment }, byId);
        return row ? [row] : [];
    });
    const alreadySettled = settled.flatMap((row) => {
        const item = toPaid({ ...row, lateFee: 0, daysOverdue: 0 }, byId);
        return item ? [item] : [];
    });
    return [...fromThisLogin, ...alreadySettled].sort((a, b) => Date.parse(b.paidAt) - Date.parse(a.paidAt));
};

export const hasOverdueInvoice = (records: ClinicRecord[], now = Date.now()) => listOutstandingInvoices(records, now).some((item) => item.status === "overdue");

export const listOutstandingInvoices = (records: ClinicRecord[], now = Date.now()): OutstandingInvoice[] => {
    const paid = new Set(readPaid().map((item) => item.id));
    const byId = new Map(records.map((record) => [record.id, record]));
    return seeds
        .filter((seed) => !paid.has(seed.id))
        .flatMap((seed) => {
            const record = byId.get(seed.recordId);
            if (!record) return [];
            const daysOverdue = overdueDays(seed.dueAt, now);
            const lateFee = daysOverdue * LATE_FEE_PER_DAY;
            const total = totalOf(record);
            return [
                {
                    ...seed,
                    status: daysOverdue > 0 ? "overdue" : "due",
                    doctorId: record.doctorId,
                    doctorName: record.doctorName,
                    visitType: record.visitType,
                    total,
                    daysOverdue,
                    lateFee,
                    amountDue: Number((total + lateFee).toFixed(2)),
                },
            ];
        })
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
            return Date.parse(a.dueAt) - Date.parse(b.dueAt);
        });
};
