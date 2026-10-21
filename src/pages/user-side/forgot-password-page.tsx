import { Step1ForgotPassword } from "@/components/forgot-password/step-1-forgot-password";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useI18n } from "@/providers/locale-provider";
import { DUMMY_EMAIL, DUMMY_PASSWORD } from "@/utils/auth";

export const ForgotPasswordPage = () => {
    const { t } = useI18n();

    return (
        <div className="careplus-landing careplus-auth min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <Step1ForgotPassword
                success={t.dummyLoginHint.replace("{email}", DUMMY_EMAIL).replace("{password}", DUMMY_PASSWORD)}
                onSubmit={() => undefined}
            />
        </div>
    );
};
