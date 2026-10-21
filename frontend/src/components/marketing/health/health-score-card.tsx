import { BadgeWithIcon } from "@/components/base/badges/badges";
import type { HealthScore } from "@/utils/health-records";
import { ArrowDown, ArrowUp } from "@untitledui/icons";

type HealthScoreCardProps = {
    score: HealthScore;
    title: string;
    subtitle: string;
    heading: string;
    body: string;
    emptyLabel: string;
};

const RING_SIZE = 208;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 86;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export const HealthScoreCard = ({ score, title, subtitle, heading, body, emptyLabel }: HealthScoreCardProps) => {
    const empty = score.band === "empty";
    const fill = empty ? 0 : score.value;
    const trendUp = (score.trendPercent ?? 0) > 0;
    const dash = (fill / 100) * RING_LENGTH;

    return (
        <section className="flex min-h-89 flex-col rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary md:p-6">
            <div>
                <h2 className="text-md font-semibold text-primary">{title}</h2>
                <p className="mt-1 text-sm text-tertiary">{subtitle}</p>
            </div>
            <div className="relative mx-auto mt-4 size-52">
                {score.trendPercent != null && !empty ? (
                    <div className="absolute top-2 right-2 z-10">
                        <BadgeWithIcon type="pill-color" size="sm" color={trendUp ? "error" : "success"} iconLeading={trendUp ? ArrowUp : ArrowDown}>
                            {`${score.trendPercent > 0 ? "+" : ""}${score.trendPercent}%`}
                        </BadgeWithIcon>
                    </div>
                ) : null}
                <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="size-full -rotate-90" aria-hidden="true">
                    <circle
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={RING_RADIUS}
                        fill="none"
                        strokeWidth="16"
                        className="stroke-utility-neutral-200"
                    />
                    <circle
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={RING_RADIUS}
                        fill="none"
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${RING_LENGTH}`}
                        className="stroke-utility-brand-600"
                    />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-full text-center text-xs leading-none font-medium text-tertiary">
                        {empty ? emptyLabel : heading}
                    </p>
                    <p className="text-display-sm leading-none font-semibold text-primary">{empty ? "—" : `${score.value}%`}</p>
                </div>
            </div>
            <p className="mt-auto pt-4 text-sm text-tertiary">{body}</p>
        </section>
    );
};
