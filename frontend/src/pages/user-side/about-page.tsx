import { ArrowRight, CalendarCheck01, File06, HeartHand, MedicalCross, Users01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";

const clinicPhotos = [
    { src: "/home/clinic-reception.png", altKey: "clinicReception" as const },
    { src: "/home/clinic-consult.png", altKey: "clinicConsult" as const },
    { src: "/home/clinic-pharmacy.png", altKey: "clinicPharmacy" as const },
    { src: "/home/clinic-treatment.png", altKey: "clinicTreatment" as const },
    { src: "/home/clinic-lounge.png", altKey: "clinicLounge" as const },
];

export const AboutPage = () => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const bookHref = profile ? "/book" : "/login";

    const metrics = [
        { value: t.aboutMetricHoursValue, label: t.aboutMetricHours },
        { value: t.aboutMetricDoctorsValue, label: t.aboutMetricDoctors },
        { value: t.aboutMetricLocationValue, label: t.aboutMetricLocation },
        { value: t.aboutMetricPortalValue, label: t.aboutMetricPortal },
    ];

    const portalModules = [
        { icon: CalendarCheck01, title: t.featureVisit, body: t.featureVisitBody, share: 92 },
        { icon: File06, title: t.featureRecords, body: t.featureRecordsBody, share: 78 },
        { icon: MedicalCross, title: t.homeNavMedicine, body: t.aboutMedicineBody, share: 65 },
        { icon: Users01, title: t.featureFamily, body: t.featureFamilyBody, share: 54 },
    ];

    const careMix = [
        { label: t.aboutCareGeneral, pct: 45 },
        { label: t.aboutCareScreening, pct: 25 },
        { label: t.aboutCareMental, pct: 18 },
        { label: t.aboutCareAfterHours, pct: 12 },
    ];

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main>
                <section className="mx-auto w-full max-w-container px-4 py-12 md:px-8 md:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <Badge color="brand" size="md">
                                {t.clinicName}
                            </Badge>
                            <h1 className="mt-4 text-display-sm font-semibold text-primary [font-family:var(--font-display)] md:text-display-md">
                                {t.aboutHeroTitle}
                            </h1>
                            <p className="mt-4 text-lg text-tertiary">{t.aboutHeroBody}</p>
                            <p className="mt-3 text-lg text-tertiary">{t.aboutBody}</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Button size="lg" href={bookHref} className="careplus-ink">
                                    {t.bookVisit}
                                </Button>
                                <Button size="lg" color="secondary" href="/doctors">
                                    {t.aboutMeetDoctors}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="col-span-2 overflow-hidden rounded-2xl ring-1 ring-primary/15">
                                <img src={clinicPhotos[0].src} alt={t[clinicPhotos[0].altKey]} className="aspect-[16/10] size-full object-cover" />
                            </div>
                            {clinicPhotos.slice(1, 3).map((photo) => (
                                <div key={photo.src} className="overflow-hidden rounded-2xl ring-1 ring-primary/15">
                                    <img src={photo.src} alt={t[photo.altKey]} className="aspect-square size-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="careplus-panel border-y border-secondary bg-primary py-10 md:py-14">
                    <dl className="mx-auto grid w-full max-w-container grid-cols-2 gap-6 px-4 md:grid-cols-4 md:gap-8 md:px-8">
                        {metrics.map((metric) => (
                            <div key={metric.label}>
                                <dt className="text-sm font-medium text-tertiary">{metric.label}</dt>
                                <dd className="mt-1 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                    {metric.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="mx-auto w-full max-w-container px-4 py-14 md:px-8 md:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                        <div className="overflow-hidden rounded-3xl ring-1 ring-primary/15">
                            <img src="/home/clinic-consult.png" alt={t.clinicConsult} className="aspect-[4/3] size-full object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-brand-secondary">{t.aboutMissionTitle}</p>
                            <h2 className="mt-2 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                {t.tagline}
                            </h2>
                            <p className="mt-4 text-lg text-tertiary">{t.aboutMissionBody}</p>
                            <p className="mt-4 text-lg text-tertiary">{t.footerBlurb}</p>
                        </div>
                    </div>
                </section>

                <section className="careplus-panel bg-primary py-14 md:py-20">
                    <div className="mx-auto w-full max-w-container px-4 md:px-8">
                        <div className="max-w-3xl">
                            <p className="text-sm font-semibold text-brand-secondary">{t.aboutPortalTitle}</p>
                            <h2 className="mt-2 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                {t.featuresTitle}
                            </h2>
                            <p className="mt-3 text-lg text-tertiary">{t.aboutPortalBody}</p>
                        </div>

                        <div className="mt-10 grid gap-4 md:grid-cols-2">
                            {portalModules.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-2xl border border-primary/15 bg-secondary_subtle p-6 ring-1 ring-primary/10"
                                >
                                    <FeaturedIcon icon={item.icon} color="brand" theme="light" size="md" />
                                    <h3 className="mt-4 text-lg font-semibold text-primary">{item.title}</h3>
                                    <p className="mt-2 text-md text-tertiary">{item.body}</p>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                                        <div className="careplus-ink h-full rounded-full" style={{ width: `${item.share}%` }} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-container px-4 py-14 md:px-8 md:py-20">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
                        <div>
                            <p className="text-sm font-semibold text-brand-secondary">{t.aboutTeamTitle}</p>
                            <h2 className="mt-2 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                {t.doctorsTitle}
                            </h2>
                            <p className="mt-3 text-lg text-tertiary">{t.aboutTeamBody}</p>
                            <Button size="md" color="link-color" href="/doctors" className="mt-4">
                                {t.aboutMeetDoctors}
                            </Button>
                        </div>

                        <ul className="space-y-4 rounded-2xl border border-primary/15 bg-primary p-6 ring-1 ring-primary/10">
                            {careMix.map((item) => (
                                <li key={item.label}>
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <span className="font-medium text-primary">{item.label}</span>
                                        <span className="text-tertiary">{item.pct}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                                        <div className="h-full rounded-full bg-brand-solid" style={{ width: `${item.pct}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-container px-4 pb-14 md:px-8 md:pb-20">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold text-brand-secondary">{t.clinicEnvironment}</p>
                        <h2 className="mt-2 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                            {t.aboutGalleryTitle}
                        </h2>
                        <p className="mt-3 text-lg text-tertiary">{t.aboutGalleryBody}</p>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {clinicPhotos.map((photo) => (
                            <figure key={photo.src} className="overflow-hidden rounded-2xl ring-1 ring-primary/15">
                                <img src={photo.src} alt={t[photo.altKey]} className="aspect-[4/5] size-full object-cover" />
                                <figcaption className="border-t border-primary/10 bg-secondary_subtle px-3 py-2 text-xs font-medium text-secondary">
                                    {t[photo.altKey]}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                <section className="px-4 pb-16 md:px-8 md:pb-24">
                    <div className="careplus-ink mx-auto flex w-full max-w-container flex-col gap-6 rounded-[2rem] px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-14">
                        <div className="max-w-xl">
                            <FeaturedIcon icon={HeartHand} color="gray" theme="dark" size="lg" />
                            <h2 className="mt-4 text-display-xs font-semibold text-white md:text-display-sm">{t.aboutCtaTitle}</h2>
                            <p className="mt-3 text-md text-white/72">{t.aboutCtaBody}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button color="secondary" size="lg" href="/register">
                                {t.getStarted}
                            </Button>
                            <Button color="tertiary" size="lg" href="/contact" className="text-white hover:bg-white/10 hover:text-white">
                                {t.aboutVisitContact}
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            <LandingFooter />
        </div>
    );
};
