import { useEffect, useState, type AnimationEvent, type ReactNode } from "react";
import { useLocation, type Location } from "react-router";

type PatientPageTransitionProps = {
    enabled: boolean;
    children: (location: Location) => ReactNode;
};

/** Fade patient pages in/out on route change. Staff routes stay instant. */
export const PatientPageTransition = ({ enabled, children }: PatientPageTransitionProps) => {
    const location = useLocation();
    const [rendered, setRendered] = useState(location);
    const [phase, setPhase] = useState<"enter" | "exit">("enter");

    useEffect(() => {
        if (!enabled) {
            setRendered(location);
            setPhase("enter");
            return;
        }

        if (location.pathname === rendered.pathname && location.search === rendered.search) {
            return;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setRendered(location);
            setPhase("enter");
            return;
        }

        setPhase("exit");
    }, [enabled, location, rendered.pathname, rendered.search]);

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
