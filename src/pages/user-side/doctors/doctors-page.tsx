import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { DoctorCard } from "@/components/marketing/doctors/doctor-card";
import { useI18n } from "@/providers/locale-provider";
import { getDoctorCatalog } from "@/utils/doctors";

export const DoctorsPage = () => {
    const { t, locale } = useI18n();
    const doctors = getDoctorCatalog(locale);

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
                <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {doctors.map((doctor) => (
                        <DoctorCard key={doctor.id} doctor={doctor} locale={locale} t={t} />
                    ))}
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
