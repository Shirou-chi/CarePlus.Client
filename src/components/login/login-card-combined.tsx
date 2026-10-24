import { useState } from "react";
import { FormStatus } from "@/components/application/form-status";
import { AuthCardFrame } from "@/components/auth/auth-card-frame";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { useI18n } from "@/providers/locale-provider";

type LoginCardCombinedProps = {
    error?: string | null;
    success?: string | null;
    isLoading?: boolean;
    defaultEmail?: string;
    defaultPassword?: string;
    hint?: string;
    onSubmit: (payload: { email: string; password: string; rememberMe: boolean }) => void;
};

export const LoginCardCombined = ({ error, success, isLoading, defaultEmail, defaultPassword, hint, onSubmit }: LoginCardCombinedProps) => {
    const { t } = useI18n();
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <AuthCardFrame mode="login" title={t.logInTitle} body={t.logInBody}>
            <Form
                onSubmit={(e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(new FormData(e.currentTarget));
                    onSubmit({
                        email: String(data.email ?? ""),
                        password: String(data.password ?? ""),
                        rememberMe,
                    });
                }}
                className="flex flex-col gap-7 [&_input]:min-h-12"
            >
                <FormStatus error={error} success={success} />
                <div className="flex flex-col gap-6">
                    <Input isRequired label={t.loginId} type="text" name="email" placeholder={t.loginIdPlaceholder} autoComplete="username" size="lg" defaultValue={defaultEmail} />
                    <Input
                        isRequired
                        label={t.password}
                        type="password"
                        name="password"
                        size="lg"
                        placeholder="••••••••••••"
                        defaultValue={defaultPassword}
                        inputClassName="placeholder:text-placeholder/50"
                    />
                </div>

                {hint ? <p className="text-sm text-tertiary">{hint}</p> : null}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Checkbox size="md" label={t.remember30} isSelected={rememberMe} onChange={setRememberMe} className="py-1" />
                    <Button color="link-color" size="md" href="/forgot-password" className="min-h-11 self-start sm:ml-auto sm:self-auto">
                        {t.forgotPassword}
                    </Button>
                </div>

                <Button type="submit" size="lg" isLoading={isLoading} showTextWhileLoading className="min-h-12">
                    {t.signIn}
                </Button>
            </Form>

            <div className="flex justify-center gap-1 py-1 text-center">
                <span className="text-sm text-tertiary">{t.dontHaveAccount}</span>
                <Button color="link-color" size="md" href="/register">
                    {t.signUp}
                </Button>
            </div>
        </AuthCardFrame>
    );
};
