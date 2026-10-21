import { AuthCardFrame } from "@/components/auth/auth-card-frame";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";

type SignupCardCombinedProps = {
    hint?: string;
    onSubmit: () => void;
};

export const SignupCardCombined = ({ hint, onSubmit }: SignupCardCombinedProps) => {
    const { t } = useI18n();

    return (
        <AuthCardFrame mode="register" title={t.signUpTitle} body={t.signUpBody}>
            {hint ? <p className="text-sm text-tertiary">{hint}</p> : null}
            <Button size="lg" className="w-full" onPress={onSubmit}>
                {t.logIn}
            </Button>
            <div className="flex justify-center gap-1 text-center">
                <span className="text-sm text-tertiary">{t.alreadyHaveAccount}</span>
                <Button href="/login" color="link-color" size="md">
                    {t.logIn}
                </Button>
            </div>
        </AuthCardFrame>
    );
};
