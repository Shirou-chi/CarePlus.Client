import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LoginCardCombined } from "@/components/login/login-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";

export const LoginPage = () => {
    const { login, profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const notice = (location.state as { notice?: string } | null)?.notice ?? null;
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (profile) {
        return <Navigate to="/home" replace />;
    }

    return (
        <LoginCardCombined
            error={error}
            success={notice}
            isLoading={isLoading}
            onSubmit={async ({ email, password }) => {
                setError(null);
                setIsLoading(true);
                try {
                    await login(email, password);
                    navigate("/home", { replace: true });
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : "";
                    const known: Record<string, string> = {
                        "This username or email is not registered yet.": t.loginWrongPassword,
                        "Incorrect password.": t.loginWrongPassword,
                        "Incorrect username/email or password.": t.loginWrongPassword,
                        "This account is not active.": t.loginInactive,
                        "This account is not a patient account.": t.loginNotPatient,
                    };
                    setError(known[raw] ?? t.authFailed);
                } finally {
                    setIsLoading(false);
                }
            }}
        />
    );
};
