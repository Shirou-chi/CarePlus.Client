import { type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, CalendarCheck01, File06, HeartHand, Mail01, ShieldTick } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export const LandingPage = () => {
    const navigate = useNavigate();

    const startWithEmail = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
        navigate(email ? `/register?email=${encodeURIComponent(email)}` : "/register");
    };

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden scroll-smooth pt-[4.5rem] text-primary md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />

            <main>
                <Hero startWithEmail={startWithEmail} />
                <Features />
                <HowItWorks />
                <AtHome />
                <PatientPaths />
                <FinalCta />
            </main>

            <LandingFooter />
        </div>
    );
};

/* ponytail: footer lives in landing-footer.tsx so auth pages can reuse it. */

const Hero = ({ startWithEmail }: { startWithEmail: (event: FormEvent<HTMLFormElement>) => void }) => {
    const { t } = useI18n();

    return (
        <section className="mx-auto grid w-full max-w-container items-center gap-12 px-4 pt-10 pb-16 md:gap-16 md:px-8 md:pt-16 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-20">
            <div className="max-w-xl">
                <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-lg">{t.heroTitle}</h1>
                <p className="mt-5 max-w-lg text-lg text-tertiary md:mt-6 md:text-xl">{t.heroBody}</p>

                <form id="get-started" onSubmit={startWithEmail} className="mt-8 max-w-md scroll-mt-28">
                    <InputGroup
                        name="email"
                        type="email"
                        size="md"
                        isRequired
                        aria-label={t.email}
                        trailingAddon={
                            <Button type="submit" size="md" className="careplus-ink">
                                {t.getStarted}
                            </Button>
                        }
                    >
                        <InputBase placeholder={t.emailPlaceholder} icon={Mail01} autoComplete="email" />
                    </InputGroup>
                    <p className="mt-2.5 text-sm text-tertiary">{t.heroHint}</p>
                </form>

                <p className="mt-10 text-sm font-medium text-tertiary">{t.comingAfter}</p>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {t.modules.map((label) => (
                        <li key={label} className="text-md font-semibold text-quaternary">
                            {label}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(118,226,235,0.35),transparent_68%)]" />
                <HeroVisitScene />
            </div>
        </section>
    );
};

const DeviceFrame = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div
            className={cx(
                "rounded-[20px] bg-primary p-0.5 shadow-modern-mockup-outer-lg ring-1 ring-utility-neutral-300 ring-inset",
                className,
            )}
        >
            <div className="rounded-[17px] bg-primary p-[3.5px] shadow-modern-mockup-inner-lg">
                <div className="overflow-hidden rounded-[15px] ring-1 ring-utility-neutral-200">{children}</div>
            </div>
        </div>
    );
};

const HeroVisitScene = () => {
    const { t } = useI18n();

    return (
        <div className="careplus-hero-scene relative mx-auto aspect-[5/4] w-full max-w-lg">
            <DeviceFrame className="absolute inset-x-6 top-8 z-10 sm:inset-x-10">
                <div className="bg-primary px-5 py-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-tertiary">{t.upcomingVisit}</p>
                        <Badge color="brand" size="sm">
                            {t.sample}
                        </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <Avatar size="lg" initials="AL" />
                        <div>
                            <p className="text-lg font-semibold text-primary">Dr Aisha Lim</p>
                            <p className="text-sm text-tertiary">{t.gpRoom}</p>
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-secondary px-4 py-3">
                        <div>
                            <p className="text-xs font-medium text-tertiary">{t.date}</p>
                            <p className="mt-0.5 text-md font-semibold text-primary">Tue, 8 Sep</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-tertiary">{t.time}</p>
                            <p className="mt-0.5 text-md font-semibold text-primary">10:30 am</p>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-tertiary">{t.visitNote}</p>
                </div>
            </DeviceFrame>

            <DeviceFrame className="absolute top-0 right-0 z-20 w-[11.5rem] rotate-3">
                <div className="bg-primary px-3.5 py-3">
                    <p className="text-xs font-medium text-tertiary">{t.nextReminder}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{t.tomorrow}</p>
                </div>
            </DeviceFrame>

            <DeviceFrame className="absolute bottom-2 left-0 z-20 w-[13rem] -rotate-2">
                <div className="flex items-center gap-2.5 bg-primary px-3.5 py-3">
                    <FeaturedIcon icon={ShieldTick} size="sm" color="brand" theme="light" />
                    <div>
                        <p className="text-sm font-semibold text-primary">{t.profileSaved}</p>
                        <p className="text-xs text-tertiary">{t.profileSavedHint}</p>
                    </div>
                </div>
            </DeviceFrame>
        </div>
    );
};

