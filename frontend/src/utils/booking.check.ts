import { dummyProfile } from "./auth.ts";
import { getBookingCatalog, getBookingSlots } from "./booking.ts";

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

const checks = [
    catalog.family[0].id === dummyProfile.id,
    catalog.doctors.length === 5,
    catalog.types.length === 3,
    slots.morning.length === 24,
    slots.night.length === 24,
    slots.morning.every((item) => !item.booked),
];

if (checks.some((ok) => !ok)) {
    throw new Error("dummy booking check failed");
}

console.log("dummy booking ok");
