import { cx } from "@/utils/cx";

type FormStatusProps = {
    error?: string | null;
    success?: string | null;
    className?: string;
};

export const FormStatus = ({ error, success, className }: FormStatusProps) => {
    if (error) {
        return (
            <p role="alert" className={cx("text-sm text-error-primary", className)}>
                {error}
            </p>
        );
    }

    if (success) {
        return (
            <p className={cx("text-sm text-fg-success-primary", className)}>
                {success}
            </p>
        );
    }

    return null;
};
