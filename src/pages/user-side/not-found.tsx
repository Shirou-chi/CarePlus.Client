import { ArrowLeft } from "@untitledui/icons";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useI18n } from "@/providers/locale-provider";

export function NotFound() {
    const router = useNavigate();
    const { t } = useI18n();

    return (
        <div className="careplus-landing min-h-dvh pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <section className="mx-auto flex w-full max-w-container flex-col gap-10 px-4 py-10 md:min-h-[calc(100dvh-5.5rem)] md:flex-row md:items-center md:gap-16 md:px-8 md:py-16">
                <div className="flex w-full max-w-xl flex-col gap-6 md:gap-8">
                    <div className="flex flex-col gap-3">
                        <span className="text-md font-semibold text-brand-secondary">{t.notFoundEyebrow}</span>
                        <h1 className="text-display-sm font-semibold text-primary [font-family:var(--font-display)] md:text-display-md lg:text-display-lg">
                            {t.notFoundTitle}
                        </h1>
                    </div>
                    <p className="text-lg text-tertiary md:text-xl">{t.notFoundBody}</p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <Button color="secondary" size="lg" iconLeading={ArrowLeft} onClick={() => router(-1)}>
                            {t.notFoundBack}
                        </Button>
                        <Button size="lg" href="/home">
                            {t.notFoundHome}
                        </Button>
                    </div>
                    <p className="text-sm text-quaternary">
                        {t.contactTitle}{" "}
                        <Link to="/contact" className="font-medium text-brand-secondary hover:text-brand-primary">
                            {t.aboutVisitContact}
                        </Link>
                    </p>
                </div>

                <div className="relative min-h-64 flex-1 overflow-hidden rounded-3xl bg-secondary shadow-xs ring-1 ring-secondary md:min-h-[28rem]">
                    <img
                        src="/home/clinic-consult.png"
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent" />
                </div>
            </section>
            <LandingFooter />
        </div>
    );
}
