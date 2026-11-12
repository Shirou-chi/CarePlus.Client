import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export type ProgressStepItem = {
    title: string;
    description: string;
};

export const ProgressSteps = ({
    steps,
    current,
    onSelect,
}: {
    steps: ProgressStepItem[];
    current: number;
    onSelect: (index: number) => void;
}) => {
    const activeStep = steps[current];

    return (
        <div>
            <p className="mb-3 text-sm text-tertiary md:hidden">
                {current + 1} / {steps.length}{" "}
                <span className="font-semibold text-primary">{activeStep?.title}</span>
            </p>

            <div>
                <ol className="flex w-full items-start gap-1 sm:gap-2 md:gap-3">
                    {steps.map((step, index) => {
                        const complete = index < current;
                        const active = index === current;
                        const reachable = index <= current;

                        return (
                            <li key={step.title} className="flex min-w-0 flex-1 items-start">
                                <button
                                    type="button"
                                    disabled={!reachable}
                                    aria-current={active ? "step" : undefined}
                                    aria-label={`${index + 1}. ${step.title}`}
                                    className="flex w-full min-w-0 flex-col items-center gap-1.5 text-center outline-focus-ring focus-visible:outline-2 disabled:cursor-default sm:gap-2"
                                    onClick={() => reachable && onSelect(index)}
                                >
                                    <span
                                        className={cx(
                                            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2",
                                            complete && "bg-brand-solid text-white ring-brand-solid",
                                            active && "bg-brand-solid text-white ring-brand-solid",
                                            !complete && !active && "bg-primary text-tertiary ring-secondary",
                                        )}
                                    >
                                        {complete ? <Check className="size-4" /> : index + 1}
                                    </span>
                                    <span className="hidden min-w-0 sm:block">
                                        <span className={cx("block truncate text-sm font-semibold", active || complete ? "text-brand-secondary" : "text-tertiary")}>
                                            {step.title}
                                        </span>
                                        <span className="mt-0.5 hidden truncate text-xs text-tertiary md:block">{step.description}</span>
                                    </span>
                                </button>
                                {index < steps.length - 1 ? (
                                    <span
                                        className={cx("mt-4 hidden h-px w-3 shrink-0 bg-border-secondary sm:block sm:flex-1", complete && "bg-fg-brand-primary")}
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
};
