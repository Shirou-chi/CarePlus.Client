import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";

export const LandingFooter = () => {
    const { t } = useI18n();
    const columns: { heading: string; links: { label: string; href: string }[] }[] = [
        {
            heading: t.product,
            links: [
                { label: t.home, href: "/home" },
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
            <div className="mx-auto flex w-full max-w-container justify-between border-t border-secondary px-4 py-6 text-sm text-tertiary md:px-8">
                <p>© 2026 CarePlus</p>
                <p>{t.patientSide}</p>
            </div>
        </footer>
    );
};
