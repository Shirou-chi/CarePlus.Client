import { useCallback, useEffect, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent, type SVGProps } from "react";
import { Heading } from "react-aria-components";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { HOME_TOUR_EVENT, HomeTour, takeHomeTourRequest } from "@/components/marketing/home/home-tour";
import { peekItemWidth } from "@/components/marketing/home/service-nav-layout";
import { CloseButton } from "@/components/base/buttons/close-button";
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

export const ServiceNav = ({ items, allItems }: { items: ServiceNavItem[]; allItems: ServiceNavItem[] }) => {
    const { t } = useI18n();
    const { profile, hasCompletedTutorial, completeTutorial } = useAuth();
    const frame = useRef<HTMLElement>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);
    const allMenuRefs = useRef<(HTMLElement | null)[]>([]);
    const tourTargets = useRef<(HTMLElement | null)[]>([]);
    const drag = useRef<{ x: number; left: number; pointerId: number; captured: boolean } | null>(null);
    const blockClick = useRef(false);
    const [canScroll, setCanScroll] = useState(false);
    const [tourStep, setTourStep] = useState<number | null>(null);
    const [allMenuOpen, setAllMenuOpen] = useState(false);

    useEffect(() => {
        if (!profile?.id || hasCompletedTutorial === null) {
            setTourStep(null);
            return;
        }
        if (takeHomeTourRequest() || !hasCompletedTutorial) setTourStep(0);
    }, [hasCompletedTutorial, profile?.id]);

    useEffect(() => {
        const open = () => {
            takeHomeTourRequest();
            setTourStep(0);
        };
        window.addEventListener(HOME_TOUR_EVENT, open);
        return () => window.removeEventListener(HOME_TOUR_EVENT, open);
    }, []);

    const closeTour = useCallback(() => {
        if (profile?.id && !hasCompletedTutorial) {
            void completeTutorial().catch(() => undefined);
        }
        setTourStep(null);
        setAllMenuOpen(false);
    }, [completeTutorial, hasCompletedTutorial, profile?.id]);

    useEffect(() => {
        const frameEl = frame.current;
        const el = scroller.current;
        if (!frameEl || !el) return;
        const apply = () => {
            const links = [...el.querySelectorAll<HTMLElement>("[data-service-item]")];
            links.forEach((link) => {
                link.style.width = "";
                link.style.minWidth = "";
            });
            const mobile = window.matchMedia("(max-width: 639px)").matches;
            if (!mobile) {
                const natural = links[0]?.getBoundingClientRect().width ?? 0;
                const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
                const desktop = window.matchMedia("(min-width: 1024px)").matches;
                const fitWidth = desktop ? (el.clientWidth - gap * (links.length - 1)) / links.length : 0;
                const width = fitWidth >= 68 ? fitWidth : peekItemWidth(el.clientWidth, natural, gap, links.length);
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
        const preventNativeSelection = (event: Event) => event.preventDefault();
        el.addEventListener("selectstart", preventNativeSelection);
        el.addEventListener("dragstart", preventNativeSelection);

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
        return () => {
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("selectstart", preventNativeSelection);
            el.removeEventListener("dragstart", preventNativeSelection);
        };
    }, []);

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (tourStep !== null || event.button !== 0) return;
        const el = scroller.current;
        if (!el || el.scrollWidth <= el.clientWidth + 4) return;
        if (event.pointerType === "mouse") {
            event.preventDefault();
            window.getSelection()?.removeAllRanges();
        }
        drag.current = { x: event.clientX, left: el.scrollLeft, pointerId: event.pointerId, captured: false };
        blockClick.current = false;
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current || !scroller.current) return;
        const dx = event.clientX - drag.current.x;
        if (Math.abs(dx) <= 8) return;
        if (!drag.current.captured) {
            scroller.current.setPointerCapture(drag.current.pointerId);
            drag.current.captured = true;
        }
        window.getSelection()?.removeAllRanges();
        blockClick.current = true;
        scroller.current.scrollLeft = drag.current.left - dx;
    };

    const onPointerUp = () => {
        if (drag.current?.captured && scroller.current?.hasPointerCapture(drag.current.pointerId)) {
            scroller.current.releasePointerCapture(drag.current.pointerId);
        }
        drag.current = null;
    };

    const tourNavHint = () => {
        if (typeof window === "undefined") return t.tourNav;
        const tutorialVisible = [...document.querySelectorAll<HTMLElement>("[data-tour='tutorial']")].some((node) => node.getClientRects().length > 0);
        return tutorialVisible ? t.tourNav : t.tourNavMobile;
    };

    // Step 0 = Tutorial, step 1 = All, then each All-menu item one by one.
    const tourTotal = 2 + allItems.length;
    const tourOpensAll = tourStep !== null && tourStep >= 2;
    const showAllMenu = allMenuOpen || tourOpensAll;

    tourTargets.current = [itemRefs.current[0] ?? null, ...allMenuRefs.current.slice(0, allItems.length)];

    const tourItem =
        tourStep === null
            ? null
            : tourStep === 0
              ? { label: t.tourNavTitle, hint: tourNavHint() }
              : tourStep === 1
                ? { label: items[0]?.label ?? t.homeAll, hint: items[0]?.hint ?? t.homeAllHint }
                : allItems[tourStep - 2]
                  ? { label: allItems[tourStep - 2].label, hint: allItems[tourStep - 2].hint }
                  : null;

    // Remount tour once when the All menu first opens so highlight targets exist.
    const [tourReady, setTourReady] = useState(true);
    useEffect(() => {
        if (tourStep !== 2) {
            setTourReady(true);
            return;
        }
        setTourReady(false);
        let inner = 0;
        const outer = window.requestAnimationFrame(() => {
            inner = window.requestAnimationFrame(() => setTourReady(true));
        });
        return () => {
            window.cancelAnimationFrame(outer);
            window.cancelAnimationFrame(inner);
        };
    }, [tourStep]);

    return (
        <nav ref={frame} aria-label={t.exploreCareplus} className="mx-auto w-full min-w-0 max-w-container px-4 py-8 md:px-8 md:py-10">
            <h2 className="text-lg font-bold text-primary md:text-xl">{t.exploreCareplus}</h2>
            <div
                ref={scroller}
                data-service-row=""
                className={cx(
                    "mt-5 flex min-w-0 touch-pan-x select-none gap-7 overflow-x-auto [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden",
                    canScroll && "cursor-grab active:cursor-grabbing",
                )}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
                onMouseDown={(event) => {
                    if (canScroll) event.preventDefault();
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDragStart={(event) => event.preventDefault()}
                onClickCapture={(event) => {
                    if (!blockClick.current) return;
                    event.preventDefault();
                    event.stopPropagation();
                    blockClick.current = false;
                }}
            >
                {items.map((item, index) => {
                    const className =
                        "flex w-[calc((100%-5.25rem)/3.5)] min-w-[calc((100%-5.25rem)/3.5)] shrink-0 flex-col items-center gap-2.5 outline-focus-ring focus-visible:outline-2 sm:w-20 sm:min-w-20 md:w-[5.5rem] md:min-w-[5.5rem]";
                    const body = (
                        <>
                            <span className={cx("pointer-events-none flex aspect-square w-full max-w-[4.25rem] items-center justify-center rounded-[1.35rem] md:max-w-[4.75rem]", item.tone)}>
                                <item.Icon className="pointer-events-none size-7" />
                            </span>
                            <span className="pointer-events-none text-center text-xs font-medium text-tertiary md:text-sm">{item.label}</span>
                        </>
                    );

                    if (item.href === "#all") {
                        return (
                            <button
                                key={item.label}
                                type="button"
                                data-service-item=""
                                draggable={false}
                                ref={(node) => {
                                    itemRefs.current[index] = node;
                                }}
                                className={className}
                                onClick={() => setAllMenuOpen(true)}
                            >
                                {body}
                            </button>
                        );
                    }

                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            data-service-item=""
                            draggable={false}
                            ref={(node) => {
                                itemRefs.current[index] = node;
                            }}
                            className={className}
                        >
                            {body}
                        </a>
                    );
                })}
            </div>

            {showAllMenu ? (
                <ModalOverlay
                    isDismissable={tourStep === null}
                    isOpen
                    className="z-[60]"
                    onOpenChange={(open) => {
                        if (open) return;
                        if (tourStep !== null) {
                            closeTour();
                            return;
                        }
                        setAllMenuOpen(false);
                    }}
                >
                    <Modal className="w-full max-w-lg">
                        <Dialog className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-primary p-5 shadow-xl ring-1 ring-secondary outline-hidden sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <Heading slot="title" className="text-lg font-semibold text-primary">
                                        {t.homeMoreServices}
                                    </Heading>
                                    <p className="mt-1 text-sm text-tertiary">{t.homeMoreServicesHint}</p>
                                </div>
                                {tourStep === null ? (
                                    <CloseButton size="md" label="Close" onPress={() => setAllMenuOpen(false)} />
                                ) : null}
                            </div>
                            <ul className="mt-5 grid max-h-[min(28rem,70dvh)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                                {allItems.map((item, index) => (
                                    <li
                                        key={item.label}
                                        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                                        style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                                    >
                                        <a
                                            href={item.href}
                                            ref={(node) => {
                                                allMenuRefs.current[index] = node;
                                            }}
                                            className="flex items-center gap-3 rounded-2xl bg-primary px-3 py-3 ring-1 ring-secondary outline-focus-ring transition hover:ring-brand-secondary focus-visible:outline-2"
                                            onClick={(event) => {
                                                if (tourStep !== null) {
                                                    event.preventDefault();
                                                    return;
                                                }
                                                setAllMenuOpen(false);
                                            }}
                                        >
                                            <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-xl", item.tone)}>
                                                <item.Icon className="size-5" />
                                            </span>
                                            <span className="min-w-0 text-sm font-semibold text-primary">{item.label}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}

            {tourItem && tourStep !== null && tourReady ? (
                <HomeTour
                    label={tourItem.label}
                    hint={tourItem.hint}
                    step={tourStep}
                    total={tourTotal}
                    targets={tourTargets}
                    onSkip={closeTour}
                    onBack={() => {
                        if (tourStep > 0) setTourStep(tourStep - 1);
                    }}
                    onNext={() => {
                        if (tourStep + 1 < tourTotal) {
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
