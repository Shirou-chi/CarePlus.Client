import { getClinicRecordById, getClinicRecordTotals, getClinicRecords } from "./clinic-records.ts";
import { hasOverdueInvoice, listOutstandingInvoices, listPaymentHistory, payInvoice } from "./invoices.ts";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
});

const now = Date.parse("2026-10-21T10:00:00+08:00");
const records = getClinicRecords("en");
const open = listOutstandingInvoices(records, now);
const lim = getClinicRecordTotals(getClinicRecordById("en", "CR-2405")!);
const wong = getClinicRecordTotals(getClinicRecordById("en", "CR-2398")!);
const tan = getClinicRecordTotals(getClinicRecordById("en", "CR-2311")!);

const checks = [
    open.length === 3,
    open.map((item) => item.id).join() === "INV-2398,INV-2405,INV-2311",
    open[0].status === "overdue" && open[1].status === "due" && open[2].status === "due",
    open.find((item) => item.id === "INV-2405")?.total === lim.total,
    open.find((item) => item.id === "INV-2398")?.daysOverdue === 11,
    open.find((item) => item.id === "INV-2398")?.lateFee === 110,
    open.find((item) => item.id === "INV-2398")?.amountDue === Number((wong.total + 110).toFixed(2)),
    open.find((item) => item.id === "INV-2405")?.lateFee === 0,
    hasOverdueInvoice(records, now),
    open.find((item) => item.id === "INV-2311")?.recordId === "CR-2311" && open[2].total === tan.total,
    !open.some((item) => item.recordId === "CR-2280"),
];

const beforePay = listPaymentHistory(records);
const raj = getClinicRecordTotals(getClinicRecordById("en", "CR-2280")!);
const overdue = open.find((item) => item.id === "INV-2398")!;
payInvoice("INV-2398", "Visa ···· 1881", "2026-10-21T10:05:00+08:00", overdue.lateFee, overdue.daysOverdue);
const after = listOutstandingInvoices(records, now);
const history = listPaymentHistory(records);
checks.push(
    beforePay.length === 1 && beforePay[0].id === "INV-2280" && beforePay[0].total === raj.total,
    after.length === 2,
    !after.some((item) => item.id === "INV-2398"),
    history.map((item) => item.id).join() === "INV-2398,INV-2280",
    history[0].method === "Visa ···· 1881" && history[0].lateFee === 110 && history[0].total === Number((wong.total + 110).toFixed(2)),
    history[1].lateFee === 0 && history[1].total === raj.total,
    !hasOverdueInvoice(records, now),
    history.every((item, index) => index === 0 || Date.parse(history[index - 1].paidAt) >= Date.parse(item.paidAt)),
);

if (checks.every(Boolean)) {
    console.log("outstanding invoices ok");
} else {
    console.error(checks);
    process.exit(1);
}
