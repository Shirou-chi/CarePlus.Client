import type { ReactNode } from "react";
import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

type AuthCardFrameProps = {
    mode: "login" | "register";
    title: string;
    body: string;
    children: ReactNode;
};

export const AuthCardFrame = ({ mode, title, body, children }: AuthCardFrameProps) => {
    const { t } = useI18n();

    return (
        <div className="careplus-landing careplus-auth min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <section className="px-4 py-12 md:px-8 md:py-16">
                <div className="flex w-full flex-col gap-6 bg-primary sm:mx-auto sm:max-w-110 sm:rounded-2xl sm:px-10 sm:py-8 sm:shadow-sm sm:ring-1 sm:ring-secondary">
                <div className="flex flex-col items-center gap-6 text-center">
                    <CarePlusLogo />
                    <div className="flex flex-col gap-2 md:gap-3">
                        <h1 className="text-xl font-semibold text-primary md:text-display-xs">{title}</h1>
                        <p className="text-md text-tertiary">{body}</p>
                    </div>
                </div>

                <nav aria-label={t.account} className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1 ring-1 ring-secondary">
                    <a
                        href="/register"
                        aria-current={mode === "register" ? "page" : undefined}
                        className={cx(
                            "cursor-pointer rounded-lg py-2.5 text-center text-sm font-semibold shadow-xs ring-1 outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
                            mode === "register"
                                ? "bg-[#456f75] text-white ring-[#456f75]"
                                : "bg-primary text-primary ring-secondary hover:bg-[#456f75] hover:text-white hover:ring-[#456f75] dark:bg-white/10 dark:text-white dark:ring-white/45",
                        )}
                    >
                        {t.signUp}
                    </a>
                    <a
                        href="/login"
                        aria-current={mode === "login" ? "page" : undefined}
                        className={cx(
                            "cursor-pointer rounded-lg py-2.5 text-center text-sm font-semibold shadow-xs ring-1 outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
                            mode === "login"
                                ? "bg-[#456f75] text-white ring-[#456f75]"
                                : "bg-primary text-primary ring-secondary hover:bg-[#456f75] hover:text-white hover:ring-[#456f75] dark:bg-white/10 dark:text-white dark:ring-white/45",
                        )}
                    >
                        {t.logIn}
                    </a>
                </nav>

                {children}
                </div>
            </section>
            <LandingFooter />
        </div>
    );
};
