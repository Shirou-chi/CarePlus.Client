import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { LoginCardCombined } from "@/components/login/login-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { AuthError, DUMMY_EMAIL, DUMMY_PASSWORD } from "@/utils/auth";

export const LoginPage = () => {
    const { login, profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
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
            isLoading={isLoading}
            defaultEmail={DUMMY_EMAIL}
            defaultPassword={DUMMY_PASSWORD}
            hint={t.dummyLoginHint.replace("{email}", DUMMY_EMAIL).replace("{password}", DUMMY_PASSWORD)}
            onSubmit={async ({ email, password }) => {
                setError(null);
                setIsLoading(true);
                try {
                    await login(email, password);
                    navigate("/home", { replace: true });
                } catch (caught) {
                    setError(caught instanceof AuthError ? t.dummyLoginWrong : t.authFailed);
                } finally {
                    setIsLoading(false);
                }
            }}
        />
    );
};
