import { Outlet, useLocation } from "react-router";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";

/** Shared chrome for login / signup / forgot-password so tab swaps do not remount the header. */
export const AuthLayout = () => {
    const location = useLocation();

    return (
        <div className="careplus-landing careplus-auth min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <div key={location.pathname + location.search} className="careplus-auth-stage">
                <Outlet />
            </div>
            <LandingFooter />
        </div>
    );
};