const Features = () => {
    const { t } = useI18n();
    const items = [
        { icon: CalendarCheck01, title: t.featureVisit, body: t.featureVisitBody },
        { icon: File06, title: t.featureRecords, body: t.featureRecordsBody },
        { icon: HeartHand, title: t.featureFamily, body: t.featureFamilyBody },
    ];

    return (
        <section id="features" className="careplus-panel scroll-mt-24 bg-primary py-16 md:py-24">
            <div className="mx-auto grid w-full max-w-container gap-10 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] md:items-end md:gap-16 md:px-8">
                <h2 className="text-display-sm font-semibold text-primary md:text-display-md">{t.featuresTitle}</h2>
                <p className="text-lg text-tertiary">{t.featuresBody}</p>
            </div>

            <div className="mx-auto mt-12 grid w-full max-w-container gap-4 px-4 md:mt-16 md:grid-cols-3 md:gap-6 md:px-8">
                {items.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-3xl bg-[#0b2036] p-8 shadow-xs ring-1 ring-white/10 [background-image:var(--careplus-ink)] md:p-10 dark:bg-white dark:[background-image:none] dark:ring-black/[0.06]"
                    >
                        <FeaturedIcon icon={item.icon} size="lg" color="brand" theme="light" />
                        <h3 className="mt-5 text-lg font-semibold text-white dark:text-[#0b1f38]">{item.title}</h3>
                        <p className="mt-2 text-md text-white/72 dark:text-[#456f75]">{item.body}</p>
                    </article>
                ))}
            </div>
        </section>
    );
};

