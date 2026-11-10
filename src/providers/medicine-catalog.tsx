import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/providers/locale-provider";
import { useAuth } from "@/providers/auth-provider";
import { medicineApi } from "@/services/medicineApi";
import { getMedicineCatalog, medicineCatalogReady, setMedicineRows } from "@/utils/prescribed-medicine";

type MedicineCatalogContextValue = {
    version: number;
    error: string | null;
    reload: () => void;
};

const MedicineCatalogContext = createContext<MedicineCatalogContextValue>({ version: 0, error: null, reload: () => undefined });

export const MedicineCatalogProvider = ({ children }: { children: ReactNode }) => {
    const { profile, isReady } = useAuth();
    const [tick, setTick] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const reload = useCallback(() => setAttempt((value) => value + 1), []);

    useEffect(() => {
        if (!isReady) return;
        if (!profile) {
            setMedicineRows([]);
            setError(null);
            setTick((value) => value + 1);
            return;
        }
        let cancelled = false;
        setError(null);
        medicineApi
            .list()
            .then((rows) => {
                if (cancelled) return;
                setMedicineRows(rows);
                setTick((value) => value + 1);
            })
            .catch((reason: unknown) => {
                if (cancelled) return;
                setMedicineRows([]);
                setError(reason instanceof Error ? reason.message : "Medicines could not be loaded.");
                setTick((value) => value + 1);
            });
        return () => {
            cancelled = true;
        };
    }, [attempt, isReady, profile?.id]);

    const value = useMemo(() => ({ version: tick, error, reload }), [error, reload, tick]);
    return <MedicineCatalogContext.Provider value={value}>{children}</MedicineCatalogContext.Provider>;
};

export const useMedicineCatalog = () => {
    const context = useContext(MedicineCatalogContext);
    const { locale } = useI18n();
    return { medicines: getMedicineCatalog(locale), ready: medicineCatalogReady(), error: context.error, reload: context.reload };
};
