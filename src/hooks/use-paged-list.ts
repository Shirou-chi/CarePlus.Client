import { useEffect, useRef, useState } from "react";

export const LIST_PAGE_SIZE = 5;

export function usePagedList<T>(items: readonly T[], resetKey: string, pageSize = LIST_PAGE_SIZE) {
    const [page, setPage] = useState(1);
    const anchorRef = useRef<HTMLDivElement>(null);
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(page, pages);
    const start = (current - 1) * pageSize;

    useEffect(() => {
        setPage(1);
    }, [resetKey]);

    const go = (next: number) => {
        setPage(Math.min(pages, Math.max(1, next)));
        anchorRef.current?.scrollIntoView({ block: "start" });
    };

    return {
        anchorRef,
        page: current,
        pages,
        slice: items.slice(start, start + pageSize),
        go,
        total: items.length,
        from: items.length === 0 ? 0 : start + 1,
        to: Math.min(start + pageSize, items.length),
    };
}
