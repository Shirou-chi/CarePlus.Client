import { useEffect, useState } from "react";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { DoctorCard } from "@/components/marketing/doctors/doctor-card";
import { useI18n } from "@/providers/locale-provider";
import { doctorApi, type DoctorRecord } from "@/services/doctorApi";

export const DoctorsPage = () => {
    const { t, locale } = useI18n();
    const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        doctorApi
            .list()
            .then((records) => active && setDoctors(records))
            .catch((cause) => active && setError(cause instanceof Error ? cause.message : t.doctorNotFound))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [t.doctorNotFound]);

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-10 md:px-8 md:py-16">
                <div className="max-w-3xl">
                    <p className="text-sm font-semibold text-brand-secondary">{t.clinicName}</p>
                    <h1 className="mt-2 text-display-sm font-semibold text-primary [font-family:var(--font-display)]">{t.doctorsTitle}</h1>
                    <p className="mt-3 text-lg text-tertiary">{t.doctorsBody}</p>
                </div>
                <div className="mt-10">
                    {loading ? <p className="rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">{t.phrLoading}</p> : null}
                    {error ? <p role="alert" className="rounded-2xl bg-error-solid px-6 py-4 text-sm font-semibold text-white">{error}</p> : null}
                    {!loading && !error && doctors.length === 0 ? <p className="rounded-2xl bg-primary px-6 py-10 text-center text-sm text-tertiary ring-1 ring-secondary">{t.doctorNotFound}</p> : null}
                    {!loading && !error && doctors.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {doctors.map((doctor) => (
                                <DoctorCard key={doctor.staffId} doctor={doctor} locale={locale} t={t} />
                            ))}
                        </div>
                    ) : null}
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
