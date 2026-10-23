import { dummyProfile } from "./auth.ts";
import {
    acceptInvite,
    bookingFamily,
    canUseFamilyAccount,
    decideUseRequest,
    deleteFamily,
    familyLogin,
    inviteMember,
    leaveFamily,
    pendingUseRequests,
    readFamily,
    removeFamilyMember,
    requestUseAccount,
    setPermission,
    useFamilyAccount,
} from "./family.ts";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
    value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
});

const family = readFamily(dummyProfile);
const invited = inviteMember(dummyProfile, { name: "  Mei  ", email: "mei@example.com", relation: "spouse", permission: "child" });
const pending = invited.ok ? invited.family.members.find((member) => member.email === "mei@example.com") : undefined;
const beforeAccept = bookingFamily(dummyProfile);
const mei = familyLogin("mei@example.com", "careplus123");
const aina = familyLogin("aina@example.com", "careplus123");
const accepted = mei && pending ? acceptInvite(mei, pending.id) : { ok: false as const, reason: "missing" as const };
const meiId = accepted.ok ? accepted.family.members.find((member) => member.email === "mei@example.com")?.id : undefined;
const afterAccept = bookingFamily(dummyProfile);
const viewOnly = aina ? bookingFamily(aina) : [];
const blockedParent = aina ? requestUseAccount(aina, "patient-1") : { ok: false as const, reason: "missing" as const };
const requested = aina && meiId ? requestUseAccount(aina, meiId) : { ok: false as const, reason: "missing" as const };
const pendingAccess = pendingUseRequests(dummyProfile);
const approved = pendingAccess[0] ? decideUseRequest(dummyProfile, pendingAccess[0].request.id, true) : { ok: false as const };
const ainaCanUseMei = Boolean(aina && meiId && canUseFamilyAccount(aina, meiId));
const switched = aina && meiId ? useFamilyAccount(aina, meiId) : null;
const parentUsesChild = canUseFamilyAccount(dummyProfile, "fam-child");
const demoted = setPermission(dummyProfile, "fam-parent", "child");
const blockedLeave = leaveFamily(dummyProfile);
const transferred = leaveFamily(dummyProfile, "fam-child");
const ainaOwns = transferred.ok ? transferred.family?.members.find((member) => member.id === "fam-child") : undefined;
const removed = ainaOwns ? deleteFamily({ ...dummyProfile, id: "fam-child", email: "aina@example.com", fullName: "Aina" }) : { ok: false as const };

const checks = [
    family?.name === "Kaiminn Family",
    family?.members.filter((member) => member.permission === "parent").length === 2,
    family?.members.find((member) => member.id === "fam-child")?.permission === "child",
    invited.ok && pending?.status === "pending" && pending.name === "Mei" && pending.permission === "child",
    beforeAccept.length === 3 && !beforeAccept.some((person) => person.name === "Mei"),
    mei?.email === "mei@example.com",
    accepted.ok,
    afterAccept.some((person) => person.name === "Mei"),
    viewOnly.length === 1 && viewOnly[0]?.isYou,
    !blockedParent.ok && blockedParent.reason === "not-allowed",
    aina ? !canUseFamilyAccount(aina, "patient-1") && useFamilyAccount(aina, "patient-1") === null : false,
    parentUsesChild,
    requested.ok && pendingAccess.length === 1,
    approved.ok && ainaCanUseMei && switched?.email === "mei@example.com",
    demoted.ok,
    !blockedLeave.ok && blockedLeave.reason === "need-transfer",
    transferred.ok && ainaOwns?.permission === "parent",
    transferred.ok && !transferred.family?.members.some((member) => member.email === dummyProfile.email),
    removed.ok && readFamily(dummyProfile) === null,
    !removeFamilyMember(dummyProfile, "patient-1").ok,
    setPermission(dummyProfile, "missing", "child").ok === false,
];

if (checks.some((ok) => !ok)) {
    throw new Error(`family check failed ${checks.map((ok) => (ok ? "1" : "0")).join("")}`);
}

console.log("family ok");
