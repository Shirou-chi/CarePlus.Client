import { useCallback, useEffect, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent, type SVGProps } from "react";
import { HOME_TOUR_EVENT, HomeTour, homeTourSeen, markHomeTourSeen, takeHomeTourRequest } from "@/components/marketing/home/home-tour";
import { peekItemWidth } from "@/components/marketing/home/service-nav-layout";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export type ServiceNavItem = {
    label: string;
    href: string;
    hint: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
    tone: string;
};

export const ServiceNav = ({ items }: { items: ServiceNavItem[] }) => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const frame = useRef<HTMLElement>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const drag = useRef<{ x: number; left: number } | null>(null);
    const blockClick = useRef(false);
    const [canScroll, setCanScroll] = useState(false);
    const [tourStep, setTourStep] = useState<number | null>(null);

    useEffect(() => {
        if (!profile?.id) {
            setTourStep(null);
            return;
        }
        if (takeHomeTourRequest() || !homeTourSeen(profile.id)) setTourStep(0);
    }, [profile?.id]);

    useEffect(() => {
        const open = () => {
            takeHomeTourRequest();
            setTourStep(0);
        };
        window.addEventListener(HOME_TOUR_EVENT, open);
        return () => window.removeEventListener(HOME_TOUR_EVENT, open);
    }, []);

    const closeTour = useCallback(() => {
        if (profile?.id) markHomeTourSeen(profile.id);
        setTourStep(null);
    }, [profile?.id]);

    useEffect(() => {
        const frameEl = frame.current;
        const el = scroller.current;
        if (!frameEl || !el) return;
        const apply = () => {
            const links = [...el.querySelectorAll("a")];
            links.forEach((link) => {
                link.style.width = "";
                link.style.minWidth = "";
            });
            const mobile = window.matchMedia("(max-width: 639px)").matches;
            if (!mobile) {
                const natural = links[0]?.getBoundingClientRect().width ?? 0;
                const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
                const width = peekItemWidth(el.clientWidth, natural, gap, links.length);
                if (width) {
                    const px = `${width}px`;
                    links.forEach((link) => {
                        link.style.width = px;
                        link.style.minWidth = px;
                    });
                }
            }
            setCanScroll(el.scrollWidth > el.clientWidth + 4);
        };
        apply();
        const observer = new ResizeObserver(apply);
        observer.observe(frameEl);
        return () => observer.disconnect();
    }, [items.length]);

    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const onWheel = (event: WheelEvent) => {
            if (el.scrollWidth <= el.clientWidth + 4) return;
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            const max = el.scrollWidth - el.clientWidth;
            const atEnd = event.deltaY > 0 && el.scrollLeft >= max - 1;
            const atStart = event.deltaY < 0 && el.scrollLeft <= 0;
            if (atEnd || atStart) return;
            el.scrollLeft += event.deltaY;
            event.preventDefault();
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (tourStep !== null || event.button !== 0) return;
        const el = scroller.current;
        if (!el || el.scrollWidth <= el.clientWidth + 4) return;
        drag.current = { x: event.clientX, left: el.scrollLeft };
        blockClick.current = false;
        el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current || !scroller.current) return;
        const dx = event.clientX - drag.current.x;
        if (Math.abs(dx) > 6) blockClick.current = true;
        scroller.current.scrollLeft = drag.current.left - dx;
    };

    const onPointerUp = () => {
        drag.current = null;
    };

    const tourItem = tourStep === null ? null : tourStep === 0 ? { label: t.tourNavTitle, hint: t.tourNav } : items[tourStep - 1];

    return (
        <nav ref={frame} aria-label={t.exploreCareplus} className="mx-auto w-full min-w-0 max-w-container px-4 py-8 md:px-8 md:py-10">
            <h2 className="text-lg font-bold text-primary md:text-xl">{t.exploreCareplus}</h2>
            <div
                ref={scroller}
                data-service-row=""
                className={cx(
                    "mt-5 flex min-w-0 touch-pan-x gap-7 overflow-x-auto [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden",
                    canScroll && "cursor-grab active:cursor-grabbing",
                )}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClickCapture={(event) => {
                    if (!blockClick.current) return;
                    event.preventDefault();
                    event.stopPropagation();
                    blockClick.current = false;
                }}
            >
                {items.map((item, index) => (
                    <a
                        key={item.label}
                        href={item.href}
                        ref={(node) => {
                            itemRefs.current[index] = node;
                        }}
                        className="flex w-[calc((100%-5.25rem)/3.5)] min-w-[calc((100%-5.25rem)/3.5)] shrink-0 flex-col items-center gap-2.5 outline-focus-ring focus-visible:outline-2 sm:w-20 sm:min-w-20 md:w-[5.5rem] md:min-w-[5.5rem]"
                    >
                        <span className={cx("flex aspect-square w-full max-w-[4.25rem] items-center justify-center rounded-[1.35rem] md:max-w-[4.75rem]", item.tone)}>
                            <item.Icon className="size-7" />
                        </span>
                        <span className="text-center text-xs font-medium text-tertiary md:text-sm">{item.label}</span>
                    </a>
                ))}
            </div>
            {tourItem && tourStep !== null ? (
                <HomeTour
                    label={tourItem.label}
                    hint={tourItem.hint}
                    step={tourStep}
                    total={items.length + 1}
                    targets={itemRefs}
                    onSkip={closeTour}
                    onBack={() => {
                        if (tourStep > 0) setTourStep(tourStep - 1);
                    }}
                    onNext={() => {
                        if (tourStep + 1 < items.length + 1) {
                            setTourStep(tourStep + 1);
                            return;
                        }
                        const row = scroller.current;
                        if (row) {
                            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) row.scrollLeft = 0;
                            else row.scrollTo({ left: 0, behavior: "smooth" });
                        }
                        closeTour();
                    }}
                />
            ) : null}
        </nav>
    );
};
