/** Counteract desktop browser zoom so the layout keeps its normal size on screen. */
export const syncBrowserZoomCompensation = () => {
    const root = document.getElementById("root");
    if (!root) return;

    // Leave phones / tablets alone; pinch-zoom and layout there are different.
    if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(min-width: 1024px)").matches) {
        root.style.removeProperty("zoom");
        return;
    }

    const outer = window.outerWidth;
    const inner = window.innerWidth;
    if (!outer || !inner) return;

    const ratio = outer / inner;
    // Ignore ~100% zoom and junk readings.
    if (!Number.isFinite(ratio) || ratio < 0.18 || ratio > 5 || (ratio >= 0.92 && ratio <= 1.08)) {
        root.style.removeProperty("zoom");
        return;
    }

    // ponytail: outer/inner is the practical Chrome/Edge zoom signal on desktop
    // zoom-out (ratio < 1) → scale up; zoom-in (ratio > 1) → scale down
    root.style.zoom = String(Math.min(5, Math.max(0.2, 1 / ratio)));
};
