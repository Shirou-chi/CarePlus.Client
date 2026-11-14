import { type ReactNode, useEffect, useState } from "react";
import { Heading } from "react-aria-components";
import {
    ArrowRight,
    CalendarCheck01,
    Check,
    DotsVertical,
    Download01,
    MedicalCross,
    Moon01,
    Phone01,
    Share07,
    ShieldTick,
    ShoppingCart01,
    Sun,
    Truck01,
    Users01,
} from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useI18n } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

export const LandingPage = () => {
    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden scroll-smooth pt-[4.5rem] text-primary md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />

            <main>
                <Hero />
                <BookingSteps />
                <MedicineSteps />
                <FamilySteps />
                <PhoneHome />
                <FinalCta />
            </main>

            <LandingFooter />
        </div>
    );
};

/* ponytail: footer lives in landing-footer.tsx so auth pages can reuse it. */

const Hero = () => {
    const { t } = useI18n();

    return (
        <section className="mx-auto grid w-full max-w-container items-center gap-12 px-4 pt-10 pb-16 md:gap-16 md:px-8 md:pt-16 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-20">
            <div className="max-w-xl">
                <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-lg">{t.heroTitle}</h1>
                <p className="mt-5 max-w-lg text-lg text-tertiary md:mt-6 md:text-xl">{t.heroBody}</p>

                <a
                    href="/register"
                    className="careplus-ink mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-md font-semibold text-white shadow-xs outline-focus-ring transition duration-150 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {t.createFreeAccount}
                    <ArrowRight className="size-5" aria-hidden />
                </a>

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

const chip = "rounded-xl bg-primary px-3 py-2 shadow-xs ring-1 ring-secondary";

const SelectedTick = () => (
    <span className="careplus-ink ml-auto flex size-5 shrink-0 items-center justify-center rounded-full text-white">
        <Check className="size-3" aria-hidden />
    </span>
);

type Step = { title: string; body: string; visual: ReactNode };

const StepProcess = ({
    id,
    eyebrow,
    title,
    body,
    steps,
    columns = "lg:grid-cols-4",
}: {
    id: string;
    eyebrow: string;
    title: string;
    body: string;
    steps: Step[];
    columns?: string;
}) => {
    const { t } = useI18n();

    return (
        <section id={id} className="scroll-mt-24 py-16 md:py-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-secondary ring-1 ring-secondary">
                    <span className="size-1.5 rounded-full bg-fg-primary" aria-hidden />
                    {eyebrow}
                </span>
                <h2 className="mt-4 max-w-xl text-display-sm font-semibold text-primary md:text-display-md">{title}</h2>
                <p className="mt-4 max-w-2xl text-lg text-tertiary">{body}</p>

                <ol className={cx("mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:gap-6", columns)}>
                    {steps.map((step, index) => (
                        <li key={step.title} className="flex flex-col overflow-hidden rounded-3xl bg-primary shadow-xs ring-1 ring-secondary">
                            <div
                                aria-hidden
                                className="flex min-h-40 items-center justify-center bg-secondary_alt px-6 py-8 [background-image:radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [background-size:14px_14px]"
                            >
                                {step.visual}
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-medium text-tertiary">
                                    {t.stepLabel} {index + 1}
                                </p>
                                <h3 className="mt-2 text-lg font-semibold text-primary">{step.title}</h3>
                                <p className="mt-2 text-md text-tertiary">{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

const BookingSteps = () => {
    const { t } = useI18n();
    const steps: Step[] = [
        {
            title: t.step1,
            body: t.step1Body,
            visual: (
                <div className="flex w-full max-w-56 flex-col gap-2">
                    <div className={cx(chip, "flex items-center gap-2.5")}>
                        <Avatar size="xs" initials="ME" />
                        <span className="text-sm font-semibold text-primary">{t.stepVisualMe}</span>
                        <SelectedTick />
                    </div>
                    <div className={cx(chip, "flex items-center gap-2.5 opacity-70")}>
                        <Avatar size="xs" initials="FM" />
                        <span className="text-sm font-medium text-secondary">{t.stepVisualFamily}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t.step2,
            body: t.step2Body,
            visual: (
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-tertiary">Tue, 8 Sep</span>
                    <div className="flex gap-2">
                        {["9:00 am", "10:30 am", "11:00 am"].map((slot) => (
                            <span
                                key={slot}
                                className={cx(
                                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                                    slot === "10:30 am" ? "careplus-ink text-white" : "bg-primary text-secondary ring-1 ring-secondary",
                                )}
                            >
                                {slot}
                            </span>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            title: t.step3,
            body: t.step3Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-72 items-center gap-3 py-2.5")}>
                    <Avatar size="sm" initials="AL" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">Dr Aisha Lim</p>
                        <p className="truncate text-xs text-tertiary">{t.gpRoom}</p>
                    </div>
                    <SelectedTick />
                </div>
            ),
        },
        {
            title: t.step4,
            body: t.step4Body,
            visual: (
                <div className="flex w-full max-w-56 flex-col gap-2">
                    <div className={cx(chip, "flex items-center gap-2.5")}>
                        <span className="truncate text-sm font-semibold text-primary">{t.visitGeneral}</span>
                        <SelectedTick />
                    </div>
                    <div className={cx(chip, "flex items-center gap-2.5 opacity-70")}>
                        <span className="truncate text-sm font-medium text-secondary">{t.visitScreening}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t.step5,
            body: t.step5Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-72 items-center gap-3 py-2.5")}>
                    <FeaturedIcon icon={CalendarCheck01} size="sm" color="success" theme="light" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{t.stepVisualBooked}</p>
                        <p className="truncate text-xs text-tertiary">Tue, 8 Sep · 10:30 am</p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <StepProcess
            id="how-it-works"
            eyebrow={t.howEyebrow}
            title={t.stepsTitle}
            body={t.stepsBody}
            steps={steps}
            columns="lg:grid-cols-3"
        />
    );
};

const MedicineSteps = () => {
    const { t } = useI18n();
    const steps: Step[] = [
        {
            title: t.medStep1,
            body: t.medStep1Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 items-center gap-3 py-2.5")}>
                    <FeaturedIcon icon={MedicalCross} size="sm" color="brand" theme="light" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{t.medStepVisualBrowse}</p>
                        <p className="truncate text-xs text-tertiary">{t.homeNavMedicine}</p>
                    </div>
                </div>
            ),
        },
        {
            title: t.medStep2,
            body: t.medStep2Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 items-center gap-3 py-2.5")}>
                    <FeaturedIcon icon={ShoppingCart01} size="sm" color="brand" theme="light" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">{t.medStepVisualCart}</p>
                        <p className="truncate text-xs text-tertiary">2 × Amoxicillin</p>
                    </div>
                    <SelectedTick />
                </div>
            ),
        },
        {
            title: t.medStep3,
            body: t.medStep3Body,
            visual: (
                <div className="flex w-full max-w-56 flex-col gap-2">
                    <div className={cx(chip, "flex items-center gap-2.5")}>
                        <span className="truncate text-sm font-semibold text-primary">{t.medCartPickup}</span>
                        <SelectedTick />
                    </div>
                    <div className={cx(chip, "flex items-center gap-2.5 opacity-70")}>
                        <span className="truncate text-sm font-medium text-secondary">{t.medCartDelivery}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t.medStep4,
            body: t.medStep4Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 items-center gap-3 py-2.5")}>
                    <FeaturedIcon icon={Truck01} size="sm" color="success" theme="light" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{t.medStepVisualTrack}</p>
                        <p className="truncate text-xs text-tertiary">{t.ordersTrack}</p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <StepProcess
            id="medicine"
            eyebrow={t.medHowEyebrow}
            title={t.medStepsTitle}
            body={t.medStepsBody}
            steps={steps}
        />
    );
};

const FamilySteps = () => {
    const { t } = useI18n();
    const steps: Step[] = [
        {
            title: t.famStep1,
            body: t.famStep1Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 flex-col gap-1.5 py-2.5")}>
                    <p className="text-xs font-medium text-tertiary">{t.email}</p>
                    <p className="truncate text-sm font-semibold text-primary">parent@email.com</p>
                </div>
            ),
        },
        {
            title: t.famStep2,
            body: t.famStep2Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 items-center gap-3 py-2.5")}>
                    <Avatar size="sm" initials="FM" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">{t.famStepVisualAccept}</p>
                        <p className="truncate text-xs text-tertiary">{t.familyInvite}</p>
                    </div>
                    <SelectedTick />
                </div>
            ),
        },
        {
            title: t.famStep3,
            body: t.famStep3Body,
            visual: (
                <div className="flex w-full max-w-56 flex-col gap-2">
                    <div className={cx(chip, "flex items-center gap-2.5")}>
                        <span className="truncate text-sm font-semibold text-primary">{t.famStepVisualParent}</span>
                        <SelectedTick />
                    </div>
                    <div className={cx(chip, "flex items-center gap-2.5 opacity-70")}>
                        <span className="truncate text-sm font-medium text-secondary">{t.famStepVisualChild}</span>
                    </div>
                </div>
            ),
        },
        {
            title: t.famStep4,
            body: t.famStep4Body,
            visual: (
                <div className={cx(chip, "flex w-full max-w-60 items-center gap-3 py-2.5")}>
                    <FeaturedIcon icon={Users01} size="sm" color="success" theme="light" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{t.famStepVisualBook}</p>
                        <p className="truncate text-xs text-tertiary">{t.stepVisualFamily}</p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <StepProcess
            id="family"
            eyebrow={t.famHowEyebrow}
            title={t.famStepsTitle}
            body={t.famStepsBody}
            steps={steps}
        />
    );
};

const isIosDevice = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    // iPadOS 13+ often reports as MacIntel with touch
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
};

const detectPhonePlatform = (): "ios" | "android" => (isIosDevice() ? "ios" : "android");

const PhoneHome = () => {
    const { t } = useI18n();
    const { theme, setTheme, textSize, setTextSize } = useTheme();
    const [howOpen, setHowOpen] = useState(false);
    const [platform, setPlatform] = useState<"ios" | "android">(detectPhonePlatform);
    const previewDark = theme === "dark";
    const previewLarge = textSize === "large";
    const points = [t.phoneHomePointTheme, t.phoneHomePointTextSize, t.phoneHomePointTabs, t.phoneHomePointFullscreen];
    const steps =
        platform === "ios"
            ? [
                  { text: t.phoneHomeIosStep1, Icon: Share07 },
                  { text: t.phoneHomeIosStep2, Icon: Download01 },
                  { text: t.phoneHomeIosStep3, Icon: Check },
              ]
            : [
                  { text: t.phoneHomeAndroidStep1, Icon: DotsVertical },
                  { text: t.phoneHomeAndroidStep2, Icon: Download01 },
                  { text: t.phoneHomeAndroidStep3, Icon: Check },
              ];

    useEffect(() => {
        setPlatform(detectPhonePlatform());
    }, []);

    const openHow = () => {
        setPlatform(detectPhonePlatform());
        setHowOpen(true);
    };

    return (
        <section id="on-your-phone" className="scroll-mt-24 px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto grid w-full max-w-container overflow-hidden rounded-[2rem] bg-primary shadow-xs ring-1 ring-secondary lg:grid-cols-2">
                <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-secondary ring-1 ring-secondary">
                        <span className="size-1.5 rounded-full bg-fg-primary" aria-hidden />
                        {t.phoneHomeEyebrow}
                    </span>
                    <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">{t.phoneHomeTitle}</h2>
                    <p className="mt-4 max-w-md text-lg text-tertiary">{t.phoneHomeBody}</p>
                    <ul className="mt-6 flex flex-col gap-3">
                        {points.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-md text-secondary">
                                <span className="careplus-ink mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
                                    <Check className="size-3" aria-hidden />
                                </span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                    <Button color="secondary" size="md" iconLeading={Phone01} className="mt-8 w-fit" onClick={openHow}>
                        {t.phoneHomeHow}
                    </Button>
                </div>

                <div className="flex items-center justify-center bg-secondary_alt p-8 [background-image:radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [background-size:14px_14px] md:p-10 lg:p-12">
                    <div className="w-full max-w-sm rounded-3xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                        <div className="grid grid-cols-2 gap-3" aria-hidden>
                            <PhonePreview label={t.sheetLight} dark={false} active={!previewDark} large={previewLarge} />
                            <PhonePreview label={t.sheetDark} dark active={previewDark} large={previewLarge} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="group" aria-label={t.settingsAppearance}>
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={cx(
                                    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                    !previewDark ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                <Sun className="size-4" />
                                {t.sheetLight}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={cx(
                                    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                    previewDark ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                <Moon01 className="size-4" />
                                {t.sheetDark}
                            </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="group" aria-label={t.settingsTextSize}>
                            <button
                                type="button"
                                onClick={() => setTextSize("normal")}
                                className={cx(
                                    "inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 font-semibold outline-focus-ring focus-visible:outline-2",
                                    !previewLarge ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                <span aria-hidden className="text-sm leading-none">A</span>
                                <span className="sr-only"> {t.settingsTextSizeNormal}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextSize("large")}
                                className={cx(
                                    "inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 font-semibold outline-focus-ring focus-visible:outline-2",
                                    previewLarge ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                <span aria-hidden className="text-lg leading-none">A</span>
                                <span className="sr-only"> {t.settingsTextSizeLarge}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ModalOverlay isDismissable isOpen={howOpen} onOpenChange={setHowOpen}>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden dark:bg-[#0a0a0a]">
                        <Heading slot="title" className="text-center text-lg font-semibold text-primary">
                            {t.phoneHomeHowTitle}
                        </Heading>
                        <p className="mt-2 text-center text-sm text-tertiary">{t.phoneHomeHowSubtitle}</p>

                        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1" role="tablist" aria-label="Phone platform">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={platform === "ios"}
                                className={cx(
                                    "rounded-lg px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                    platform === "ios" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                                onClick={() => setPlatform("ios")}
                            >
                                {t.phoneHomeIphone}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={platform === "android"}
                                className={cx(
                                    "rounded-lg px-3 py-2 text-sm font-semibold outline-focus-ring focus-visible:outline-2",
                                    platform === "android" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                )}
                                onClick={() => setPlatform("android")}
                            >
                                {t.phoneHomeAndroid}
                            </button>
                        </div>

                        <ol className="mt-4 flex flex-col gap-2">
                            {steps.map((step, index) => (
                                <li key={step.text} className="flex items-center gap-3 rounded-xl px-3 py-3 ring-1 ring-secondary">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary">
                                        {index + 1}
                                    </span>
                                    <p className="min-w-0 flex-1 text-sm text-secondary">{step.text}</p>
                                    <step.Icon className="size-5 shrink-0 text-fg-quaternary" aria-hidden />
                                </li>
                            ))}
                        </ol>

                        {platform === "android" ? <p className="mt-4 text-center text-xs text-tertiary">{t.phoneHomeSamsungNote}</p> : null}
                        {platform === "ios" ? <p className="mt-4 text-center text-xs text-tertiary">{t.phoneHomeIosSafariOnly}</p> : null}

                        <div className="mt-5 flex justify-end">
                            <Button color="primary" onClick={() => setHowOpen(false)}>
                                {t.tourDone}
                            </Button>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </section>
    );
};

const PhonePreview = ({ label, dark, active, large }: { label: string; dark: boolean; active: boolean; large: boolean }) => (
    <div
        className={cx(
            "relative overflow-hidden rounded-2xl ring-1 transition",
            dark ? "bg-[#0a0a0a] text-white ring-white/10" : "bg-white text-[#0b1f38] ring-secondary",
            active ? "opacity-100 ring-[#0d9488]/70" : "opacity-55",
        )}
    >
        {active ? (
            <span
                className={cx(
                    "absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-[#0d9488] text-white shadow-xs ring-2",
                    dark ? "ring-[#0a0a0a]" : "ring-white",
                )}
            >
                <Check className="size-3" aria-hidden />
            </span>
        ) : null}
        <div className={cx("border-b px-3 py-2 font-semibold", large ? "text-sm" : "text-xs", dark ? "border-white/10" : "border-secondary")}>{label}</div>
        <div className="space-y-2 p-3">
            <div className={cx("rounded-full transition-[height]", large ? "h-2.5" : "h-2", dark ? "bg-white/15" : "bg-secondary")} />
            <div className={cx("w-2/3 rounded-full transition-[height]", large ? "h-2.5" : "h-2", dark ? "bg-white/10" : "bg-secondary")} />
            <div className={cx("mt-3 grid grid-cols-5 gap-1 rounded-xl px-1 py-2", dark ? "bg-white/5" : "bg-secondary_alt")}>
                {["H", "V", "+", "C", "M"].map((tab) => (
                    <span
                        key={tab}
                        className={cx(
                            "flex items-center justify-center rounded-md font-bold transition-[height,font-size]",
                            large ? "h-7 text-xs" : "h-6 text-[10px]",
                            tab === "+" ? "careplus-ink text-white" : dark ? "text-white/50" : "text-tertiary",
                        )}
                    >
                        {tab}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

const FinalCta = () => {
    const { t } = useI18n();

    return (
        <section className="px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto flex w-full max-w-container flex-col gap-6 rounded-[2rem] bg-black px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-14">
                <div className="max-w-xl">
                    <h2 className="text-display-sm font-semibold text-white">{t.ctaTitle}</h2>
                    <p className="mt-3 text-md text-white/72">{t.ctaBody}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="/register"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-2.5 text-md font-semibold text-black shadow-xs outline-focus-ring transition duration-150 hover:bg-[#456f75] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {t.getStarted}
                    </a>
                    <a
                        href="/login"
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-md font-semibold text-white ring-1 ring-white/80 outline-focus-ring transition duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        {t.logIn}
                    </a>
                </div>
            </div>
        </section>
    );
};
