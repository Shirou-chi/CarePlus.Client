import { useEffect, useState } from "react";
import { useI18n } from "@/providers/locale-provider";
import { clinicRecordApi } from "@/services/clinicRecordApi";
import type { ClinicRecord, DoctorReview } from "@/utils/clinic-records";

export const useClinicRecords = () => {
    const { locale } = useI18n();
    const [records, setRecords] = useState<ClinicRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        clinicRecordApi
            .list(locale)
            .then((rows) => {
                if (!cancelled) setRecords(rows);
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setRecords([]);
                    setError(reason instanceof Error ? reason.message : "Unable to load clinic records.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [locale]);

    const updateReview = (recordId: string, review: DoctorReview) => {
        setRecords((current) => current.map((record) => record.id === recordId ? { ...record, review } : record));
    };

    return { records, loading, error, updateReview };
};
