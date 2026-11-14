import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { SignupCardCombined } from "@/components/signup/signup-card-combined";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { authApi } from "@/services/authApi";
import { safeAppPath } from "@/utils/chat";
import { normalizeIdentityCard } from "@/utils/identity-card";

type EmailVerificationState = {
    status: "idle" | "code" | "verified";
    challengeId: string;
    verificationToken: string;
    maskedEmail: string;
};

type RegistrationField = "username" | "ic" | "email" | "emailCode" | "phone";
type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>;

const emptyEmailVerification: EmailVerificationState = {
    status: "idle",
    challengeId: "",
    verificationToken: "",
    maskedEmail: "",
};

export const RegisterPage = () => {
    const { profile, isReady } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialEmail = (searchParams.get("email") ?? "").trim().slice(0, 254);
    const nextPath = safeAppPath(searchParams.get("next"));
    const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState("");
    const [usernameAvailability, setUsernameAvailability] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
    const [emailVerification, setEmailVerification] = useState<EmailVerificationState>(emptyEmailVerification);
    const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
    const [emailVerificationSuccess, setEmailVerificationSuccess] = useState<string | null>(null);
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
    const usernameRequestId = useRef(0);

    const clearFieldError = (field: RegistrationField) => {
        setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

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
            "Email already exists": t.emailTaken,
            "That verification code is incorrect.": t.emailVerificationIncorrect,
            "That verification code has expired. Request a new code.": t.emailVerificationExpired,
            "Too many incorrect attempts. Request a new code.": t.emailVerificationTooManyAttempts,
            "A verification code is already active.": t.emailVerificationWait,
        };
        return known[raw] ?? (raw || t.emailVerificationSendFailed);
    };

    if (!isReady) {
        return <div className="min-h-60" />;
    }

    if (profile) {
        return <Navigate to={nextPath ?? "/home"} replace />;
    }

    return (
        <SignupCardCombined
            initialEmail={initialEmail}
            loginHref={loginHref}
            error={error}
            isLoading={isLoading}
            usernameAvailability={usernameAvailability}
            emailVerificationStatus={emailVerification.status}
            emailVerificationError={emailVerificationError}
            emailVerificationSuccess={emailVerificationSuccess}
            emailVerificationLoading={emailVerificationLoading}
            fieldErrors={fieldErrors}
            onFieldChange={clearFieldError}
            onUsernameChange={(username) => {
                setError(null);
                setUsernameDraft(username);
            }}
            onEmailChange={() => {
                setError(null);
                setEmailVerification(emptyEmailVerification);
                setEmailVerificationError(null);
                setEmailVerificationSuccess(null);
                clearFieldError("email");
                clearFieldError("emailCode");
            }}
            onSendEmailCode={async (email) => {
                setEmailVerificationError(null);
                setEmailVerificationSuccess(null);
                clearFieldError("email");
                clearFieldError("emailCode");
                setEmailVerificationLoading(true);
                try {
                    const result = await authApi.requestRegistrationEmailCode(email);
                    setEmailVerification({
                        status: "code",
                        challengeId: result.challengeId,
                        verificationToken: "",
                        maskedEmail: result.maskedEmail,
                    });
                    setEmailVerificationSuccess(t.emailVerificationSent.replace("{email}", result.maskedEmail));
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : "";
                    setEmailVerificationError(verificationMessage(raw));
                } finally {
                    setEmailVerificationLoading(false);
                }
            }}
            onSubmit={async ({ fullName, username, ic, email, phone, password, emailCode }) => {
                setError(null);
                setEmailVerificationError(null);
                setFieldErrors({});
                if (emailVerification.status === "idle" || !emailVerification.challengeId) {
                    setError(t.emailVerificationBeforeSignup);
                    return;
                }

                setIsLoading(true);
                try {
                    let challengeId = emailVerification.challengeId;
                    let verificationToken = emailVerification.verificationToken;

                    if (emailVerification.status !== "verified") {
                        try {
                            const verification = await authApi.verifyRegistrationEmailCode(challengeId, emailCode);
                            challengeId = verification.challengeId;
                            verificationToken = verification.verificationToken;
                            setEmailVerification((current) => ({
                                ...current,
                                status: "verified",
                                challengeId,
                                verificationToken,
                            }));
                            setEmailVerificationSuccess(t.emailVerified);
                        } catch (caught) {
                            const raw = caught instanceof Error ? caught.message : "";
                            setEmailVerificationError(verificationMessage(raw));
                            return;
                        }
                    }

                    await authApi.patientRegister({
                        username,
                        name: fullName,
                        email,
                        password,
                        phone: phone || null,
                        identityCardNumber: normalizeIdentityCard(ic),
                        emailVerificationChallengeId: challengeId,
                        emailVerificationToken: verificationToken,
                    });
                    navigate(loginHref, { replace: true, state: { notice: t.accountCreated } });
                } catch (caught) {
                    const raw = caught instanceof Error ? caught.message : t.authFailed;
                    const known: Record<string, { field: RegistrationField; message: string }> = {
                        "Email already exists": { field: "email", message: t.emailTaken },
                        "Username already exists": { field: "username", message: t.usernameTaken },
                        "Phone number already exists": { field: "phone", message: t.phoneTaken },
                        "Identity card number already exists.": { field: "ic", message: t.icTaken },
                        "Verify your email address before registering.": { field: "emailCode", message: t.emailVerificationBeforeSignup },
                    };
                    const nextFieldErrors: RegistrationFieldErrors = {};
                    const generalErrors: string[] = [];
                    raw.split("\n").filter(Boolean).forEach((line) => {
                        const matched = known[line];
                        if (matched) {
                            nextFieldErrors[matched.field] = matched.message;
                        } else {
                            generalErrors.push(line);
                        }
                    });
                    setFieldErrors(nextFieldErrors);
                    setError(generalErrors.length > 0 ? generalErrors.join("\n") : null);
                } finally {
                    setIsLoading(false);
                }
            }}
        />
    );
};
