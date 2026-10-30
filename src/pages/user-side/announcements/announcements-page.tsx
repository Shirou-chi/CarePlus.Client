import { useEffect, useState } from "react";
import { Bell01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { announcementApi } from "@/services/announcementApi";
import type { ClinicAnnouncement } from "@/utils/announcements";

const postedLabel = (isoDate: string, locale: "en" | "zh") =>
    new Date(`${isoDate}T00:00:00+08:00`).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
    });

export const AnnouncementsPage = () => {
    const { t, locale } = useI18n();
    const { profile } = useAuth();
    const [items, setItems] = useState<ClinicAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        void announcementApi
            .list()
            .then((rows) => {
                if (!active) return;
                setItems(
                    rows.map((row) => ({
                        id: row.id,
                        postedOn: row.postedOn,
                        title: locale === "zh" ? row.titleZh || row.title : row.title,
                        body: locale === "zh" ? row.bodyZh || row.body : row.body,
                    })),
                );
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [locale]);

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-10 md:px-8 md:py-16">
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_20rem]">
                    <div>
                        <p className="text-sm font-semibold text-brand-secondary">{t.clinicName}</p>
                        <h1 className="mt-2 text-display-sm font-semibold text-primary [font-family:var(--font-display)]">{t.announcements}</h1>
                        <p className="mt-3 text-lg text-tertiary">{t.announcementsBody}</p>

                        <ul className="mt-10 flex flex-col gap-4">
                            {loading ? <li className="rounded-2xl bg-primary p-5 text-md text-tertiary ring-1 ring-secondary">{t.announcementsLoading}</li> : null}
                            {error ? <li className="rounded-2xl bg-primary p-5 text-md text-error-primary ring-1 ring-secondary">{t.announcementsError}</li> : null}
                            {!loading && !error && items.length === 0 ? (
                                <li className="rounded-2xl bg-primary p-5 text-md text-tertiary ring-1 ring-secondary">{t.announcementsEmpty}</li>
                            ) : null}
                            {!loading && !error
                                ? items.map((item) => (
                                <li id={item.id} key={item.id} className="scroll-mt-28 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                                    <div className="flex items-start gap-4">
                                        <FeaturedIcon icon={Bell01} color="brand" theme="light" size="md" />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge color="gray" size="sm">
                                                    {postedLabel(item.postedOn, locale)}
                                                </Badge>
                                            </div>
                                            <h2 className="mt-2 text-md font-semibold text-primary">{item.title}</h2>
                                            <p className="mt-1 text-md text-tertiary">{item.body}</p>
                                        </div>
                                    </div>
                                </li>
                                ))
                                : null}
                        </ul>
                    </div>

                    <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
                        <div className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                            <p className="text-sm font-semibold text-primary">{t.contactHours}</p>
                            <p className="mt-2 text-md text-secondary">{t.contactHoursValue}</p>
                            <p className="mt-2 text-sm text-tertiary">{t.contactHoursNote}</p>
                        </div>
                        <div className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary">
                            <p className="text-sm font-semibold text-primary">{t.clinic}</p>
                            <ul className="mt-3 flex flex-col gap-2">
                                {(profile
                                    ? [
                                          { label: t.notifications, href: "/notifications" },
                                          { label: t.bookVisit, href: "/book" },
                                          { label: t.upcomingVisits, href: "/visits" },
                                          { label: t.homeNavDoctors, href: "/doctors" },
                                          { label: t.homeNavContact, href: "/contact" },
                                      ]
                                    : [
                                          { label: t.signIn, href: "/login" },
                                          { label: t.homeNavDoctors, href: "/doctors" },
                                          { label: t.aboutUs, href: "/about" },
                                          { label: t.homeNavContact, href: "/contact" },
                                      ]
                                ).map((link) => (
                                    <li key={link.href}>
                                        <Button color="link-gray" size="md" href={link.href}>
                                            {link.label}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-sm text-tertiary">{t.announcementsPrivate}</p>
                    </aside>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
