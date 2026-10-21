import { Link as AriaLink } from "react-aria-components";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export const CarePlusLogo = ({
    className,
    href = "/",
    wordmark = true,
}: {
    className?: string;
    href?: string;
    wordmark?: boolean;
}) => {
    const { t } = useI18n();

    return (
        <AriaLink href={href} className={cx("flex w-max items-center gap-2.5 md:gap-3", className)}>
            <img src="/clinic-logo.png" alt="" className="size-11 shrink-0 rounded-[0.85rem] object-contain md:size-12" />
            {wordmark ? (
                <span className="min-w-0 leading-tight">
                    <span className="block truncate text-md font-semibold text-primary [font-family:var(--font-display)] md:text-lg">{t.clinicName}</span>
                    <span className="mt-0.5 hidden text-xs text-tertiary sm:block">{t.tagline}</span>
                </span>
            ) : null}
        </AriaLink>
    );
};
