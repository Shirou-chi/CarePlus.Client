import { Navigate } from "react-router";
import { Step1ForgotPassword } from "@/components/forgot-password/step-1-forgot-password";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { useAuth } from "@/providers/auth-provider";

export const ForgotPasswordPage = () => {
    const { profile, isReady } = useAuth();

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (profile) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="careplus-landing careplus-auth min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <Step1ForgotPassword />
        </div>
    );
};
