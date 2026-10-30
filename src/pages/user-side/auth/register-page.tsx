import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { EmailVerificationCard } from "@/components/signup/email-verification-card";
import { SignupCardCombined } from "@/components/signup/signup-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { authApi } from "@/services/authApi";
import { normalizeIdentityCard } from "@/utils/identity-card";

export const RegisterPage = () => {
    const { profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialEmail = (searchParams.get("email") ?? "").trim().slice(0, 254);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState("");
    const [usernameAvailability, setUsernameAvailability] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
    const [verification, setVerification] = useState<{ challengeId: string; maskedEmail: string } | null>(null);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [emailLinkCode, setEmailLinkCode] = useState<string | null>(null);
    const [autoVerifyChallengeId, setAutoVerifyChallengeId] = useState<string | null>(null);
    const usernameRequestId = useRef(0);

    useEffect(() => {
        const username = usernameDraft.trim();
        const requestId = ++usernameRequestId.current;

        if (!username) {
            setUsernameAvailability("idle");
            return;
        }

        const timer = window.setTimeout(async () => {
            setUsernameAvailability("checking");

            try {
                const available = await authApi.checkUsernameAvailability(username);
                if (requestId !== usernameRequestId.current) return;
                setUsernameAvailability(available ? "available" : "taken");
            } catch {
                if (requestId !== usernameRequestId.current) return;
                setUsernameAvailability("error");
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [usernameDraft]);

    const verificationMessage = (raw: string) => {
        const known: Record<string, string> = {
            "That verification code is incorrect.": t.emailVerificationIncorrect,
            "That verification code has expired. Request a new code.": t.emailVerificationExpired,
            "Too many incorrect attempts. Request a new code.": t.emailVerificationTooManyAttempts,
            "That verification request is no longer valid.": t.emailVerificationInvalid,
            "A verification code was sent recently. Please wait before requesting another code.": t.emailVerificationWait,
        };

        return known[raw] ?? t.emailVerificationSendFailed;
    };

    useEffect(() => {
        const challengeId = searchParams.get("challengeId")?.trim();
        const code = searchParams.get("code")?.trim() ?? "";

        if (!challengeId) return;

        setVerification({
            challengeId,
            maskedEmail: searchParams.get("email")?.trim() || t.email,
        });
        setEmailLinkCode(/^\d{6}$/.test(code) ? code : null);
        setVerificationError(null);
        setVerificationSuccess(null);
    }, [searchParams, t.email]);

    useEffect(() => {
        if (!verification || !emailLinkCode || autoVerifyChallengeId === verification.challengeId) return;

        setAutoVerifyChallengeId(verification.challengeId);
        setVerificationLoading(true);
        void authApi.verifyEmail(verification.challengeId, emailLinkCode)
            .then(() => setVerificationSuccess(t.emailVerified))
            .catch((caught) => {
                const raw = caught instanceof Error ? caught.message : "";
                setVerificationError(verificationMessage(raw));
            })
            .finally(() => setVerificationLoading(false));
    }, [autoVerifyChallengeId, emailLinkCode, t.emailVerified, verification]);

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (profile) {
        return <Navigate to="/home" replace />;
    }

    if (verification) {
        return (
            <EmailVerificationCard
                maskedEmail={verification.maskedEmail}
                error={verificationError}
                success={verificationSuccess}
                isLoading={verificationLoading}
                resendLoading={resendLoading}
                verified={verificationSuccess === t.emailVerified}
                onSubmit={async (code) => {
                    setVerificationError(null);
                    setVerificationSuccess(null);
                    setVerificationLoading(true);
                    try {
                        await authApi.verifyEmail(verification.challengeId, code);
                        setVerificationSuccess(t.emailVerified);
                    } catch (caught) {
                        const raw = caught instanceof Error ? caught.message : "";
                        setVerificationError(verificationMessage(raw));
                    } finally {
                        setVerificationLoading(false);
                    }
                }}
                onResend={async () => {
                    setVerificationError(null);
                    setVerificationSuccess(null);
                    setResendLoading(true);
                    try {
                        const result = await authApi.resendEmailVerification(verification.challengeId);
                        setEmailLinkCode(null);
                        setVerification({ challengeId: result.challengeId, maskedEmail: result.maskedEmail });
                        setVerificationSuccess(t.emailVerificationSent.replace("{email}", result.maskedEmail));
                    } catch (caught) {
                        const raw = caught instanceof Error ? caught.message : "";
                        setVerificationError(verificationMessage(raw));
                    } finally {
                        setResendLoading(false);
                    }
                }}
            />
        );
    }

    return (
        <SignupCardCombined
            initialEmail={initialEmail}
            error={error}
            isLoading={isLoading}
            usernameAvailability={usernameAvailability}
            onUsernameChange={(username) => {
                setError(null);
                setUsernameDraft(username);
            }}
            onSubmit={async ({ fullName, username, ic, email, phone, password }) => {
                setError(null);
                setIsLoading(true);
                try {
                    const result = await authApi.patientRegister({
                        username,
                        name: fullName,
                        email,
                        password,
                        phone: phone || null,
                        identityCardNumber: normalizeIdentityCard(ic),
                    });
                    if (result.emailVerificationRequired && result.verificationChallengeId) {
                        setEmailLinkCode(null);
                        setVerification({
                            challengeId: result.verificationChallengeId,
                            maskedEmail: result.maskedEmail,
                        });
                        setVerificationSuccess(t.emailVerificationSent.replace("{email}", result.maskedEmail));
                    } else {
                        navigate("/login", { replace: true, state: { notice: t.accountCreated } });
                    }
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
