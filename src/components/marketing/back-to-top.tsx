import { useEffect, useState } from "react";
import { ArrowUp } from "@untitledui/icons";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

type BackToTopProps = {
    /** Lift above the chat FAB when it is on screen. */
    offsetForChat?: boolean;
    /** Lift above the booking page mobile sticky action bar. */
    liftAboveStickyBar?: boolean;
};

export const BackToTop = ({ offsetForChat = false, liftAboveStickyBar = false }: BackToTopProps) => {
    const { t } = useI18n();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 480);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div
            className={cx(
                "fixed right-4 z-40 md:right-8",
                offsetForChat && liftAboveStickyBar
                    ? "bottom-[calc(14.5rem+env(safe-area-inset-bottom))] lg:bottom-[calc(6.75rem+env(safe-area-inset-bottom))]"
                    : offsetForChat
                      ? "bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-[calc(6.75rem+env(safe-area-inset-bottom))]"
                      : "bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:bottom-[max(2rem,env(safe-area-inset-bottom))]",
                "transition-[opacity,transform] duration-200 ease-out",
                visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
            )}
            aria-hidden={!visible}
        >
            <button
                type="button"
                aria-label={t.backToTop}
                tabIndex={visible ? undefined : -1}
                className="careplus-ink flex size-12 items-center justify-center rounded-full text-white shadow-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() =>
                    window.scrollTo({
                        top: 0,
                        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    })
                }
            >
                <ArrowUp className="size-5" />
            </button>
        </div>
    );
};
