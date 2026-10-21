import { ArrowLeft, Key01 } from "@untitledui/icons";
import { FormStatus } from "@/components/application/form-status";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { CarePlusLogo } from "@/components/foundations/logo/careplus-logo";
import { useI18n } from "@/providers/locale-provider";

type Step1ForgotPasswordProps = {
    error?: string | null;
    success?: string | null;
    isLoading?: boolean;
    onSubmit: (email: string) => void;
};

export const Step1ForgotPassword = ({ error, success, isLoading, onSubmit }: Step1ForgotPasswordProps) => {
    const { t } = useI18n();

    return (
        <section className="careplus-landing careplus-auth min-h-dvh px-4 py-12 md:px-8 md:pt-20">
            <div className="mx-auto flex w-full max-w-90 flex-col gap-8">
                <div className="flex justify-center">
                    <CarePlusLogo />
                </div>
                <div className="flex flex-col items-center gap-6 text-center">
                    <FeaturedIcon icon={Key01} color="brand" theme="light" size="lg" />
                    <div className="flex flex-col gap-2 md:gap-3">
                        <h1 className="text-xl font-semibold text-primary md:text-display-xs">{t.forgotTitle}</h1>
                        <p className="self-stretch text-md text-tertiary">{t.forgotBody}</p>
                    </div>
                </div>

                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = Object.fromEntries(new FormData(e.currentTarget));
                        onSubmit(String(data.email ?? ""));
                    }}
                    className="flex flex-col gap-6"
                >
                    <Input isRequired hideRequiredIndicator label={t.email} type="email" name="email" placeholder={t.emailPlaceholder} size="lg" />
                    <FormStatus error={error} success={success} />
                    <Button type="submit" size="lg" isLoading={isLoading} showTextWhileLoading>
                        {t.resetPassword}
                    </Button>
                </Form>

                <Button size="md" color="link-gray" href="/login" className="mx-auto" iconLeading={ArrowLeft}>
                    {t.backToLogIn}
                </Button>
            </div>
        </section>
    );
};
