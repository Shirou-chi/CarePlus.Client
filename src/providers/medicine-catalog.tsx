import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/providers/locale-provider";
import { medicineApi } from "@/services/medicineApi";
import { getMedicineCatalog, medicineCatalogReady, setMedicineRows } from "@/utils/prescribed-medicine";

const MedicineCatalogContext = createContext(0);

export const MedicineCatalogProvider = ({ children }: { children: ReactNode }) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        medicineApi
            .list()
            .then((rows) => {
                setMedicineRows(rows);
                setTick((value) => value + 1);
            })
            .catch(() => {
                setMedicineRows([]);
                setTick((value) => value + 1);
            });
    }, []);

    return <MedicineCatalogContext.Provider value={tick}>{children}</MedicineCatalogContext.Provider>;
};

export const useMedicineCatalog = () => {
    useContext(MedicineCatalogContext);
    const { locale } = useI18n();
    return { medicines: getMedicineCatalog(locale), ready: medicineCatalogReady() };
};
