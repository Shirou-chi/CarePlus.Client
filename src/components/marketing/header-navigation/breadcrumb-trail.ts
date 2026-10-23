export type TrailAction = "POP" | "PUSH" | "REPLACE";

export const nextTrail = (current: string[], pathname: string, action: TrailAction): string[] => {
    if (pathname === "/" || pathname === "/home") return [];
    if (current[current.length - 1] === pathname) return current;
    const earlier = current.lastIndexOf(pathname);
    if (earlier >= 0) return current.slice(0, earlier + 1);
    if (action === "POP") return [pathname];
    return [...current, pathname];
};
