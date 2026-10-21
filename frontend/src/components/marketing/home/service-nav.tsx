import type { ComponentType, SVGProps } from "react";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export type ServiceNavItem = {
    label: string;
    href: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    tone: string;
};

export const ServiceNav = ({ items }: { items: ServiceNavItem[] }) => {
    const { t } = useI18n();

    return (
        <nav aria-label={t.exploreCareplus} className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
            <h2 className="text-lg font-bold text-primary md:text-xl">{t.exploreCareplus}</h2>
            <div className="mt-5 flex flex-wrap gap-7 md:gap-8">
                {items.map((item) => (
                    <a key={item.label} href={item.href} className="flex w-20 shrink-0 flex-col items-center gap-2.5 outline-focus-ring focus-visible:outline-2 md:w-[5.5rem]">
                        <span className={cx("flex size-[4.25rem] items-center justify-center rounded-[1.35rem] md:size-[4.75rem]", item.tone)}>
                            <item.Icon className="size-7" />
                        </span>
                        <span className="text-center text-xs font-medium text-tertiary md:text-sm">{item.label}</span>
                    </a>
                ))}
            </div>
        </nav>
    );
};
