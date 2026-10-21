import { ActivityHeart, CalendarCheck01, CalendarPlus01, File06, Mail01, MedicalCross, UserSquare, Users01 } from "@untitledui/icons";
import { ClinicCoverflow } from "@/components/marketing/home/clinic-coverflow";
import { PromoCarousel } from "@/components/marketing/home/promo-carousel";
import { ServiceNav } from "@/components/marketing/home/service-nav";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";

export const HomePage = () => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const moduleHref = profile ? "/account" : "/login";
    const bookHref = profile ? "/book" : "/login";
    const visitsHref = profile ? "/visits" : "/login";
    const recordsHref = profile ? "/records" : "/login";
    const clinicRecordsHref = profile ? "/clinic-records" : "/login";
    const medicineHref = profile ? "/medicine" : "/login";

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main>
                <PromoCarousel
                    slides={[
                        { image: "/home/promo-waiting.png", title: t.promoWaiting, href: "/register" },
                        { image: "/home/promo-family.png", title: t.promoFamily, href: "/register" },
                        { image: "/home/promo-screening.png", title: t.promoScreening, href: "/register" },
                        { image: "/home/promo-hours.png", title: t.promoHours, href: "/register" },
                    ]}
                />
                <ServiceNav
                    items={[
                        { label: t.homeNavAppointment, href: visitsHref, Icon: CalendarCheck01, tone: "bg-[#d8f4ef] text-[#0f766e]" },
                        { label: t.homeNavBooking, href: bookHref, Icon: CalendarPlus01, tone: "bg-[#dbeafe] text-[#1d4ed8]" },
                        { label: t.homeNavMedicine, href: medicineHref, Icon: MedicalCross, tone: "bg-[#ffe4d6] text-[#c2410c]" },
                        { label: t.homeNavFamily, href: moduleHref, Icon: Users01, tone: "bg-[#ede9fe] text-[#6d28d9]" },
                        { label: t.homeNavClinicRecords, href: clinicRecordsHref, Icon: File06, tone: "bg-[#e2e8f0] text-[#334155]" },
                        { label: t.homeNavPhr, href: recordsHref, Icon: ActivityHeart, tone: "bg-[#fce7f3] text-[#be185d]" },
                        { label: t.homeNavDoctors, href: "/doctors", Icon: UserSquare, tone: "bg-[#ccfbf1] text-[#0d9488]" },
                        { label: t.homeNavContact, href: "/contact", Icon: Mail01, tone: "bg-[#fef3c7] text-[#b45309]" },
                    ]}
                />
                <ClinicCoverflow
                    cards={[
                        { image: "/home/clinic-reception.png", alt: t.clinicReception },
                        { image: "/home/clinic-consult.png", alt: t.clinicConsult },
                        { image: "/home/clinic-pharmacy.png", alt: t.clinicPharmacy },
                        { image: "/home/clinic-treatment.png", alt: t.clinicTreatment },
                        { image: "/home/clinic-lounge.png", alt: t.clinicLounge },
                    ]}
                />
            </main>
            <LandingFooter />
        </div>
    );
};
