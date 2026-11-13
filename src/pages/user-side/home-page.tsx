import { useEffect, useState } from "react";
import {
    ActivityHeart,
    CalendarCheck01,
    CalendarPlus01,
    Clock,
    File06,
    Grid01,
    Mail01,
    MedicalCross,
    Package,
    Receipt,
    Truck01,
    UserSquare,
    Users01,
} from "@untitledui/icons";
import { Link } from "react-router";
import { ClinicCoverflow } from "@/components/marketing/home/clinic-coverflow";
import { PromoCarousel } from "@/components/marketing/home/promo-carousel";
import { ServiceNav } from "@/components/marketing/home/service-nav";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { announcementApi, type ApiAnnouncement } from "@/services/announcementApi";
import { appointmentApi, type Appointment } from "@/services/appointmentApi";

export const HomePage = () => {
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const [nextVisit, setNextVisit] = useState<Appointment | null>(null);
    const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>([]);

    const bookHref = profile ? "/book" : "/login";
    const visitsHref = profile ? "/visits" : "/login";
    const queueHref = profile ? "/queue" : "/login";
    const recordsHref = profile ? "/records" : "/login";
    const clinicRecordsHref = profile ? "/clinic-records" : "/login";
    const medicineHref = profile ? "/medicine" : "/login";
    const ordersHref = profile ? "/orders" : "/login";
    const dispensingHref = profile ? "/dispensing-history" : "/login";
    const invoicesHref = profile ? "/invoices" : "/login";
    const familyHref = profile ? "/family" : "/login";

    useEffect(() => {
        let cancelled = false;
        void announcementApi
            .list()
            .then((rows) => {
                if (!cancelled) setAnnouncements(rows.slice(0, 3));
            })
            .catch(() => {
                if (!cancelled) setAnnouncements([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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

    const exploreItems = [
        { label: t.homeAll, hint: t.homeAllHint, href: "#all", Icon: Grid01, tone: "bg-[#e5e7eb] text-[#374151]" },
        { label: t.homeNavBooking, hint: t.tourBook, href: bookHref, Icon: CalendarPlus01, tone: "bg-[#dbeafe] text-[#1d4ed8]" },
        { label: t.homeNavAppointment, hint: t.tourVisit, href: visitsHref, Icon: CalendarCheck01, tone: "bg-[#d8f4ef] text-[#0f766e]" },
        { label: t.homeNavQueue, hint: t.tourQueue, href: queueHref, Icon: Clock, tone: "bg-[#e0f2fe] text-[#0369a1]" },
        { label: t.homeNavMedicine, hint: t.tourMedicine, href: medicineHref, Icon: MedicalCross, tone: "bg-[#ffe4d6] text-[#c2410c]" },
        { label: t.homeNavFamily, hint: t.tourFamily, href: familyHref, Icon: Users01, tone: "bg-[#ede9fe] text-[#6d28d9]" },
        { label: t.homeNavBill, hint: t.tourBill, href: invoicesHref, Icon: Receipt, tone: "bg-[#fee2e2] text-[#b91c1c]" },
        { label: t.homeNavDoctors, hint: t.tourDoctors, href: "/doctors", Icon: UserSquare, tone: "bg-[#ccfbf1] text-[#0d9488]" },
        { label: t.homeNavContact, hint: t.tourContact, href: "/contact", Icon: Mail01, tone: "bg-[#fef3c7] text-[#b45309]" },
    ];

    // All menu = the shortcuts that used to sit in the "More services" row.
    const allMenuItems = [
        { label: t.visitHistory, hint: t.tourVisit, href: profile ? "/history" : "/login", Icon: Clock, tone: "bg-[#e5e7eb] text-[#374151]" },
        { label: t.ordersTrack, hint: t.tourOrders, href: ordersHref, Icon: Truck01, tone: "bg-[#ffedd5] text-[#c2410c]" },
        { label: t.dispensingTitle, hint: t.tourDispensing, href: dispensingHref, Icon: Package, tone: "bg-[#fce7f3] text-[#be185d]" },
        { label: t.homeNavClinicRecords, hint: t.tourClinicRecords, href: clinicRecordsHref, Icon: File06, tone: "bg-[#e0e7ff] text-[#4338ca]" },
        { label: t.homeNavPhr, hint: t.tourPhr, href: recordsHref, Icon: ActivityHeart, tone: "bg-[#dcfce7] text-[#15803d]" },
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
                <PromoCarousel
                    slides={[
                        { image: "/home/promo-waiting.webp", title: t.promoWaiting, href: profile ? "/book" : "/register" },
                        { image: "/home/promo-family.webp", title: t.promoFamily, href: profile ? "/family" : "/register" },
                        { image: "/home/promo-screening.webp", title: t.promoScreening, href: profile ? "/book" : "/register" },
                        { image: "/home/promo-hours.webp", title: t.promoHours, href: "/announcements" },
                    ]}
                />

                <ServiceNav items={exploreItems} allItems={allMenuItems} />

                <section className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-primary md:text-xl">{t.homeFeaturedVisit}</h2>
                            <p className="mt-1 text-sm text-tertiary">{t.homeFeaturedVisitHint}</p>
                        </div>
                        <Link to={visitsHref} className="shrink-0 text-sm font-semibold text-brand-secondary outline-focus-ring hover:underline focus-visible:outline-2">
                            {t.notifViewAll}
                        </Link>
                    </div>
                    <Link
                        to={nextVisit ? `/queue?appointmentId=${encodeURIComponent(nextVisit.id)}` : bookHref}
                        className="mt-4 flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2 sm:flex-row"
                    >
                        <div className="relative min-h-44 flex-1 bg-[linear-gradient(135deg,#0f766e_0%,#456f75_55%,#0a0a0a_100%)] sm:min-h-52 sm:max-w-sm">
                            <img src="/home/clinic-waiting-room.webp" alt="" className="absolute inset-0 size-full object-cover opacity-55" />
                            <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                {nextVisit ? t.visitsConfirmed : t.bookVisit}
                            </span>
                        </div>
                        <div className="flex flex-1 flex-col justify-center gap-2 p-5 md:p-6">
                            <p className="text-xs font-semibold text-tertiary">{t.visitsNext}</p>
                            <h3 className="text-xl font-semibold text-primary">
                                {nextVisit ? nextVisit.doctorName : t.visitsEmptyTitle}
                            </h3>
                            <p className="text-sm text-tertiary">
                                {nextVisit ? formatVisit(nextVisit.startAt) : t.homeStatusBookHint}
                            </p>
                            <span className="mt-2 w-fit text-sm font-semibold text-brand-secondary">
                                {nextVisit ? t.visitsCheckQueue : t.bookVisit}
                            </span>
                        </div>
                    </Link>
                </section>

                <section className="mx-auto w-full max-w-container px-4 pb-2 md:px-8">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-primary md:text-xl">{t.announcements}</h2>
                            <p className="mt-1 text-sm text-tertiary">{t.announcementsHint}</p>
                        </div>
                        <Link to="/announcements" className="shrink-0 text-sm font-semibold text-brand-secondary outline-focus-ring hover:underline focus-visible:outline-2">
                            {t.notifViewAll}
                        </Link>
                    </div>
                    {announcements.length === 0 ? (
                        <p className="mt-4 rounded-2xl bg-primary px-4 py-6 text-sm text-tertiary ring-1 ring-secondary">{t.announcementsEmpty}</p>
                    ) : (
                        <ul className="mt-4 grid gap-3 md:grid-cols-3">
                            {announcements.map((item) => {
                                const title = locale === "zh" && item.titleZh ? item.titleZh : item.title;
                                const body = locale === "zh" && item.bodyZh ? item.bodyZh : item.body;
                                return (
                                    <li key={item.id} className="rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                                        <p className="text-xs font-semibold text-tertiary">
                                            {new Date(item.postedOn).toLocaleDateString(locale === "zh" ? "zh-MY" : "en-MY", {
                                                day: "numeric",
                                                month: "short",
                                                timeZone: "Asia/Kuala_Lumpur",
                                            })}
                                        </p>
                                        <h3 className="mt-2 line-clamp-2 text-md font-semibold text-primary">{title}</h3>
                                        <p className="mt-2 line-clamp-3 text-sm text-tertiary">{body}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <ClinicCoverflow
                    cards={[
                        { image: "/home/clinic-reception.webp", alt: t.clinicReception },
                        { image: "/home/clinic-waiting-room.webp", alt: t.clinicWaiting },
                        { image: "/home/clinic-examination-room.webp", alt: t.clinicExam },
                        { image: "/home/clinic-corridor.webp", alt: t.clinicCorridor },
                        { image: "/home/clinic-entrance.webp", alt: t.clinicEntrance },
                    ]}
                />
            </main>
            <LandingFooter />
        </div>
    );
};
