import { useState } from "react";
import { Heading } from "react-aria-components";
import { ArrowLeft, Key01 } from "@untitledui/icons";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { useI18n } from "@/providers/locale-provider";
import { PasswordStrengthBar } from "@/components/base/input/password-strength";
import { passwordIsValid } from "@/utils/password";
import { authApi } from "@/services/authApi";

type Step = "email" | "code" | "password" | "done";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const Step1ForgotPassword = () => {
    const { t } = useI18n();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [code, setCode] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [asking, setAsking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordBad = !passwordIsValid(password);
    const mismatch = password !== confirm;
    const body = step === "code" ? t.forgotCodeBody : step === "password" ? t.forgotPasswordBody : t.forgotBody;

    const submit = async () => {
        setError(null);
        if (step === "email") {
            const value = email.trim().toLowerCase();
            if (!emailOk(value)) {
                setError(t.settingsInvalidEmail);
                return;
            }
            setIsLoading(true);
            try {
                const result = await authApi.requestPasswordReset(value);
                setEmail(value);
                setMaskedEmail(result.maskedEmail);
                setChallengeId(result.challengeId);
                setCode("");
                setStep("code");
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : t.forgotNoAccount);
            } finally {
                setIsLoading(false);
            }
            return;
        }
        if (step === "code") {
            if (!/^\d{6}$/.test(code.trim())) {
                setError(t.settingsEmailCodeMismatch);
                return;
            }
            setIsLoading(true);
            try {
                const result = await authApi.verifyPasswordResetCode(challengeId, code.trim());
                setChallengeId(result.challengeId);
                setResetToken(result.resetToken);
                setStep("password");
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : t.settingsEmailCodeMismatch);
            } finally {
                setIsLoading(false);
            }
            return;
        }
        if (passwordBad) {
            setError(t.settingsInvalidPassword);
            return;
        }
        if (mismatch) {
            setError(t.passwordsMismatch);
            return;
        }
        setAsking(true);
    };

    const confirmReset = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await authApi.completePasswordReset(challengeId, resetToken, password);
            setAsking(false);
            setStep("done");
            setCode("");
            setPassword("");
            setConfirm("");
            setResetToken("");
        } catch (requestError) {
            setAsking(false);
            setError(requestError instanceof Error ? requestError.message : t.settingsInvalidPassword);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="px-4 py-12 md:px-8">
            <div className="mx-auto flex w-full max-w-90 flex-col gap-8">
                <div className="flex justify-center">
                    <CarePlusLogo />
                </div>
                <div className="flex flex-col items-center gap-6 text-center">
                    <FeaturedIcon icon={Key01} color="brand" theme="light" size="lg" />
                    <div className="flex flex-col gap-2 md:gap-3">
                        <h1 className="text-xl font-semibold text-primary md:text-display-xs">{t.forgotTitle}</h1>
                        <p className="self-stretch text-md text-tertiary">{step === "done" ? t.forgotResetDone : body}</p>
                    </div>
                </div>

                {step === "done" ? null : (
                    <Form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submit();
                        }}
                        className="flex flex-col gap-6"
                    >
                        {step === "password" ? (
                            <>
                                <Input
                                    isRequired
                                    label={t.settingsNewPassword}
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={setPassword}
                                    placeholder={t.passwordPlaceholder}
                                    hint={error === t.settingsInvalidPassword ? t.settingsInvalidPassword : t.passwordHint}
                                    isInvalid={error === t.settingsInvalidPassword}
                                    size="lg"
                                    autoComplete="new-password"
                                />
                                <PasswordStrengthBar password={password} />
                                <Input
                                    isRequired
                                    label={t.confirmPassword}
                                    type="password"
                                    name="confirmPassword"
                                    value={confirm}
                                    onChange={setConfirm}
                                    placeholder={t.confirmPasswordPlaceholder}
                                    hint={error === t.passwordsMismatch ? t.passwordsMismatch : undefined}
                                    isInvalid={error === t.passwordsMismatch}
                                    size="lg"
                                    autoComplete="new-password"
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    isRequired
                                    label={t.email}
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={setEmail}
                                    placeholder={t.emailPlaceholder}
                                    isDisabled={step === "code"}
                                    size="lg"
                                    autoComplete="email"
                                />
                                {step === "code" ? (
                                    <Input
                                        isRequired
                                        label={t.resetCodeLabel}
                                        name="code"
                                        value={code}
                                        onChange={setCode}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        size="lg"
                                    />
                                ) : null}
                            </>
                        )}
                        <FormStatus
                            error={error}
                            success={step === "code" ? t.forgotCodeSent.replace("{email}", maskedEmail || email) : null}
                        />
                        <Button type="submit" size="lg" isLoading={isLoading} isDisabled={isLoading} showTextWhileLoading>
                            {step === "email" ? t.forgotSendCode : step === "code" ? t.forgotProceed : t.resetPassword}
                        </Button>
                    </Form>
                )}

                <Button size="md" color="link-gray" href="/login" className="mx-auto" iconLeading={ArrowLeft}>
                    {t.backToLogIn}
                </Button>
            </div>

            {asking ? (
                <ModalOverlay isDismissable isOpen onOpenChange={(open) => !open && setAsking(false)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.forgotConfirmTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">{t.forgotConfirmBody}</p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onPress={() => setAsking(false)}>
                                    {t.notifCancel}
                                </Button>
                                <Button onPress={() => void confirmReset()} isLoading={isLoading} isDisabled={isLoading}>
                                    {t.resetPassword}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </section>
    );
};
