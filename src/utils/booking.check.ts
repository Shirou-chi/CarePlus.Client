import { dummyProfile } from "./auth.ts";
import { bookAppointment, cancelAppointment, getBookingCatalog, getBookingSlots, isBookingClosed, listUpcomingVisits, listVisitHistory, rescheduleAppointment, rescheduleBlocked } from "./booking.ts";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
});

const catalog = getBookingCatalog(dummyProfile);
const slots = getBookingSlots("2026-12-01", "any", Date.parse("2026-11-01T00:00:00Z"));

const openSlot = slots.morning.find((item) => item.startAt.slice(0, 10) === "2026-12-01");
const booked = bookAppointment({
    profile: dummyProfile,
    doctorId: "lim",
    startAt: openSlot?.startAt ?? slots.morning[0].startAt,
    type: "general",
});
const upcoming = listUpcomingVisits(dummyProfile, Date.parse("2026-11-01T00:00:00Z"));
const upcomingTimes = upcoming.map((item) => Date.parse(item.startAt));

const checks = [
    catalog.family[0].id === dummyProfile.id,
    catalog.doctors.length === 5,
    catalog.types.length === 3,
    slots.morning.length === 24,
    slots.night.length === 24,
    slots.morning.every((item) => !item.booked),
    booked.doctorId === "lim",
    upcoming.some((item) => item.id === booked.id),
    upcomingTimes.every((time, index) => index === 0 || time >= upcomingTimes[index - 1]),
];

const now = Date.parse("2026-11-01T00:00:00Z");
cancelAppointment(dummyProfile, booked.id, now);
const afterCancel = listUpcomingVisits(dummyProfile, now);
const freed = getBookingSlots("2026-12-01", "lim", now).morning.find((item) => item.startAt === booked.startAt);
const replacement = getBookingSlots("2026-12-01", "lim", now).morning.find(
    (item) => item.startAt.slice(0, 10) === "2026-12-01" && !item.booked && item.startAt !== booked.startAt,
);
const movedSource = bookAppointment({
    profile: dummyProfile,
    doctorId: "tan",
    startAt: replacement?.startAt ?? "",
    type: "mental",
});
const moved = rescheduleAppointment(dummyProfile, movedSource.id, booked.startAt, now);
cancelAppointment(dummyProfile, "demo-next", now);

checks.push(
    !afterCancel.some((item) => item.id === booked.id),
    freed?.booked === false,
    moved.startAt === booked.startAt,
    !listUpcomingVisits(dummyProfile, now).some((item) => item.id === "demo-next" || item.startAt === movedSource.startAt),
);

const pool = getBookingSlots("2026-12-01", "lim", now).morning.filter((item) => item.startAt.slice(0, 10) === "2026-12-01" && !item.booked);
const limited = bookAppointment({ profile: dummyProfile, doctorId: "lim", startAt: pool[0].startAt, type: "general" });
rescheduleAppointment(dummyProfile, limited.id, pool[1].startAt, now);
rescheduleAppointment(dummyProfile, limited.id, pool[2].startAt, now);
rescheduleAppointment(dummyProfile, limited.id, pool[3].startAt, now);
let rescheduleHitLimit = false;
try {
    rescheduleAppointment(dummyProfile, limited.id, pool[4].startAt, now);
} catch (cause) {
    rescheduleHitLimit = cause instanceof Error && cause.message === "reschedule-limit";
}

cancelAppointment(dummyProfile, moved.id, now);
const extra = bookAppointment({ profile: dummyProfile, doctorId: "raj", startAt: pool[5].startAt, type: "general" }, now);
cancelAppointment(dummyProfile, extra.id, now);
let bookingClosed = false;
try {
    bookAppointment({ profile: dummyProfile, doctorId: "wong", startAt: pool[6].startAt, type: "screening" }, now);
} catch (cause) {
    bookingClosed = cause instanceof Error && cause.message === "booking-closed";
}

checks.push(rescheduleHitLimit, rescheduleBlocked(limited.id, now), isBookingClosed(now), bookingClosed);

const history = listVisitHistory(dummyProfile, now);
checks.push(
    history.some((item) => item.id === booked.id && item.status === "cancelled"),
    history.some((item) => item.id === "hist-lim" && item.forName === dummyProfile.fullName && item.recordId === "CR-2405"),
    history.every((item, index) => index === 0 || Date.parse(history[index - 1].startAt) >= Date.parse(item.startAt)),
    !history.some((item) => item.status === "confirmed" && Date.parse(item.startAt) > now),
);

if (checks.some((ok) => !ok)) {
    throw new Error("dummy booking check failed");
}

console.log("dummy booking ok");
