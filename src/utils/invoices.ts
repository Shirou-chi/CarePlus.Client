export type InvoiceStatus = "due" | "overdue";

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
