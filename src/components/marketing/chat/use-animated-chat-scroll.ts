import { useEffect, useRef } from "react";

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

export const useAnimatedChatScroll = (trigger: string, enabled = true) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const scroller = scrollRef.current;
        if (!scroller) return;

        if (animationRef.current !== null) {
            window.cancelAnimationFrame(animationRef.current);
        }

        const start = scroller.scrollTop;
        const target = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const distance = target - start;
        if (Math.abs(distance) < 1) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            scroller.scrollTop = target;
            return;
        }

        const duration = Math.min(700, Math.max(360, Math.abs(distance) * 0.7));
        const startedAt = window.performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - startedAt) / duration, 1);
            scroller.scrollTop = start + distance * easeOutCubic(progress);
            if (progress < 1) {
                animationRef.current = window.requestAnimationFrame(animate);
            } else {
                animationRef.current = null;
            }
        };

        animationRef.current = window.requestAnimationFrame(animate);
        return () => {
            if (animationRef.current !== null) {
                window.cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [enabled, trigger]);

    return scrollRef;
};
