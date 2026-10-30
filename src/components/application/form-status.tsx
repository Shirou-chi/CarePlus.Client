import { cx } from "@/utils/cx";

type FormStatusProps = {
    error?: string | null;
    success?: string | null;
    details?: string[];
    className?: string;
};

export const FormStatus = ({ error, success, details, className }: FormStatusProps) => {
    const items = details?.filter(Boolean) ?? [];

    if (error || items.length > 0) {
        return (
            <div role="alert" className={cx("rounded-xl border border-error bg-error-primary px-4 py-3 text-sm text-error-primary", className)}>
                {error ? <p className="font-semibold whitespace-pre-line">{error}</p> : null}
                {items.length > 0 ? (
                    <ul className={cx("list-disc space-y-1 pl-5 font-medium", error && "mt-2")}>
                        {items.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                ) : null}
            </div>
        );
    }

    if (success) {
        return (
            <p role="status" aria-live="polite" className={cx("rounded-xl bg-success-secondary px-4 py-3 text-sm font-semibold text-success-primary dark:text-white", className)}>
                {success}
            </p>
        );
    }

    return null;
};
