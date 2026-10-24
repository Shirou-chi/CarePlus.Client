import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";
import { passwordMeter } from "@/utils/password";

const fill = {
    weak: "bg-error-solid",
    medium: "bg-warning-solid",
    strong: "bg-success-solid",
};

const labelColor = {
    weak: "text-error-primary",
    medium: "text-warning-primary",
    strong: "text-success-primary",
};

export const PasswordStrengthBar = ({ password }: { password: string }) => {
    const { t } = useI18n();
    const meter = passwordMeter(password);
    if (!meter) {
        return null;
    }
    const label = meter.level === "weak" ? t.passwordWeak : meter.level === "medium" ? t.passwordMedium : t.passwordStrong;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-quaternary" aria-hidden>
                <div className={cx("h-full rounded-full transition-[width] duration-200 ease-out", fill[meter.level])} style={{ width: `${meter.score}%` }} />
            </div>
            <p className={cx("text-sm font-medium", labelColor[meter.level])}>{label}</p>
        </div>
    );
};
