import { Area, AreaChart, CartesianGrid, Label, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import type { BloodPressureReading } from "@/utils/health-records";
import { cx } from "@/utils/cx";
import { ActivityHeart, Edit01, Plus } from "@untitledui/icons";

type BpLineChartProps = {
    readings: BloodPressureReading[];
    locale: string;
    title: string;
    hint: string;
    emptyTitle: string;
    emptyBody: string;
    systolicLabel: string;
    diastolicLabel: string;
    axisLabel: string;
    addLabel: string;
    onAdd: () => void;
    onEdit?: (item: BloodPressureReading) => void;
    formatWhen?: (iso: string) => string;
};

export const BpLineChart = ({
    readings,
    locale,
    title,
    hint,
    emptyTitle,
    emptyBody,
    systolicLabel,
    diastolicLabel,
    axisLabel,
    addLabel,
    onAdd,
    onEdit,
    formatWhen,
}: BpLineChartProps) => {
    const isDesktop = useBreakpoint("lg");
    const data = readings.map((item) => ({
        date: new Date(item.recordedAt),
        systolic: item.systolic,
        diastolic: item.diastolic,
    }));

    return (
        <section className="flex min-h-89 flex-col rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-md font-semibold text-primary">{title}</h2>
                    <p className="mt-1 text-sm text-tertiary">{hint}</p>
                </div>
                {readings.length > 0 && onEdit ? (
                    <Dropdown.Root>
                        <Dropdown.DotsButton />
                        <Dropdown.Popover className="w-64">
                            <Dropdown.Menu>
                                {readings.map((item) => (
                                    <Dropdown.Item key={item.id} icon={Edit01} onAction={() => onEdit(item)}>
                                        {`${item.systolic}/${item.diastolic} · ${formatWhen ? formatWhen(item.recordedAt) : ""}`}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                ) : null}
            </div>
            {data.length === 0 ? (
                <EmptyState size="sm" className="flex-1 justify-center py-6">
                    <EmptyState.Header pattern="circle">
                        <EmptyState.FeaturedIcon icon={ActivityHeart} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>{emptyTitle}</EmptyState.Title>
                        <EmptyState.Description>{emptyBody}</EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState>
            ) : (
                <div className="flex h-60 flex-col gap-2">
                    <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} className="h-full">
                        <AreaChart data={data} className="text-tertiary [&_.recharts-text]:text-xs" margin={{ top: isDesktop ? 12 : 6, bottom: isDesktop ? 16 : 0 }}>
                            <defs>
                                <linearGradient id="bp-sys-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="currentColor" className="text-utility-brand-700" stopOpacity="0.7" />
                                    <stop offset="95%" stopColor="currentColor" className="text-utility-brand-700" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />
                            <Legend
                                align="right"
                                verticalAlign="top"
                                layout={isDesktop ? "vertical" : "horizontal"}
                                content={<ChartLegendContent className="-translate-y-2" />}
                            />
                            <XAxis
                                fill="currentColor"
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                                dataKey="date"
                                padding={{ left: 10, right: 10 }}
                                tickFormatter={(value) =>
                                    new Date(value as string | number | Date).toLocaleDateString(locale, { month: "short", day: "numeric" })
                                }
                            />
                            <YAxis fill="currentColor" axisLine={false} tickLine={false} domain={[40, 200]} interval="preserveStartEnd">
                                {isDesktop ? (
                                    <Label
                                        value={axisLabel}
                                        fill="currentColor"
                                        className="text-xs! font-medium"
                                        style={{ textAnchor: "middle" }}
                                        angle={-90}
                                        position="insideLeft"
                                    />
                                ) : null}
                            </YAxis>
                            <Tooltip
                                content={<ChartTooltipContent />}
                                formatter={(value) => `${value} mmHg`}
                                labelFormatter={(value) =>
                                    new Date(value as string | number | Date).toLocaleString(locale, {
                                        day: "numeric",
                                        month: "short",
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })
                                }
                                cursor={{ className: "stroke-utility-brand-600 stroke-2" }}
                            />
                            <Area
                                isAnimationActive={false}
                                className={cx("text-utility-brand-700", "[&_.recharts-area-area]:translate-y-1.5 [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]")}
                                dataKey="systolic"
                                name={systolicLabel}
                                type="monotone"
                                stroke="currentColor"
                                strokeWidth={2}
                                fill="url(#bp-sys-fill)"
                                fillOpacity={0.1}
                                activeDot={{ className: "fill-bg-primary stroke-utility-brand-700 stroke-2" }}
                            />
                            <Area
                                isAnimationActive={false}
                                className="text-utility-brand-400"
                                dataKey="diastolic"
                                name={diastolicLabel}
                                type="monotone"
                                stroke="currentColor"
                                strokeWidth={2}
                                fill="transparent"
                                activeDot={{ className: "fill-bg-primary stroke-utility-brand-400 stroke-2" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            <div className="mt-4 flex justify-end">
                <Button color="secondary" size="sm" iconLeading={Plus} onClick={onAdd}>
                    {addLabel}
                </Button>
            </div>
        </section>
    );
};
