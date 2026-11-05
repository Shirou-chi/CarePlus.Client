import { useState } from "react";
import { FormStatus } from "@/components/application/form-status";
import { AuthCardFrame } from "@/components/auth/auth-card-frame";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { useI18n } from "@/providers/locale-provider";
import { identityCardIssue } from "@/utils/identity-card";
import { PasswordStrengthBar } from "@/components/base/input/password-strength";
import { composePhone } from "@/utils/phone";
import { passwordGaps } from "@/utils/password";

type SignupPayload = {
    fullName: string;
    ic: string;
    email: string;
    username: string;
    phone: string;
    password: string;
    emailCode: string;
};

type SignupField = "username" | "ic" | "email" | "emailCode" | "phone";
type SignupFieldErrors = Partial<Record<SignupField, string>>;

type SignupCardCombinedProps = {
    initialEmail?: string;
    error?: string | null;
    isLoading?: boolean;
    usernameAvailability?: "idle" | "checking" | "available" | "taken" | "error";
    emailVerificationStatus?: "idle" | "code" | "verified";
    emailVerificationError?: string | null;
    emailVerificationSuccess?: string | null;
    emailVerificationLoading?: boolean;
    fieldErrors?: SignupFieldErrors;
    onUsernameChange?: (username: string) => void;
    onEmailChange?: (email: string) => void;
    onFieldChange?: (field: SignupField) => void;
    onSendEmailCode?: (email: string) => void;
    onSubmit: (payload: SignupPayload) => void;
};

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const SignupCardCombined = ({
    initialEmail = "",
    error,
    isLoading,
    usernameAvailability = "idle",
    emailVerificationStatus = "idle",
    emailVerificationError,
    emailVerificationSuccess,
    emailVerificationLoading = false,
    fieldErrors = {},
    onUsernameChange,
    onEmailChange,
    onFieldChange,
    onSendEmailCode,
    onSubmit,
}: SignupCardCombinedProps) => {
    const { t } = useI18n();
    const [fullName, setFullName] = useState("");
    const [ic, setIc] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState(initialEmail);
    const [emailCode, setEmailCode] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const passwordProblems = passwordGaps(password);
    const passwordHint =
        passwordProblems.length > 0 && (submitted || password)
            ? `${t.passwordStillNeeds} ${passwordProblems
                  .map((gap) => {
                      if (gap === "short") return t.passwordNeedShort;
                      if (gap === "long") return t.passwordNeedLong;
                      if (gap === "lower") return t.passwordNeedLower;
                      if (gap === "upper") return t.passwordNeedUpper;
                      if (gap === "number") return t.passwordNeedNumber;
                      return t.passwordNeedSymbol;
                  })
                  .join(", ")}.`
            : undefined;
    const cardIssue = identityCardIssue(ic);
    const cardHint =
        (submitted || ic.trim()) && cardIssue === "empty"
            ? t.icRequired
            : (submitted || ic.trim()) && cardIssue === "length"
              ? t.icLength
              : (submitted || ic.trim()) && cardIssue === "date"
                ? t.icDate
                : undefined;
    const phoneHint = phone.trim() && !composePhone(phone.trim()) ? t.phoneFormat : undefined;
    const usernameValidationHint =
        fieldErrors.username ?? (usernameAvailability === "checking"
            ? t.usernameChecking
            : usernameAvailability === "taken"
              ? t.usernameTaken
              : usernameAvailability === "available"
                ? t.usernameAvailable
                : usernameAvailability === "error"
                  ? t.usernameCheckFailed
                  : submitted && !username.trim()
                    ? t.usernameRequired
                    : undefined);
    const displayedCardHint = fieldErrors.ic ?? cardHint;
    const emailHint = fieldErrors.email ?? ((submitted || email.trim()) && !emailOk(email.trim()) ? t.settingsInvalidEmail : undefined);
    const emailCodeHint = emailVerificationError ?? fieldErrors.emailCode ?? (submitted && emailCode.length !== 6 ? t.emailVerificationCodeRequired : undefined);
    const displayedPhoneHint = fieldErrors.phone ?? phoneHint;
    const issues = [
        fullName.trim().length < 3 ? t.nameTooShort : "",
        !username.trim() ? t.usernameRequired : "",
        usernameAvailability === "taken" ? t.usernameTaken : "",
        cardIssue === "empty" ? t.icRequired : cardIssue === "length" ? t.icLength : cardIssue === "date" ? t.icDate : "",
        !emailOk(email.trim()) ? t.settingsInvalidEmail : "",
        emailVerificationStatus === "idle" ? t.emailVerificationBeforeSignup : "",
        emailVerificationStatus === "code" && emailCode.length !== 6 ? t.emailVerificationCodeRequired : "",
        phoneHint ?? "",
        passwordHint ?? (passwordProblems.length ? t.settingsInvalidPassword : ""),
        password !== confirm ? t.passwordsMismatch : "",
    ].filter(Boolean);

    return (
        <AuthCardFrame mode="register" title={t.signUpTitle} body={t.signUpBody}>
            <Form
                onSubmit={(event) => {
                    event.preventDefault();
                    const name = fullName.trim();
                    const icValue = ic.trim();
                    const emailValue = email.trim();
                    const usernameValue = username.trim();
                    const phoneValue = phone.trim();
                    const phoneNumber = phoneValue ? composePhone(phoneValue) : "";
                    setSubmitted(true);
                    if (fullName.trim().length < 3 || !usernameValue || identityCardIssue(icValue) || !emailOk(emailValue) || emailVerificationStatus === "idle" || (emailVerificationStatus === "code" && emailCode.length !== 6) || (phoneValue && !phoneNumber) || passwordGaps(password).length > 0 || password !== confirm) {
                        return;
                    }
                    onSubmit({ fullName: name, username: usernameValue, ic: icValue, email: emailValue, phone: phoneNumber || "", password, emailCode });
                }}
                className="flex flex-col gap-7 [&_input]:min-h-12"
            >
                <FormStatus error={submitted && issues.length > 0 ? t.signupCheck : error} details={submitted ? issues : undefined} />
                <div className="flex flex-col gap-6">
                    <Input
                        isRequired
                        label={t.fullName}
                        name="fullName"
                        value={fullName}
                        onChange={setFullName}
                        placeholder={t.fullNamePlaceholder}
                        hint={submitted && fullName.trim().length < 3 ? t.nameTooShort : undefined}
                        isInvalid={submitted && fullName.trim().length < 3}
                        size="lg"
                        autoComplete="name"
                    />
                    <Input
                        isRequired
                        label={t.username}
                        name="username"
                        value={username}
                        onChange={(value) => {
                            setUsername(value);
                            onFieldChange?.("username");
                            onUsernameChange?.(value);
                        }}
                        placeholder={t.usernamePlaceholder}
                        tooltip={t.usernameHint}
                        size="lg"
                        hint={usernameValidationHint}
                        isInvalid={Boolean(fieldErrors.username) || usernameAvailability === "taken" || (submitted && !username.trim())}
                        autoComplete="username"
                    />
                    <Input
                        isRequired
                        label={t.ic}
                        name="ic"
                        value={ic}
                        onChange={(value) => {
                            setIc(value);
                            onFieldChange?.("ic");
                        }}
                        placeholder={t.icPlaceholder}
                        hint={displayedCardHint}
                        size="lg"
                        isInvalid={Boolean(displayedCardHint)}
                        autoComplete="off"
                    />
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <Input
                                isRequired
                                label={t.email}
                                type="email"
                                name="email"
                                value={email}
                                onChange={(value) => {
                                    setEmail(value);
                                    setEmailCode("");
                                    onFieldChange?.("email");
                                    onFieldChange?.("emailCode");
                                    onEmailChange?.(value);
                                }}
                                placeholder={t.emailPlaceholder}
                                hint={emailHint}
                                size="lg"
                                isDisabled={emailVerificationStatus === "verified"}
                                isInvalid={Boolean(fieldErrors.email) || ((submitted || Boolean(email.trim())) && !emailOk(email.trim()))}
                                autoComplete="email"
                            />
                            <Button
                                type="button"
                                color="secondary"
                                size="lg"
                                className="min-h-12 whitespace-nowrap sm:mt-[26px]"
                                isLoading={emailVerificationLoading && emailVerificationStatus !== "verified"}
                                isDisabled={!emailOk(email.trim()) || emailVerificationLoading || emailVerificationStatus === "verified"}
                                onClick={() => onSendEmailCode?.(email.trim())}
                            >
                                {emailVerificationStatus === "code" ? t.resendVerificationCode : t.forgotSendCode}
                            </Button>
                        </div>

                        {emailVerificationStatus !== "idle" ? (
                            <Input
                                isRequired
                                label={t.emailVerificationCode}
                                name="emailVerificationCode"
                                value={emailCode}
                                onChange={(value) => {
                                    setEmailCode(value.replace(/\D/g, "").slice(0, 6));
                                    onFieldChange?.("emailCode");
                                }}
                                placeholder={t.emailVerificationCodePlaceholder}
                                hint={emailCodeHint}
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="one-time-code"
                                isDisabled={emailVerificationStatus === "verified"}
                                isInvalid={Boolean(emailCodeHint)}
                                size="lg"
                            />
                        ) : null}

                        <FormStatus error={emailVerificationStatus === "idle" ? emailVerificationError : null} success={emailVerificationSuccess} />
                    </div>
                    <Input
                        label={`${t.phone} ${t.optional}`}
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={(value) => {
                            setPhone(value);
                            onFieldChange?.("phone");
                        }}
                        placeholder={t.phonePlaceholder}
                        hint={displayedPhoneHint}
                        isInvalid={Boolean(displayedPhoneHint)}
                        size="lg"
                        autoComplete="tel"
                    />
                    <Input
                        isRequired
                        label={t.password}
                        type="password"
                        name="password"
                        value={password}
                        onChange={setPassword}
                        placeholder={t.passwordPlaceholder}
                        hint={passwordHint ?? t.passwordHint}
                        size="lg"
                        isInvalid={Boolean(passwordHint)}
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
                        hint={(submitted || confirm) && password !== confirm ? t.passwordsMismatch : undefined}
                        size="lg"
                        isInvalid={(submitted || Boolean(confirm)) && password !== confirm}
                        autoComplete="new-password"
                    />
                </div>

                <Button type="submit" size="lg" isLoading={isLoading} showTextWhileLoading className="min-h-12">
                    {t.signUp}
                </Button>
            </Form>

            <div className="flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">{t.alreadyHaveAccount}</span>
                <Button href="/login" color="link-color" size="md">
                    {t.logIn}
                </Button>
            </div>
        </AuthCardFrame>
    );
};
