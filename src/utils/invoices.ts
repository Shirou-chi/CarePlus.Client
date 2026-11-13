export type InvoiceStatus = "due" | "overdue";

/** Paths blocked while an overdue invoice is unpaid. Account settings and invoice pay stay open. */
export const isOverdueLockedPath = (pathname: string) =>
    [
        "/home",
        "/book",
        "/visits",
        "/history",
        "/queue",
        "/payments",
        "/records",
        "/family",
        "/medicine",
        "/cart",
        "/checkout",
        "/orders",
        "/dispensing-history",
        "/clinic-records",
        "/doctors",
        "/notifications",
        "/announcements",
        "/about",
        "/contact",
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

/** Safe href while overdue: keep account/invoice routes, otherwise send to Outstanding invoices. */
export const overdueSafeHref = (href: string, overdue: boolean) => {
    if (!overdue) return href;
    const path = href.split(/[?#]/)[0] || href;
    if (path === "/account" || path.startsWith("/account/") || path === "/invoices" || path.startsWith("/invoices/") || path.startsWith("/pay/")) {
        return href;
    }
    if (isOverdueLockedPath(path) || path === "/home") return "/invoices";
    return href;
};

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
