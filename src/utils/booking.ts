import type { Profile } from "@/utils/auth";
import { bookingFamily } from "./family.ts";

export type FamilyMember = {
    id: string;
    name: string;
    relation: string;
    isYou: boolean;
};

export type ClinicDoctor = {
    id: string;
    name: string;
    specialty: string;
    bio: string;
};

export type VisitType = {
    id: string;
    name: string;
    description: string;
};

export type BookingCatalog = {
    family: FamilyMember[];
    doctors: ClinicDoctor[];
    types: VisitType[];
};

export type TimeSlot = {
    startAt: string;
    label: string;
    booked: boolean;
};

export type BookingSlots = {
    date: string;
    doctorId: string;
    morning: TimeSlot[];
    night: TimeSlot[];
};

export type BookedAppointment = {
    id: string;
    forName: string;
    doctorId: string;
    doctorName: string;
    type: string;
    notes: string | null;
    startAt: string;
    endAt: string;
    status: string;
    recordId?: string;
};

const BOOKING_KEY = "careplus-dummy-bookings";
const LIMIT_KEY = "careplus-visit-limits";
const RESCHEDULES_PER_DAY = 3;
const CANCELS_BEFORE_BOOKING_CLOSES = 3;
const SLOT_MS = 30 * 60 * 1000;

export const dummyDoctors: ClinicDoctor[] = [
    { id: "lim", name: "Dr Lim Wei Hao", specialty: "Family medicine", bio: "Weekday GP clinics and long-term follow-up." },
    { id: "tan", name: "Dr Tan Mei Ling", specialty: "Mental wellness", bio: "Talks through stress, sleep, and mood at a steady pace." },
    { id: "raj", name: "Dr Rajesh Kumar", specialty: "General consultation", bio: "Acute visits, fever, and same-day concerns." },
    { id: "wong", name: "Dr Wong Shu Min", specialty: "Health screening", bio: "Body checks and screening follow-up." },
    { id: "lee", name: "Dr Lee Jun Jie", specialty: "After-hours GP", bio: "Night shift coverage for the 24-hour clinic." },
];

const types: VisitType[] = [
    { id: "general", name: "General consultation", description: "Cough, fever, skin, or a usual GP visit." },
    { id: "mental", name: "Mental wellness", description: "Stress, sleep, mood, or a quiet talk with a doctor." },
    { id: "screening", name: "Body check", description: "Health screening and routine checks." },
];

const pad = (value: number) => String(value).padStart(2, "0");

const klStamp = (date: string, hour: number, minute: number) => new Date(`${date}T${pad(hour)}:${pad(minute)}:00+08:00`);

const nextDay = (date: string) => {
    const next = new Date(klStamp(date, 0, 0).getTime() + 24 * 60 * 60 * 1000);
    return next.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
};

const rangeSlots = (from: Date, toInclusive: Date, taken: Set<string>, now: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let time = from.getTime(); time <= toInclusive.getTime(); time += SLOT_MS) {
        const start = new Date(time);
        const startAt = start.toISOString();
        slots.push({
            startAt,
            label: start.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }),
            booked: time <= now || taken.has(startAt),
        });
    }
    return slots;
};

type StoredLine = Partial<BookedAppointment> & { startAt?: string };

const readStored = (): StoredLine[] => {
    try {
        const raw = sessionStorage.getItem(BOOKING_KEY);
        const lines = raw ? (JSON.parse(raw) as unknown) : [];
        return Array.isArray(lines) ? lines.filter((line): line is StoredLine => !!line && typeof line === "object") : [];
    } catch {
        return [];
    }
};

const saveStored = (lines: StoredLine[]) => {
    sessionStorage.setItem(BOOKING_KEY, JSON.stringify(lines));
};

const readTaken = (): Set<string> =>
    new Set(
        readStored().flatMap((line) => (typeof line.startAt === "string" && line.status !== "cancelled" ? [line.startAt] : [])),
    );

const isVisit = (line: StoredLine): line is BookedAppointment =>
    typeof line.id === "string" &&
    typeof line.doctorId === "string" &&
    typeof line.forName === "string" &&
    typeof line.type === "string" &&
    typeof line.startAt === "string" &&
    typeof line.endAt === "string" &&
    typeof line.status === "string";

export const getBookingCatalog = (profile: Profile): BookingCatalog => ({
    family: bookingFamily(profile),
    doctors: dummyDoctors,
    types,
});

export const getBookingSlots = (date: string, doctorId: string, now = Date.now()): BookingSlots => {
    const taken = readTaken();
    const morning = rangeSlots(klStamp(date, 6, 0), klStamp(date, 17, 30), taken, now);
    const night = [
        ...rangeSlots(klStamp(date, 18, 0), klStamp(date, 23, 30), taken, now),
        ...rangeSlots(klStamp(nextDay(date), 0, 0), klStamp(nextDay(date), 5, 30), taken, now),
    ];
    return { date, doctorId, morning, night };
};

type DayLimits = { day: string; cancels: number; reschedules: Record<string, number> };

const klToday = (now: number) => new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

const readLimits = (now: number): DayLimits => {
    const day = klToday(now);
    try {
        const raw = sessionStorage.getItem(LIMIT_KEY);
        const parsed = raw ? (JSON.parse(raw) as DayLimits) : null;
        if (parsed?.day === day && parsed.reschedules) return parsed;
    } catch {
        // A bad saved value starts a fresh day count.
    }
    return { day, cancels: 0, reschedules: {} };
};

const writeLimits = (limits: DayLimits) => {
    sessionStorage.setItem(LIMIT_KEY, JSON.stringify(limits));
};

