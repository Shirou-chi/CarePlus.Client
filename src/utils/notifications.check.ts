import { sortNotices, type ClinicNotice } from "./notifications.ts";

const sample: ClinicNotice[] = [
    {
        id: "newer",
        title: "Newer",
        message: "Newer",
        titleZh: "较新",
        messageZh: "较新",
        actor: "CarePlus Clinic",
        initials: "CC",
        kind: "announcement",
        href: "/announcements",
        createdAt: "2026-10-20T02:00:00.000Z",
        unread: true,
    },
    {
        id: "older",
        title: "Older",
        message: "Older",
        titleZh: "较旧",
        messageZh: "较旧",
        actor: "CarePlus Clinic",
        initials: "CC",
        kind: "announcement",
        href: "/announcements",
        createdAt: "2026-10-18T00:00:00.000Z",
        unread: true,
    },
];

if (sortNotices(sample)[0]?.id !== "newer" || sortNotices(sample, "oldest")[0]?.id !== "older") {
    throw new Error("notice order is wrong");
}

const onDay = sortNotices(sample, "date", "2026-10-18", "2026-10-18");
if (onDay.length !== 1 || onDay[0]?.id !== "older") {
    throw new Error("date filter is wrong");
}

console.log("notifications ok");
