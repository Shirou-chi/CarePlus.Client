import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";

const TOUR_KEY = "careplus-home-tour-v2";
const TOUR_OPEN = "careplus-open-tour";

export const requestHomeTour = () => {
    sessionStorage.setItem(TOUR_OPEN, "1");
    window.dispatchEvent(new Event(TOUR_OPEN));
};

export const takeHomeTourRequest = () => {
    if (sessionStorage.getItem(TOUR_OPEN) !== "1") return false;
    sessionStorage.removeItem(TOUR_OPEN);
    return true;
};

export const HOME_TOUR_EVENT = TOUR_OPEN;

export const homeTourSeen = (profileId: string) => {
    try {
        const raw = localStorage.getItem(TOUR_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) && list.includes(profileId);
    } catch {
        return false;
    }
};

export const markHomeTourSeen = (profileId: string) => {
    try {
        const raw = localStorage.getItem(TOUR_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(list) ? list.filter((item) => typeof item === "string") : [];
        if (!next.includes(profileId)) next.push(profileId);
        localStorage.setItem(TOUR_KEY, JSON.stringify(next));
    } catch {
        // The tour can still close for this visit.
    }
};

type HomeTourProps = {
    label: string;
    hint: string;
    step: number;
    total: number;
    targets: RefObject<(HTMLAnchorElement | null)[]>;
    onSkip: () => void;
    onBack: () => void;
    onNext: () => void;
};

const visibleTour = (name: string) => {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-tour='${name}']`);
    for (const node of nodes) {
        if (node.getClientRects().length > 0) return node;
    }
    return null;
};

type Box = { top: number; left: number; width: number; height: number };

const readBox = (target: HTMLElement): Box => {
    const next = target.getBoundingClientRect();
    return { top: next.top, left: next.left, width: next.width, height: next.height };
};

const mix = (from: number, to: number, t: number) => from + (to - from) * t;

export const HomeTour = ({ label, hint, step, total, targets, onSkip, onBack, onNext }: HomeTourProps) => {
    const { t } = useI18n();
    const titleId = useId();
    const [box, setBox] = useState<Box | null>(null);
    const boxRef = useRef<Box | null>(null);
    const frameRef = useRef<number | null>(null);
    const animating = useRef(false);

    const remember = (next: Box) => {
        boxRef.current = next;
        setBox(next);
    };

    useLayoutEffect(() => {
        const target = step === 0 ? visibleTour("tutorial") : targets.current[step - 1];
        const scroller = target?.closest<HTMLElement>("[data-service-row]") ?? null;
        if (!target) return;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

        const row = document.querySelector<HTMLElement>("[data-service-row]");
        if (!scroller && row) row.scrollTo({ left: 0, behavior: "smooth" });

        const max = scroller ? Math.max(0, scroller.scrollWidth - scroller.clientWidth) : 0;
        const desired = scroller ? Math.max(0, Math.min(target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2, max)) : 0;
        const rect = target.getBoundingClientRect();
        const header = 88;
        if (scroller && (rect.top < header || rect.bottom > window.innerHeight - 180)) {
            window.scrollBy({ top: rect.top - header - 24 });
        }

        const after = target.getBoundingClientRect();
        const fromScroll = scroller?.scrollLeft ?? 0;
        const endBox = { top: after.top, left: after.left - (desired - fromScroll), width: after.width, height: after.height };
        const fromBox = boxRef.current;
        const mobile = window.matchMedia("(max-width: 639px)").matches;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!mobile || reduce || !fromBox) {
            animating.current = false;
            if (scroller) scroller.scrollLeft = desired;
            remember(readBox(target));
            return;
        }

        const start = performance.now();
        const duration = 480;
        animating.current = true;
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - (1 - t) ** 3;
            if (scroller) scroller.scrollLeft = fromScroll + (desired - fromScroll) * eased;
            remember({
                top: mix(fromBox.top, endBox.top, eased),
                left: mix(fromBox.left, endBox.left, eased),
                width: mix(fromBox.width, endBox.width, eased),
                height: mix(fromBox.height, endBox.height, eased),
            });
            if (t < 1) {
                frameRef.current = requestAnimationFrame(tick);
                return;
            }
            animating.current = false;
            frameRef.current = null;
            remember(readBox(target));
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            animating.current = false;
        };
    }, [targets, step]);

    useEffect(() => {
        const target = step === 0 ? visibleTour("tutorial") : targets.current[step - 1];
        if (!target) return;
        const measure = () => {
            if (animating.current) return;
            remember(readBox(target));
        };
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [targets, step]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onSkip();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onSkip]);

    if (!box) return null;

    const tipWidth = Math.min(320, window.innerWidth - 32);
    const tipHeight = 200;
    const gap = 16;
    const hole = {
        x: Math.max(8, box.left - 8),
        y: Math.max(8, box.top - 8),
        width: box.width + 16,
        height: box.height + 16,
    };
    const holeRight = hole.x + hole.width;
    const holeBottom = hole.y + hole.height;
    const hitsHole = (left: number, top: number) =>
        left < holeRight + 8 && left + tipWidth > hole.x - 8 && top < holeBottom + 8 && top + tipHeight > hole.y - 8;
    let tipLeft = Math.max(8, Math.min(box.left + box.width / 2 - tipWidth / 2, window.innerWidth - tipWidth - 8));
    let tipTop = holeBottom + gap;
    if (tipTop + tipHeight > window.innerHeight - 8) tipTop = hole.y - gap - tipHeight;
    if (hitsHole(tipLeft, tipTop)) {
        const beside = hole.x - gap - tipWidth;
        tipLeft = beside >= 8 ? beside : Math.min(window.innerWidth - tipWidth - 8, holeRight + gap);
        tipTop = Math.max(8, Math.min(hole.y, window.innerHeight - tipHeight - 8));
    }
    tipLeft = Math.max(8, Math.min(tipLeft, window.innerWidth - tipWidth - 8));
    tipTop = Math.max(8, Math.min(tipTop, window.innerHeight - tipHeight - 8));
    if (hitsHole(tipLeft, tipTop)) {
        tipTop = Math.min(holeBottom + gap, window.innerHeight - tipHeight - 8);
        tipLeft = Math.max(8, hole.x - gap - tipWidth);
    }

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                    <mask id="careplus-tour-hole">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx="22" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(4, 15, 28, 0.72)" mask="url(#careplus-tour-hole)" />
            </svg>
            <div
                className="absolute z-[71] rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-secondary"
                style={{ left: tipLeft, top: tipTop, width: tipWidth }}
            >
                <p className="text-xs font-medium text-tertiary">
                    {step + 1} / {total}
                </p>
                <h2 id={titleId} className="mt-1 text-md font-semibold text-primary">
                    {label}
                </h2>
                <p className="mt-1.5 text-sm text-tertiary">{hint}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                    <Button color="tertiary" size="sm" onClick={onBack} isDisabled={step === 0}>
                        {t.tourBack}
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button color="tertiary" size="sm" onClick={onSkip}>
                            {t.tourSkip}
                        </Button>
                        <Button color="primary" size="sm" onClick={onNext}>
                            {step + 1 === total ? t.tourDone : t.tourNext}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
