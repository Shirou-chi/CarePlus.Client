export type TrailAction = "POP" | "PUSH" | "REPLACE";

/** Top-level destinations that start a fresh trail instead of stacking forever. */
const TRAIL_ROOTS = new Set([
    "/about",
    "/contact",
    "/announcements",
    "/login",
    "/register",
    "/forgot-password",
    "/account",
    "/book",
    "/visits",
    "/history",
    "/queue",
    "/invoices",
    "/payments",
    "/records",
    "/family",
    "/medicine",
    "/orders",
    "/clinic-records",
    "/chat",
    "/notifications",
    "/doctors",
]);

const keepsParent = (from: string, to: string) => {
    if (to === "/doctors" && from === "/book") return true;
    if (to.startsWith("/doctors/") && (from === "/doctors" || from === "/book")) return true;
    if (to.startsWith("/medicine/") && from === "/medicine") return true;
    if ((to === "/cart" || to === "/checkout") && (from === "/medicine" || from === "/cart" || from.startsWith("/medicine/"))) return true;
    if (to === "/checkout" && from === "/cart") return true;
    if (/^\/invoices\/[^/]+\/pay$/.test(to) && from === "/invoices") return true;
    if (
        (to === "/pay/stripe/return" || to === "/pay/sandbox") &&
        (/^\/invoices\/[^/]+\/pay$/.test(from) || from === "/checkout")
    ) {
        return true;
    }
    if (to === "/clinic-records" && (from === "/invoices" || from === "/payments")) return true;
    if (to === "/notifications" && from === "/account") return true;
    if (to === "/cart" && (from === "/account" || from === "/notifications")) return true;
    return false;
};

export const nextTrail = (current: string[], pathname: string, action: TrailAction): string[] => {
    if (pathname === "/" || pathname === "/home") return [];
    if (current[current.length - 1] === pathname) return current;

    const earlier = current.lastIndexOf(pathname);
    if (earlier >= 0) return current.slice(0, earlier + 1);

    if (action === "POP") return [pathname];

    const from = current[current.length - 1];
    if (from && keepsParent(from, pathname)) return [...current, pathname];

    // Footer / header jumps to another top-level page replace the trail
    if (TRAIL_ROOTS.has(pathname) || !from) return [pathname];

    return [...current, pathname];
};
