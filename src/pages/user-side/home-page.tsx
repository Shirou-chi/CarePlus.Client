import { useEffect, useState } from "react";
import { CalendarCheck01, CalendarPlus01, Clock, MedicalCross, Receipt } from "@untitledui/icons";
import { Link } from "react-router";
import { ClinicCoverflow } from "@/components/marketing/home/clinic-coverflow";
import { PromoCarousel } from "@/components/marketing/home/promo-carousel";
import { ServiceNav } from "@/components/marketing/home/service-nav";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { useI18n } from "@/providers/locale-provider";
import { appointmentApi, type Appointment } from "@/services/appointmentApi";

export const HomePage = () => {
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const { invoices, overdue } = useOutstandingInvoices();
    const [nextVisit, setNextVisit] = useState<Appointment | null>(null);

    useEffect(() => {
        if (!profile) {
            setNextVisit(null);
            return;
        }
        let cancelled = false;
        void appointmentApi
            .upcoming()
            .then((rows) => {
                if (!cancelled) setNextVisit(rows[0] ?? null);
            })
            .catch(() => {
                if (!cancelled) setNextVisit(null);
            });
        return () => {
            cancelled = true;
        };
    }, [profile?.id]);

    const bookHref = profile ? "/book" : "/login";
    const visitsHref = profile ? "/visits" : "/login";
    const queueHref = profile ? "/queue" : "/login";
    const medicineHref = profile ? "/medicine" : "/login";
    const invoicesHref = profile ? "/invoices" : "/login";
    const dueTotal = invoices.reduce((sum, row) => sum + row.amountDue, 0);

    const primaryNav = [
        { label: t.homeNavBooking, hint: t.tourBook, href: bookHref, Icon: CalendarPlus01, tone: "bg-[#dbeafe] text-[#1d4ed8]" },
        { label: t.homeNavAppointment, hint: t.tourVisit, href: visitsHref, Icon: CalendarCheck01, tone: "bg-[#d8f4ef] text-[#0f766e]" },
        { label: t.homeNavQueue, hint: t.tourQueue, href: queueHref, Icon: Clock, tone: "bg-[#e0f2fe] text-[#0369a1]" },
        { label: t.homeNavBill, hint: t.tourBill, href: invoicesHref, Icon: Receipt, tone: "bg-[#fee2e2] text-[#b91c1c]" },
        { label: t.homeNavMedicine, hint: t.tourMedicine, href: medicineHref, Icon: MedicalCross, tone: "bg-[#ffe4d6] text-[#c2410c]" },
    ];

    const formatVisit = (iso: string) =>
        new Date(iso).toLocaleString(locale === "zh" ? "zh-MY" : "en-MY", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
        });

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main>
                {profile ? (
                    <section className="mx-auto w-full max-w-container px-4 pt-6 md:px-8 md:pt-8">
                        <h2 className="text-lg font-bold text-primary md:text-xl">{t.homeStatusTitle}</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <Link
                                to={nextVisit ? `/queue?appointmentId=${encodeURIComponent(nextVisit.id)}` : visitsHref}
                                className="rounded-2xl bg-primary p-4 ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
                            >
                                <p className="text-xs font-semibold text-tertiary">{t.visitsNext}</p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {nextVisit ? formatVisit(nextVisit.startAt) : t.visitsEmptyTitle}
                                </p>
                                <p className="mt-1 truncate text-xs text-tertiary">{nextVisit ? nextVisit.doctorName : t.homeStatusBookHint}</p>
                            </Link>
                            <Link
                                to={queueHref}
                                className="rounded-2xl bg-primary p-4 ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
                            >
                                <p className="text-xs font-semibold text-tertiary">{t.homeNavQueue}</p>
                                <p className="mt-1 text-sm font-semibold text-primary">{t.homeStatusQueueHint}</p>
                            </Link>
                            <Link
                                to={invoicesHref}
                                className="rounded-2xl bg-primary p-4 ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
                            >
                                <p className="text-xs font-semibold text-tertiary">{overdue ? t.invoicesOverdue : t.invoicesTotalDue}</p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {dueTotal > 0 ? `RM ${dueTotal.toFixed(2)}` : t.invoicesEmptyTitle}
                                </p>
                            </Link>
                        </div>
                    </section>
                ) : (
                    <PromoCarousel
                        slides={[
                            { image: "/home/promo-waiting.webp", title: t.promoWaiting, href: "/register" },
                            { image: "/home/promo-family.webp", title: t.promoFamily, href: "/register" },
                            { image: "/home/promo-screening.webp", title: t.promoScreening, href: "/register" },
                            { image: "/home/promo-hours.webp", title: t.promoHours, href: "/register" },
                        ]}
                    />
                )}
                <ServiceNav items={primaryNav} />
                {profile ? null : (
                    <ClinicCoverflow
                        cards={[
                            { image: "/home/clinic-reception.webp", alt: t.clinicReception },
                            { image: "/home/clinic-waiting-room.webp", alt: t.clinicWaiting },
                            { image: "/home/clinic-examination-room.webp", alt: t.clinicExam },
                            { image: "/home/clinic-corridor.webp", alt: t.clinicCorridor },
                            { image: "/home/clinic-entrance.webp", alt: t.clinicEntrance },
                        ]}
                    />
                )}
            </main>
            <LandingFooter />
        </div>
    );
};
