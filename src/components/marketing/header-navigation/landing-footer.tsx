import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { Button } from "@/components/base/buttons/button";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";

export const LandingFooter = () => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const columns: { heading: string; links: { label: string; href: string }[] }[] = profile
        ? [
              {
                  heading: t.product,
                  links: [
                      { label: t.home, href: "/home" },
                      { label: t.bookVisit, href: "/book" },
                      { label: t.upcomingVisits, href: "/visits" },
                      { label: t.visitHistory, href: "/history" },
                      { label: t.medTitle, href: "/medicine" },
                  ],
              },
              {
                  heading: t.account,
                  links: [
                      { label: t.viewProfile, href: "/account" },
                      { label: t.notifications, href: "/notifications" },
                      { label: t.familyProfiles, href: "/family" },
                      { label: t.phrTitle, href: "/records" },
                      { label: t.invoices, href: "/invoices" },
                  ],
              },
              {
                  heading: t.clinic,
                  links: [
                      { label: t.announcements, href: "/announcements" },
                      { label: t.aboutUs, href: "/about" },
                      { label: t.homeNavDoctors, href: "/doctors" },
                      { label: t.homeNavContact, href: "/contact" },
                  ],
              },
          ]
        : [
              {
                  heading: t.product,
                  links: [
                      { label: t.home, href: "/" },
                      { label: t.features, href: "/#features" },
                      { label: t.howItWorks, href: "/#how-it-works" },
                  ],
              },
              {
                  heading: t.account,
                  links: [
                      { label: t.logIn, href: "/login" },
                      { label: t.register, href: "/register" },
                  ],
              },
              {
                  heading: t.clinic,
                  links: [
                      { label: t.announcements, href: "/announcements" },
                      { label: t.aboutUs, href: "/about" },
                      { label: t.homeNavDoctors, href: "/doctors" },
                      { label: t.homeNavContact, href: "/contact" },
                  ],
              },
          ];

    return (
        <footer className="careplus-panel border-t border-secondary bg-primary dark:border-white/10">
            <div className="mx-auto grid w-full max-w-container gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-8 md:px-8 md:py-16">
                <div className="max-w-sm">
                    <CarePlusLogo />
                    <p className="mt-4 text-md text-tertiary">{t.footerBlurb}</p>
                </div>
                {columns.map((column) => (
                    <div key={column.heading}>
                        <p className="text-sm font-semibold text-primary">{column.heading}</p>
                        <ul className="mt-4 flex flex-col gap-3">
                            {column.links.map((link) => (
                                <li key={link.label}>
                                    <Button color="link-gray" href={link.href} size="md">
                                        {link.label}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-secondary px-4 py-6 text-center text-sm text-tertiary">
                <p>© 2026 CarePlus</p>
            </div>
        </footer>
    );
};
