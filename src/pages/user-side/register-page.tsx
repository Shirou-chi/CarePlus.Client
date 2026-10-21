import { Navigate, useNavigate } from "react-router";
import { SignupCardCombined } from "@/components/signup/signup-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { DUMMY_EMAIL, DUMMY_PASSWORD } from "@/utils/auth";

export const RegisterPage = () => {
    const { profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (profile) {
        return <Navigate to="/home" replace />;
    }

    return (
        <SignupCardCombined
            hint={t.dummyLoginHint.replace("{email}", DUMMY_EMAIL).replace("{password}", DUMMY_PASSWORD)}
            onSubmit={() => {
                navigate("/login", { replace: true });
            }}
        />
    );
};
