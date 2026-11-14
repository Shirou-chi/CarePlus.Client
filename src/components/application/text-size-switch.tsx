import { cx } from "@/utils/cx";

export const TextSizeSwitch = ({
    value,
    onChange,
    label,
    normalLabel,
    largeLabel,
}: {
    value: "normal" | "large";
    onChange: (value: "normal" | "large") => void;
    label: string;
    normalLabel: string;
    largeLabel: string;
}) => (
    <div
        role="group"
        aria-label={label}
        className="inline-flex h-9 items-stretch overflow-hidden rounded-full bg-[#ececee] text-[#171717] ring-1 ring-black/10 dark:bg-[#3a3a3a] dark:text-white dark:ring-white/10"
    >
        <button
            type="button"
            aria-pressed={value === "normal"}
            onClick={() => onChange("normal")}
            className={cx(
                "flex min-w-11 items-center justify-center px-3 outline-focus-ring focus-visible:outline-2",
                value === "normal" ? "opacity-100" : "opacity-40 hover:opacity-70",
            )}
        >
            <span aria-hidden className="text-sm leading-none font-medium">
                A
            </span>
            <span className="sr-only">{normalLabel}</span>
        </button>
        <span aria-hidden className="my-2 w-px shrink-0 bg-current opacity-35" />
        <button
            type="button"
            aria-pressed={value === "large"}
            onClick={() => onChange("large")}
            className={cx(
                "flex min-w-11 items-center justify-center px-3 outline-focus-ring focus-visible:outline-2",
                value === "large" ? "opacity-100" : "opacity-40 hover:opacity-70",
            )}
        >
            <span aria-hidden className="text-xl leading-none font-medium">
                A
            </span>
            <span className="sr-only">{largeLabel}</span>
        </button>
    </div>
);
