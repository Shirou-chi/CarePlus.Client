import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { LoginCardCombined } from "@/components/login/login-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { safeAppPath } from "@/utils/chat";
import { passwordLockoutMessage } from "@/utils/password-lockout";

type TwoFactorStep = {
    challengeId: string;
    maskedEmail: string;
    rememberMe: boolean;
};

export const LoginPage = () => {
    const { login, completeLoginTwoFactor, resendLoginTwoFactor, profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const nextPath = safeAppPath(searchParams.get("next")) ?? "/home";
    const notice = (location.state as { notice?: string } | null)?.notice ?? null;
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(notice);
    const [isLoading, setIsLoading] = useState(false);
    const [twoFactor, setTwoFactor] = useState<TwoFactorStep | null>(null);

    if (!isReady) {
        return <div className="min-h-60" />;
    }

    if (profile) {
        return <Navigate to={nextPath} replace />;
    }

    const mapLoginError = (raw: string) => {
        const known: Record<string, string> = {
            "This username or email is not registered yet.": t.loginWrongPassword,
            "Incorrect password.": t.loginWrongPassword,
            "Incorrect username/email or password.": t.loginWrongPassword,
            "This account is not active.": t.loginInactive,
            "This account is not a patient account.": t.loginNotPatient,
            "Please verify your email address before logging in.": t.emailVerificationRequired,
            "That verification code is incorrect.": t.settingsTwoFactorCodeWrong,
            "That verification code has expired. Request a new code.": t.emailVerificationExpired,
            "Too many incorrect attempts. Request a new code.": t.emailVerificationExpired,
            "This verification request is no longer valid.": t.emailVerificationInvalid,
            "We could not send the verification email. Please try again later.": t.settingsTwoFactorEmailFailed,
            "A verification code is already active.": t.emailVerificationWait,
        };
        return passwordLockoutMessage(raw, t.accountLocked) ?? known[raw] ?? t.authFailed;
    };

    return (
        <LoginCardCombined
            error={error}
            success={success}
            isLoading={isLoading}
            registerHref={nextPath === "/home" ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`}
            twoFactor={twoFactor ? { maskedEmail: twoFactor.maskedEmail } : null}
            onSubmit={async ({ email, password, rememberMe }) => {
                setError(null);
                setSuccess(null);
                setIsLoading(true);
                try {
                    const result = await login(email, password, rememberMe);
                    if (result?.requiresTwoFactor) {
                        setTwoFactor({
                            challengeId: result.challengeId,
                            maskedEmail: result.maskedEmail,
                            rememberMe,
                        });
                        setSuccess(t.emailVerificationSent.replace("{email}", result.maskedEmail));
                        return;
                    }
                    navigate(nextPath, { replace: true });
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : "";
                    setError(mapLoginError(raw));
                } finally {
                    setIsLoading(false);
                }
            }}
            onVerifyTwoFactor={async (code) => {
                if (!twoFactor) return;
                setError(null);
                setSuccess(null);
                setIsLoading(true);
                try {
                    await completeLoginTwoFactor(twoFactor.challengeId, code, twoFactor.rememberMe);
                    navigate(nextPath, { replace: true });
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : "";
                    setError(mapLoginError(raw));
                } finally {
                    setIsLoading(false);
                }
            }}
            onResendTwoFactor={async () => {
                if (!twoFactor) return;
                setError(null);
                setIsLoading(true);
                try {
                    const result = await resendLoginTwoFactor(twoFactor.challengeId);
                    setTwoFactor({
                        challengeId: result.challengeId,
                        maskedEmail: result.maskedEmail,
                        rememberMe: twoFactor.rememberMe,
                    });
                    setSuccess(t.emailVerificationSent.replace("{email}", result.maskedEmail));
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : "";
                    setError(mapLoginError(raw));
                } finally {
                    setIsLoading(false);
                }
            }}
            onBackFromTwoFactor={() => {
                setTwoFactor(null);
                setError(null);
                setSuccess(null);
            }}
        />
    );
};
