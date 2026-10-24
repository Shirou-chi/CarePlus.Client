import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useAuth } from "@/providers/auth-provider";
import { TOKEN_KEY } from "@/services/api";
import { invoiceApi } from "@/services/invoiceApi";
import type { OutstandingInvoice } from "@/utils/invoices";

type OutstandingInvoicesValue = {
    invoices: OutstandingInvoice[];
    ready: boolean;
    overdue: boolean;
    reload: () => Promise<OutstandingInvoice[]>;
};

const OutstandingInvoicesContext = createContext<OutstandingInvoicesValue | null>(null);

export const OutstandingInvoicesProvider = ({ children }: { children: ReactNode }) => {
    const { profile, isReady } = useAuth();
    const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
    const [ready, setReady] = useState(false);

    const reload = useCallback(async () => {
        if (!profile || profile.id.startsWith("fam-") || !localStorage.getItem(TOKEN_KEY)) {
            flushSync(() => {
                setInvoices([]);
                setReady(true);
            });
            return [];
        }

        try {
            const rows = await invoiceApi.listOutstanding();
            flushSync(() => {
                setInvoices(rows);
                setReady(true);
            });
            return rows;
        } catch {
            flushSync(() => {
                setInvoices([]);
                setReady(true);
            });
            return [];
        }
    }, [profile]);

    useEffect(() => {
        if (!isReady) return;
        setReady(false);
        void reload();
    }, [isReady, reload]);

    const value = useMemo<OutstandingInvoicesValue>(
        () => ({
            invoices,
            ready,
            overdue: invoices.some((invoice) => invoice.status === "overdue"),
            reload,
        }),
        [invoices, ready, reload],
    );

    return <OutstandingInvoicesContext.Provider value={value}>{children}</OutstandingInvoicesContext.Provider>;
};

export const useOutstandingInvoices = () => {
    const value = useContext(OutstandingInvoicesContext);
    if (!value) {
        throw new Error("useOutstandingInvoices must be used within OutstandingInvoicesProvider");
    }
    return value;
};
