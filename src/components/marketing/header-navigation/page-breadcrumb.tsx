import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { useI18n, type Copy, type Locale } from "@/providers/locale-provider";
import { getDoctorById, isDoctorId } from "@/utils/doctors";
import { getMedicineCatalog, isMedicineId } from "@/utils/prescribed-medicine";

type Crumb = {
    label: string;
    href?: string;
};

const homeCrumb = (t: Copy): Crumb => ({ label: t.home, href: "/home" });

export const buildCrumbs = (pathname: string, id: string | undefined, t: Copy, locale: Locale, from?: string | null): Crumb[] => {
    if (pathname === "/" || pathname === "/home") return [];

    const home = homeCrumb(t);
    const page: Record<string, string> = {
        "/about": t.aboutUs,
        "/login": t.logIn,
        "/register": t.signUp,
        "/forgot-password": t.forgotTitle,
        "/account": t.account,
        "/book": t.bookTitle,
        "/visits": t.upcomingVisits,
        "/history": t.visitHistory,
        "/records": t.phrTitle,
        "/medicine": t.medTitle,
        "/cart": t.cart,
        "/orders": t.ordersTitle,
        "/clinic-records": t.clinicRecordsTitle,
        "/doctors": t.homeNavDoctors,
        "/contact": t.contactTitle,
        "/chat": t.chatTitle,
        "/notifications": t.notifications,
    };

    if (pathname === "/clinic-records" && from === "history") {
        return [home, { label: t.visitHistory, href: "/history" }, { label: t.clinicRecordsTitle }];
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
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { t, locale } = useI18n();
    const crumbs = buildCrumbs(pathname, id, t, locale, searchParams.get("from"));

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
