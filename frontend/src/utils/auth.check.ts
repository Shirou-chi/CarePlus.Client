import { dummyLogin, matchDummyLogin } from "./auth.ts";

const checks = [
    matchDummyLogin("patient@careplus.my", "careplus123"),
    matchDummyLogin("  PATIENT@careplus.my ", "careplus123"),
    !matchDummyLogin("patient@careplus.my", "wrong"),
    !matchDummyLogin("other@careplus.my", "careplus123"),
];

const storage = new Map<string, string>();
const local = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
};
Object.defineProperty(globalThis, "localStorage", { value: local, configurable: true });

dummyLogin("patient@careplus.my", "careplus123");
let failed = false;
try {
    dummyLogin("patient@careplus.my", "nope");
} catch {
    failed = true;
}

if (checks.some((ok) => !ok) || !failed) {
    throw new Error("dummy auth check failed");
}

console.log("dummy auth ok");