const HowItWorks = () => {
    const { t } = useI18n();
    const steps = [
        { n: "1", title: t.step1, body: t.step1Body },
        { n: "2", title: t.step2, body: t.step2Body },
        { n: "3", title: t.step3, body: t.step3Body },
    ];

    return (
        <section id="how-it-works" className="careplus-ink scroll-mt-24 py-16 text-white md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <h2 className="max-w-2xl text-display-sm font-semibold text-white md:text-display-md">{t.stepsTitle}</h2>
                <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
                    {steps.map((step) => (
                        <article key={step.n} className="relative overflow-hidden rounded-3xl bg-primary p-8 pt-10 shadow-xs ring-1 ring-secondary md:p-10">
                            <span className="pointer-events-none absolute -top-3 left-6 text-[7rem] leading-none font-semibold text-primary/10">
                                {step.n}
                            </span>
                            <h3 className="relative text-lg font-semibold text-primary">{step.title}</h3>
                            <p className="relative mt-3 text-md text-tertiary">{step.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AtHome = () => {
    const { t } = useI18n();
    const facts = [
        { title: t.register, body: t.registerHint },
        { title: t.logIn, body: t.logInHint },
        { title: t.reset, body: t.resetHint },
    ];

    return (
        <section className="careplus-panel py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 text-center md:px-8">
                <h2 className="text-display-sm font-semibold text-primary md:text-display-md">{t.startTitle}</h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-tertiary">{t.startBody}</p>
                <dl className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3 md:mt-16">
                    {facts.map((fact) => (
                        <div
                            key={fact.title}
                            className="rounded-3xl bg-[#0b2036] p-8 shadow-xs ring-1 ring-white/10 [background-image:var(--careplus-ink)] md:p-10 dark:bg-white dark:[background-image:none] dark:ring-black/[0.06]"
                        >
                            <dt className="text-display-sm font-semibold text-white dark:text-[#0b1f38]">{fact.title}</dt>
                            <dd className="mt-2 text-md text-white/72 dark:text-[#456f75]">{fact.body}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
};

const PatientPaths = () => {
    const { t } = useI18n();

    return (
        <section id="for-patients" className="scroll-mt-24 pb-8 md:pb-12">
            <div className="mx-auto grid w-full max-w-container gap-4 px-4 md:grid-cols-2 md:px-8">
                <a
                    href="/register"
                    className="group flex items-end justify-between rounded-3xl bg-primary p-8 shadow-xs ring-1 ring-secondary outline-focus-ring transition hover:bg-[#456f75]/12 focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-56 md:p-10 dark:bg-white dark:ring-black/[0.06] dark:hover:bg-[#eef8fb]"
                >
                    <div>
                        <p className="text-sm font-semibold text-tertiary dark:text-[#456f75]">{t.newHere}</p>
                        <h3 className="mt-2 text-display-xs font-semibold text-primary dark:text-[#0b1f38]">{t.createYourAccount}</h3>
                        <p className="mt-2 max-w-xs text-md text-tertiary dark:text-[#456f75]">{t.freeReg}</p>
                    </div>
                    <span className="careplus-ink flex size-12 items-center justify-center rounded-full text-white transition group-hover:brightness-125">
                        <ArrowRight className="size-5" />
                    </span>
                </a>

                <a
                    href="/login"
                    className="group flex items-end justify-between rounded-3xl bg-[#040f1c] p-8 text-white shadow-xs outline-focus-ring transition [background-image:var(--careplus-ink)] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 md:min-h-56 md:p-10 dark:bg-white dark:[background-image:none] dark:text-[#0b1f38] dark:ring-1 dark:ring-black/[0.06] dark:hover:bg-[#eef8fb] dark:hover:brightness-100"
                >
                    <div>
                        <p className="text-sm font-semibold text-white/70 dark:text-[#456f75]">{t.already}</p>
                        <h3 className="mt-2 text-display-xs font-semibold text-white dark:text-[#0b1f38]">{t.signIn}</h3>
                        <p className="mt-2 max-w-xs text-md text-white/72 dark:text-[#456f75]">{t.sameEmail}</p>
                    </div>
                    <span className="flex size-12 items-center justify-center rounded-full bg-white text-[#0b1f38] transition group-hover:bg-brand-50 dark:bg-[#0b1f38] dark:text-white dark:group-hover:bg-[#122b4b]">
                        <ArrowRight className="size-5" />
                    </span>
                </a>
            </div>
        </section>
    );
};

const FinalCta = () => {
    const { t } = useI18n();

    return (
        <section className="px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto flex w-full max-w-container flex-col gap-6 rounded-[2rem] bg-[#040f1c] px-8 py-10 [background-image:var(--careplus-ink)] md:flex-row md:items-center md:justify-between md:px-12 md:py-14 dark:bg-white dark:shadow-lg dark:[background-image:none]">
                <div className="max-w-xl">
                    <h2 className="text-display-sm font-semibold text-white dark:text-[#0b1f38]">{t.ctaTitle}</h2>
                    <p className="mt-3 text-md text-white/72 dark:text-[#456f75]">{t.ctaBody}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="/register"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-2.5 text-md font-semibold text-[#0b1f38] shadow-xs outline-focus-ring transition duration-150 hover:bg-[#456f75] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-[#0b1f38] dark:text-white dark:hover:bg-[#456f75]"
                    >
                        {t.getStarted}
                    </a>
                    <a
                        href="/login"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-md font-semibold text-white ring-1 ring-white/80 outline-focus-ring transition duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-[#0b1f38] dark:ring-[#0b1f38]/30 dark:hover:bg-[#0b1f38]/5"
                    >
                        {t.logIn}
                    </a>
                </div>
            </div>
        </section>
    );
};

