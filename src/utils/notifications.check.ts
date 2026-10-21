import {
    formatNoticeAge,
    deleteNotices,
    markAllNoticesRead,
    markNoticeRead,
    readNotices,
    sanitizeNotices,
    seedNotices,
    unreadNotices,
    writeNotices,
} from "./notifications.ts";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
});

const now = Date.parse("2026-09-03T13:00:00+08:00");
const seed = seedNotices(now);
const key = "careplus-notices:patient-1";
const first = readNotices(key, now);
writeNotices(key, markNoticeRead(first, "n1"));
const afterRead = readNotices(key, now);

const checks = [
    seed.length === 7,
    unreadNotices(seed).length === 5,
    seed[0].copyKey === "notifVisitConfirmed",
    sanitizeNotices([{ id: "bad" }, seed[0]]).length === 1,
    markNoticeRead(seed, "n1").find((item) => item.id === "n1")?.unread === false,
    unreadNotices(markAllNoticesRead(seed)).length === 0,
    afterRead.find((item) => item.id === "n1")?.unread === false,
    deleteNotices(seed, ["n1", "n2"]).length === 5,
    deleteNotices(seed, seed.map((item) => item.id)).length === 0,
    formatNoticeAge(seed[0].createdAt, now, "en") === "12 min ago",
    formatNoticeAge(seed[6].createdAt, now, "zh") === "2 天前",
];

if (checks.some((ok) => !ok)) {
    throw new Error("dummy notices check failed");
}

console.log("dummy notices ok");
