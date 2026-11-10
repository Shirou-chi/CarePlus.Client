import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useAuth } from "@/providers/auth-provider";
import { TOKEN_KEY } from "@/services/api";
import { invoiceApi } from "@/services/invoiceApi";
import type { OutstandingInvoice } from "@/utils/invoices";

type OutstandingInvoicesValue = {
    invoices: OutstandingInvoice[];
    ready: boolean;
    error: string | null;
    overdue: boolean;
    reload: () => Promise<OutstandingInvoice[]>;
};

const OutstandingInvoicesContext = createContext<OutstandingInvoicesValue | null>(null);

export const OutstandingInvoicesProvider = ({ children }: { children: ReactNode }) => {
    const { profile, isReady } = useAuth();
    const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!profile || profile.id.startsWith("fam-") || !localStorage.getItem(TOKEN_KEY)) {
            flushSync(() => {
                setInvoices([]);
                setError(null);
                setReady(true);
            });
            return [];
        }

        try {
            const rows = await invoiceApi.listOutstanding();
            flushSync(() => {
                setInvoices(rows);
                setError(null);
                setReady(true);
            });
            return rows;
        } catch (cause) {
            flushSync(() => {
                setInvoices([]);
                setError(cause instanceof Error ? cause.message : "Outstanding invoices could not be loaded.");
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
            error,
            overdue: invoices.some((invoice) => invoice.status === "overdue"),
            reload,
        }),
        [invoices, ready, error, reload],
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
