import { Link, useLocation, useNavigationType, useParams, useSearchParams } from "react-router";
import { nextTrail, type TrailAction } from "@/components/marketing/header-navigation/breadcrumb-trail";
import { useAuth } from "@/providers/auth-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n, type Copy, type Locale } from "@/providers/locale-provider";
import { getDoctorById, isDoctorId } from "@/utils/doctors";
import { getMedicineCatalog, isMedicineId } from "@/utils/prescribed-medicine";

type Crumb = {
    label: string;
    href?: string;
};

const homeCrumb = (t: Copy, href: string): Crumb => ({ label: t.home, href });

const TRAIL_KEY = "careplus-crumb-trail";

const readTrail = () => {
    try {
        const parsed = JSON.parse(sessionStorage.getItem(TRAIL_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
        return [];
    }
};

const saveTrail = (next: string[]) => {
    trail = next;
    try {
        sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
    } catch {
        // ponytail: private mode has no sessionStorage; the trail lasts for this page only
    }
};

let trail = readTrail();
let booted = false;

const rememberTrail = (pathname: string, action: TrailAction) => {
    if (!booted) {
        booted = true;
        const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const sameSite = document.referrer.startsWith(window.location.origin);
        const step: TrailAction = entry?.type === "back_forward" || entry?.type === "reload" || !sameSite ? "POP" : "PUSH";
        saveTrail(nextTrail(trail, pathname, step));
        return;
    }
    saveTrail(nextTrail(trail, pathname, action === "POP" && !trail.includes(pathname) ? "PUSH" : action));
};

const crumbLabel = (pathname: string, t: Copy, locale: Locale) => {
    const page: Record<string, string> = {
        "/about": t.aboutUs,
        "/login": t.logIn,
        "/register": t.signUp,
        "/forgot-password": t.forgotTitle,
        "/account": t.account,
        "/book": t.bookTitle,
        "/visits": t.upcomingVisits,
        "/history": t.visitHistory,
        "/invoices": t.invoices,
        "/payments": t.payments,
        "/records": t.phrTitle,
        "/notes": t.notes,
        "/labs": t.labs,
        "/family": t.familyProfiles,
        "/medicine": t.medTitle,
        "/cart": t.cart,
        "/checkout": t.checkoutTitle,
        "/orders": t.ordersTitle,
        "/clinic-records": t.clinicRecordsTitle,
        "/doctors": t.homeNavDoctors,
        "/contact": t.contactTitle,
        "/chat": t.chatTitle,
        "/announcements": t.announcements,
        "/notifications": t.notifications,
    };
    if (page[pathname]) return page[pathname];

    const doctorId = pathname.match(/^\/doctors\/([^/]+)$/)?.[1];
    if (doctorId) {
        const doctor = isDoctorId(doctorId) ? getDoctorById(locale, doctorId) : null;
        return doctor?.name ?? t.homeNavDoctors;
    }

    const medicineId = pathname.match(/^\/medicine\/([^/]+)$/)?.[1];
    if (medicineId) {
        const medicine = isMedicineId(medicineId) ? getMedicineCatalog(locale).find((item) => item.id === medicineId) : undefined;
        return medicine?.name ?? t.medTitle;
    }

    if (/^\/invoices\/[^/]+\/pay$/.test(pathname)) return t.invoicesPayTitle;
    return t.notFoundTitle;
};

export const buildCrumbs = (pathname: string, id: string | undefined, t: Copy, locale: Locale, homeHref: string, from?: string | null, walked: string[] = trail): Crumb[] => {
    if (pathname === "/" || pathname === "/home") return [];

    const home = homeCrumb(t, homeHref);
    if (walked.length > 1) {
        return [
            home,
            ...walked.map((path, index) => ({
                label: crumbLabel(path, t, locale),
                href: index === walked.length - 1 ? undefined : path,
            })),
        ];
    }
    const page: Record<string, string> = {
        "/about": t.aboutUs,
        "/login": t.logIn,
        "/register": t.signUp,
        "/forgot-password": t.forgotTitle,
        "/account": t.account,
        "/book": t.bookTitle,
        "/visits": t.upcomingVisits,
        "/history": t.visitHistory,
        "/invoices": t.invoices,
        "/payments": t.payments,
        "/records": t.phrTitle,
        "/notes": t.notes,
        "/labs": t.labs,
        "/family": t.familyProfiles,
        "/medicine": t.medTitle,
        "/cart": t.cart,
        "/checkout": t.checkoutTitle,
        "/orders": t.ordersTitle,
        "/clinic-records": t.clinicRecordsTitle,
        "/doctors": t.homeNavDoctors,
        "/contact": t.contactTitle,
        "/chat": t.chatTitle,
        "/announcements": t.announcements,
        "/notifications": t.notifications,
    };

    if (/^\/invoices\/[^/]+\/pay$/.test(pathname)) {
        return [home, { label: t.invoices, href: "/invoices" }, { label: t.invoicesPayTitle }];
    }

    if (pathname === "/clinic-records" && from === "history") {
        return [home, { label: t.visitHistory, href: "/history" }, { label: t.clinicRecordsTitle }];
    }

    if (pathname === "/clinic-records" && from === "invoices") {
        return [home, { label: t.invoices, href: "/invoices" }, { label: t.clinicRecordsTitle }];
    }

    if (pathname === "/clinic-records" && from === "payments") {
        return [home, { label: t.payments, href: "/payments" }, { label: t.clinicRecordsTitle }];
    }

    if (pathname === "/clinic-records" && from === "notes") {
        return [home, { label: t.notes, href: "/notes" }, { label: t.clinicRecordsTitle }];
    }

    if (pathname === "/clinic-records" && from === "labs") {
        return [home, { label: t.labs, href: "/labs" }, { label: t.clinicRecordsTitle }];
    }

    if (page[pathname]) return [home, { label: page[pathname] }];

    if (pathname.startsWith("/doctors/")) {
        const doctor = isDoctorId(id) ? getDoctorById(locale, id) : null;
        return doctor
            ? [home, { label: t.homeNavDoctors, href: "/doctors" }, { label: doctor.name }]
            : [home, { label: t.homeNavDoctors }];
    }

    if (pathname.startsWith("/medicine/")) {
        const medicine = isMedicineId(id) ? getMedicineCatalog(locale).find((item) => item.id === id) : undefined;
        return medicine
            ? [home, { label: t.medTitle, href: "/medicine" }, { label: medicine.name }]
            : [home, { label: t.medTitle }];
    }

    return [home, { label: t.notFoundTitle }];
};

export const PageBreadcrumb = ({ contained = true }: { contained?: boolean }) => {
    const { pathname } = useLocation();
    const action = useNavigationType();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    useMedicineCatalog();
    rememberTrail(pathname, action);
    const crumbs = buildCrumbs(pathname, id, t, locale, profile ? "/home" : "/", searchParams.get("from"), trail);

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label={t.breadcrumb} className={contained ? "mx-auto w-full min-w-0 max-w-container px-4 pt-4 md:px-8" : "mb-4 min-w-0"}>
            <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {crumbs.map((crumb, index) => {
                    const last = index === crumbs.length - 1;
                    return (
                        <li key={`${crumb.href ?? "here"}-${index}`} className="flex min-w-0 items-center gap-2">
                            {index > 0 ? (
                                <span aria-hidden="true" className="text-quaternary">
                                    &gt;
                                </span>
                            ) : null}
                            {last || !crumb.href ? (
                                <span className="truncate font-medium text-primary" aria-current={last ? "page" : undefined}>
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link to={crumb.href} className="font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2">
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
