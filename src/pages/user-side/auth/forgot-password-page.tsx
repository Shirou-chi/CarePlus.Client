import { Navigate } from "react-router";
import { Step1ForgotPassword } from "@/components/forgot-password/step-1-forgot-password";
import { useAuth } from "@/providers/auth-provider";

export const ForgotPasswordPage = () => {
    const { profile, isReady } = useAuth();

    if (!isReady) {
        return <div className="min-h-60" />;
    }

    if (profile) {
        return <Navigate to="/home" replace />;
    }

    return <Step1ForgotPassword />;
};
