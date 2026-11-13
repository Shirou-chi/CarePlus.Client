/**
 * Clears leftover #root zoom.
 * outerWidth/innerWidth is not a reliable browser-zoom signal (side panels,
 * embedded browsers, and window chrome all throw it off), and applying CSS
 * zoom there shrinks the page while body stays full-bleed — footer looks mid-screen.
 */
export const syncBrowserZoomCompensation = () => {
    document.getElementById("root")?.style.removeProperty("zoom");
};
