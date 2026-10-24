import { ANNOUNCEMENTS_SEEDED_ID, mergeAnnouncementNotices, sortNotices, type ClinicNotice } from "./notifications.ts";

const posts = [{ id: "flu", postedOn: "2026-10-18", title: "Flu shot" }];
const marker = {
    id: ANNOUNCEMENTS_SEEDED_ID,
    copyKey: "notifAnnouncementNav",
    actor: "CarePlus Clinic",
    initials: "CC",
    kind: "announcement",
    href: "/announcements",
    createdAt: "2026-10-18T00:00:00.000Z",
    unread: false,
} satisfies ClinicNotice;

const first = mergeAnnouncementNotices([], posts);
const flu = first.find((item) => item.id === "announcement:flu");
if (!flu || flu.text !== "Flu shot" || flu.unread !== true) {
    throw new Error("announcement missing");
}

const seeded = mergeAnnouncementNotices([marker], posts);
if (seeded.some((item) => item.id === "announcement:flu")) {
    throw new Error("deleted announcement came back");
}

const kept = mergeAnnouncementNotices([{ ...flu, unread: false }, marker], [{ ...posts[0], title: "流感疫苗" }]);
const updated = kept.find((item) => item.id === "announcement:flu");
if (!updated || updated.text !== "流感疫苗" || updated.unread !== false) {
    throw new Error("saved announcement did not keep read state");
}

const sample = [
    { ...marker, id: "newer", createdAt: "2026-10-20T02:00:00.000Z" },
    { ...marker, id: "older", createdAt: "2026-10-18T00:00:00.000Z" },
];
if (sortNotices(sample)[0]?.id !== "newer" || sortNotices(sample, "oldest")[0]?.id !== "older") {
    throw new Error("notice order is wrong");
}
const onDay = sortNotices(sample, "date", "2026-10-18", "2026-10-18");
if (onDay.length !== 1 || onDay[0]?.id !== "older") {
    throw new Error("date filter is wrong");
}
const open = sortNotices(sample, "date");
if (open.length !== 2 || open[0]?.id !== "newer") {
    throw new Error("open date range is wrong");
}
const fromStart = sortNotices(sample, "date", "2026-10-19");
if (fromStart.length !== 1 || fromStart[0]?.id !== "newer") {
    throw new Error("start date is wrong");
}
const untilEnd = sortNotices(sample, "date", "", "2026-10-18");
if (untilEnd.length !== 1 || untilEnd[0]?.id !== "older") {
    throw new Error("end date is wrong");
}

console.log("notifications ok");
