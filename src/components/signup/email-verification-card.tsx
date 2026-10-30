import { useState } from "react";
import { FormStatus } from "@/components/application/form-status";
import { AuthCardFrame } from "@/components/auth/auth-card-frame";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { useI18n } from "@/providers/locale-provider";

type EmailVerificationCardProps = {
    maskedEmail: string;
    error?: string | null;
    success?: string | null;
    isLoading?: boolean;
    resendLoading?: boolean;
    verified?: boolean;
    onSubmit: (code: string) => void;
    onResend: () => void;
};

export const EmailVerificationCard = ({
    maskedEmail,
    error,
    success,
    isLoading = false,
    resendLoading = false,
    verified = false,
    onSubmit,
    onResend,
}: EmailVerificationCardProps) => {
    const { t } = useI18n();
    const [code, setCode] = useState("");

    return (
        <AuthCardFrame
            mode="register"
            title={t.emailVerificationTitle}
            body={t.emailVerificationBody.replace("{email}", maskedEmail)}
        >
            {verified ? (
                <div className="flex flex-col gap-6">
                    <FormStatus success={success ?? t.emailVerified} />
                    <Button href="/login" size="lg" className="min-h-12">
                        {t.continueToLogin}
                    </Button>
                </div>
            ) : (
                <Form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit(code.trim());
                    }}
                    className="flex flex-col gap-6"
                >
                    <FormStatus error={error} success={success} />
                    <Input
                        isRequired
                        label={t.emailVerificationCode}
                        name="verificationCode"
                        value={code}
                        onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                        placeholder={t.emailVerificationCodePlaceholder}
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        isInvalid={Boolean(error)}
                        size="lg"
                        autoFocus
                    />
                    <Button type="submit" size="lg" isLoading={isLoading} isDisabled={code.trim().length !== 6} showTextWhileLoading className="min-h-12">
                        {t.verifyEmail}
                    </Button>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-sm text-tertiary">{t.emailVerificationSent.replace("{email}", maskedEmail)}</p>
                        <Button type="button" color="link-color" size="md" onClick={onResend} isLoading={resendLoading}>
                            {t.resendVerificationCode}
                        </Button>
                    </div>
                </Form>
            )}
        </AuthCardFrame>
    );
};
