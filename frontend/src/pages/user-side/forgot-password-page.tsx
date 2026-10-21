import { Step1ForgotPassword } from "@/components/forgot-password/step-1-forgot-password";
import { useI18n } from "@/providers/locale-provider";
import { DUMMY_EMAIL, DUMMY_PASSWORD } from "@/utils/auth";

export const ForgotPasswordPage = () => {
    const { t } = useI18n();

    return (
        <Step1ForgotPassword
            success={t.dummyLoginHint.replace("{email}", DUMMY_EMAIL).replace("{password}", DUMMY_PASSWORD)}
            onSubmit={() => undefined}
        />
    );
};
