import type { Profile } from "@/utils/auth";

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
    doctorName: string;
    type: string;
    notes: string | null;
    startAt: string;
    endAt: string;
    status: string;
};

const BOOKING_KEY = "careplus-dummy-bookings";
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

const readTaken = (): Set<string> => {
    try {
        const raw = sessionStorage.getItem(BOOKING_KEY);
        const lines = raw ? (JSON.parse(raw) as { startAt: string }[]) : [];
        return new Set(lines.map((line) => line.startAt));
    } catch {
        return new Set();
    }
};

const writeTaken = (startAt: string) => {
    const taken = [...readTaken(), startAt];
    sessionStorage.setItem(BOOKING_KEY, JSON.stringify(taken.map((item) => ({ startAt: item }))));
};

export const getBookingCatalog = (profile: Profile): BookingCatalog => ({
    family: [{ id: profile.id, name: profile.fullName, relation: "You", isYou: true }],
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

export const bookAppointment = (payload: {
    profile: Profile;
    doctorId: string;
    startAt: string;
    type: string;
    notes?: string;
}): BookedAppointment => {
    const slots = getBookingSlots(payload.startAt.slice(0, 10), payload.doctorId);
    const all = [...slots.morning, ...slots.night];
    const selected = all.find((item) => item.startAt === payload.startAt);
    if (!selected || selected.booked) {
        throw new Error("That slot is already booked.");
    }

    writeTaken(payload.startAt);
    const doctor = dummyDoctors.find((item) => item.id === payload.doctorId) ?? dummyDoctors[0];
    return {
        id: `apt-${Date.now()}`,
        forName: payload.profile.fullName,
        doctorName: payload.doctorId === "any" ? doctor.name : doctor.name,
        type: payload.type,
        notes: payload.notes ?? null,
        startAt: payload.startAt,
        endAt: new Date(new Date(payload.startAt).getTime() + SLOT_MS).toISOString(),
        status: "confirmed",
    };
};
