import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { SignupCardCombined } from "@/components/signup/signup-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { authApi } from "@/services/authApi";
import { normalizeIdentityCard } from "@/utils/identity-card";

export const RegisterPage = () => {
    const { profile, isReady } = useAuth();
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
        <SignupCardCombined
            error={error}
            isLoading={isLoading}
            onSubmit={async ({ fullName, username, ic, email, phone, password }) => {
                setError(null);
                setIsLoading(true);
                try {
                    await authApi.patientRegister({
                        username,
                        name: fullName,
                        email,
                        password,
                        phone: phone || null,
                        identityCardNumber: normalizeIdentityCard(ic),
                    });
                    navigate("/login", { replace: true, state: { notice: t.accountCreated } });
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : t.authFailed;
                    const known: Record<string, string> = {
                        "Email already exists": t.emailTaken,
                        "Username already exists": t.usernameTaken,
                        "Identity card number already exists.": t.icTaken,
                    };
                    setError(raw.split("\n").map((line) => known[line] ?? line).join("\n"));
                } finally {
                    setIsLoading(false);
                }
            }}
        />
    );
};