export const isBookingClosed = (now = Date.now()) => readLimits(now).cancels > CANCELS_BEFORE_BOOKING_CLOSES;

export const rescheduleBlocked = (id: string, now = Date.now()) => (readLimits(now).reschedules[id] ?? 0) >= RESCHEDULES_PER_DAY;

export const bookAppointment = (payload: {
    profile: Profile;
    doctorId: string;
    startAt: string;
    type: string;
    notes?: string;
}, now = Date.now()): BookedAppointment => {
    if (isBookingClosed(now)) {
        throw new Error("booking-closed");
    }

    const slots = getBookingSlots(payload.startAt.slice(0, 10), payload.doctorId);
    const all = [...slots.morning, ...slots.night];
    const selected = all.find((item) => item.startAt === payload.startAt);
    if (!selected || selected.booked) {
        throw new Error("That slot is already booked.");
    }

    const doctor = dummyDoctors.find((item) => item.id === payload.doctorId);
    const visit: BookedAppointment = {
        id: `apt-${Date.now()}`,
        forName: payload.profile.fullName,
        doctorId: payload.doctorId,
        doctorName: doctor?.name ?? "Any available doctor",
        type: payload.type,
        notes: payload.notes ?? null,
        startAt: payload.startAt,
        endAt: new Date(new Date(payload.startAt).getTime() + SLOT_MS).toISOString(),
        status: "confirmed",
    };
    saveStored([...readStored(), visit]);
    return visit;
};

const addDays = (date: string, days: number) => {
    let cursor = date;
    for (let i = 0; i < days; i += 1) cursor = nextDay(cursor);
    return cursor;
};

const demoVisit = (profile: Profile, date: string, hour: number, minute: number, doctorId: string, type: string, id: string): BookedAppointment => {
    const doctor = dummyDoctors.find((item) => item.id === doctorId) ?? dummyDoctors[0];
    const start = klStamp(date, hour, minute);
    return {
        id,
        forName: profile.fullName,
        doctorId,
        doctorName: doctor.name,
        type,
        notes: null,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + SLOT_MS).toISOString(),
        status: "confirmed",
    };
};

export const listUpcomingVisits = (profile: Profile, now = Date.now()): BookedAppointment[] => {
    const today = new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const stored = readStored().filter(isVisit);
    const replaced = new Set(stored.map((item) => item.id));
    const taken = new Set(stored.filter((item) => item.status === "confirmed").map((item) => item.startAt));
    const demos = [
        demoVisit(profile, addDays(today, 1), 10, 30, "tan", "mental", "demo-next"),
        demoVisit(profile, addDays(today, 4), 15, 0, "lim", "general", "demo-later"),
    ].filter((item) => !replaced.has(item.id) && !taken.has(item.startAt));

    return [...demos, ...stored]
        .filter((item) => item.status === "confirmed" && Date.parse(item.startAt) > now)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
};

const subDays = (date: string, days: number) => {
    const start = klStamp(date, 12, 0).getTime() - days * 24 * 60 * 60 * 1000;
    return new Date(start).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
};

export const listVisitHistory = (profile: Profile, now = Date.now()): BookedAppointment[] => {
    const today = new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const stored = readStored().filter(isVisit);
    const replaced = new Set(stored.map((item) => item.id));
    const samples = [
        { ...demoVisit(profile, "2026-02-12", 9, 30, "lim", "general", "hist-lim"), status: "completed", recordId: "CR-2405" },
        { ...demoVisit(profile, "2026-01-20", 8, 0, "wong", "screening", "hist-wong"), status: "completed", recordId: "CR-2398" },
        { ...demoVisit(profile, subDays(today, 3), 18, 0, "raj", "general", "hist-raj"), status: "cancelled" },
    ].filter((item) => !replaced.has(item.id));
    const past = stored.filter((item) => item.status === "cancelled" || item.status === "completed" || Date.parse(item.startAt) <= now);

    return [...samples, ...past].sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
};

const findUpcoming = (profile: Profile, id: string, now: number) => listUpcomingVisits(profile, now).find((item) => item.id === id);

export const cancelAppointment = (profile: Profile, id: string, now = Date.now()): BookedAppointment => {
    const visit = findUpcoming(profile, id, now);
    if (!visit) {
        throw new Error("Visit not found.");
    }

    const cancelled: BookedAppointment = { ...visit, status: "cancelled" };
    saveStored([...readStored().filter((line) => line.id !== id), cancelled]);
    const limits = readLimits(now);
    limits.cancels += 1;
    writeLimits(limits);
    return cancelled;
};

export const rescheduleAppointment = (profile: Profile, id: string, startAt: string, now = Date.now()): BookedAppointment => {
    const visit = findUpcoming(profile, id, now);
    if (!visit) {
        throw new Error("Visit not found.");
    }
    if (startAt === visit.startAt) {
        return visit;
    }
    if (rescheduleBlocked(id, now)) {
        throw new Error("reschedule-limit");
    }

    const date = new Date(startAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    const slots = getBookingSlots(date, visit.doctorId, now);
    const selected = [...slots.morning, ...slots.night].find((item) => item.startAt === startAt);
    if (!selected || selected.booked) {
        throw new Error("That slot is already booked.");
    }

    const updated: BookedAppointment = {
        ...visit,
        startAt,
        endAt: new Date(new Date(startAt).getTime() + SLOT_MS).toISOString(),
        status: "confirmed",
    };
    saveStored([...readStored().filter((line) => line.id !== id), updated]);
    const limits = readLimits(now);
    limits.reschedules[id] = (limits.reschedules[id] ?? 0) + 1;
    writeLimits(limits);
    return updated;
};
