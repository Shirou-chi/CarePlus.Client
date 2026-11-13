import { useEffect, useState, type AnimationEvent, type ReactNode } from "react";
import { useLocation, type Location } from "react-router";
import { useAuth } from "@/providers/auth-provider";
import { useOutstandingInvoices } from "@/providers/outstanding-invoices";
import { isOverdueLockedPath } from "@/utils/invoices";

type PatientPageTransitionProps = {
    enabled: boolean;
    children: (location: Location) => ReactNode;
};

/** Fade patient pages in/out on route change. Staff routes stay instant. */
export const PatientPageTransition = ({ enabled, children }: PatientPageTransitionProps) => {
    const location = useLocation();
    const { profile } = useAuth();
    const { overdue, ready: invoicesReady } = useOutstandingInvoices();
    const [rendered, setRendered] = useState(location);
    const [phase, setPhase] = useState<"enter" | "exit">("enter");
    const skipLockedEnter = Boolean(profile && invoicesReady && overdue && isOverdueLockedPath(location.pathname));

    useEffect(() => {
        if (!enabled) {
            setRendered(location);
            setPhase("enter");
            return;
        }

        if (location.pathname === rendered.pathname && location.search === rendered.search) {
            return;
        }

        // Overdue lock: never fade into a blocked page (AppRoutes replaces to /invoices).
        if (skipLockedEnter || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setRendered(location);
            setPhase("enter");
            return;
        }

        setPhase("exit");
    }, [enabled, location, rendered.pathname, rendered.search, skipLockedEnter]);

    const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget || phase !== "exit") return;
        setRendered(location);
        setPhase("enter");
    };

    return (
        <div
            className={enabled ? `careplus-route careplus-route--${phase}` : undefined}
            onAnimationEnd={onAnimationEnd}
        >
            {children(enabled ? rendered : location)}
        </div>
    );
};
