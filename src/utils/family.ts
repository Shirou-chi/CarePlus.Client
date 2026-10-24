import { DUMMY_EMAIL, DUMMY_PASSWORD, dummyProfile, type Profile } from "./auth.ts";

export type FamilyRelation = "parent" | "child" | "spouse" | "other";
export type FamilyPermission = "parent" | "child";

export type FamilyMember = {
    id: string;
    name: string;
    email: string;
    relation: FamilyRelation | "you";
    permission: FamilyPermission;
    status: "pending" | "active";
};

export type FamilyUseRequest = {
    id: string;
    fromId: string;
    targetId: string;
    status: "pending" | "approved";
};

export type FamilyGroup = {
    id: string;
    name: string;
    members: FamilyMember[];
    useRequests?: FamilyUseRequest[];
};

export type FamilyReason = "not-owner" | "self" | "duplicate" | "need-transfer" | "missing" | "already" | "not-allowed";

const KEY = "careplus-families";
const relations = new Set<FamilyRelation>(["parent", "child", "spouse", "other"]);
const emailOf = (value: string) => value.trim().toLowerCase();

const asPermission = (value: unknown): FamilyPermission | null => {
    if (value === "parent" || value === "owner" || value === "full") return "parent";
    if (value === "child" || value === "view") return "child";
    return null;
};

const isMember = (value: unknown): value is FamilyMember => {
    if (!value || typeof value !== "object") return false;
    const member = value as FamilyMember;
    const permission = asPermission(member.permission);
    if (!permission) return false;
    member.permission = permission;
    return (
        typeof member.id === "string" &&
        typeof member.name === "string" &&
        typeof member.email === "string" &&
        (member.relation === "you" || relations.has(member.relation)) &&
        (member.status === "pending" || member.status === "active")
    );
};

const seed = (): FamilyGroup[] => [
    {
        id: "family-kaiminn",
        name: "Kaiminn Family",
        members: [
            { id: "patient-1", name: "Kaiminn", email: DUMMY_EMAIL, relation: "you", permission: "parent", status: "active" },
            { id: "fam-parent", name: "Rahman", email: "rahman@example.com", relation: "parent", permission: "parent", status: "active" },
            { id: "fam-child", name: "Aina", email: "aina@example.com", relation: "child", permission: "child", status: "active" },
        ],
    },
];

const readFamilies = (): FamilyGroup[] => {
    if (typeof sessionStorage === "undefined") return seed();
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return seed();
        const parsed = JSON.parse(raw) as FamilyGroup[];
        if (!Array.isArray(parsed)) return seed();
        return parsed
            .filter((family) => family && typeof family.id === "string" && typeof family.name === "string" && Array.isArray(family.members))
            .map((family) => ({
                ...family,
                members: family.members.filter(isMember),
                useRequests: Array.isArray(family.useRequests) ? family.useRequests.filter(isUseRequest) : [],
            }));
    } catch {
        return seed();
    }
};

const isUseRequest = (value: unknown): value is FamilyUseRequest => {
    if (!value || typeof value !== "object") return false;
    const request = value as FamilyUseRequest;
    return (
        typeof request.id === "string" &&
        typeof request.fromId === "string" &&
        typeof request.targetId === "string" &&
        (request.status === "pending" || request.status === "approved")
    );
};

const requestsOf = (family: FamilyGroup) => family.useRequests ?? [];

const pruneRequests = (family: FamilyGroup, members: FamilyMember[]) => {
    const ids = new Set(members.map((member) => member.id));
    return requestsOf(family).filter((request) => ids.has(request.fromId) && ids.has(request.targetId));
};

const writeFamilies = (families: FamilyGroup[]) => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(KEY, JSON.stringify(families));
};

const replaceFamily = (family: FamilyGroup) => {
    const families = readFamilies().some((item) => item.id === family.id)
        ? readFamilies().map((item) => (item.id === family.id ? family : item))
        : [...readFamilies(), family];
    writeFamilies(families);
    return family;
};

export const findMembership = (email: string) => {
    const needle = emailOf(email);
    for (const family of readFamilies()) {
        const member = family.members.find((item) => emailOf(item.email) === needle);
        if (member) return { family, member };
    }
    return null;
};

export const incomingInvites = (email: string) => {
    const needle = emailOf(email);
    return readFamilies().flatMap((family) =>
        family.members
            .filter((member) => member.status === "pending" && emailOf(member.email) === needle)
            .map((member) => ({ family, member })),
    );
};

export const readFamily = (profile: Profile) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return null;
    return found.family;
};

const parentOf = (profile: Profile) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active" || found.member.permission !== "parent") return null;
    return found;
};

export const renameFamily = (profile: Profile, name: string) => {
    const found = parentOf(profile);
    const next = name.trim();
    if (!found || !next) return found?.family ?? null;
    return replaceFamily({ ...found.family, name: next });
};

export const inviteMember = (profile: Profile, input: { name: string; email: string; relation: FamilyRelation; permission: FamilyPermission }) => {
    const found = parentOf(profile);
    if (!found) return { ok: false as const, reason: "not-owner" as const };
    const email = emailOf(input.email);
    if (!input.name.trim() || email === emailOf(profile.email)) return { ok: false as const, reason: "self" as const };
    const taken = readFamilies().some((family) => family.members.some((member) => emailOf(member.email) === email));
    if (taken) return { ok: false as const, reason: "duplicate" as const };
    const member: FamilyMember = {
        id: `fam-${crypto.randomUUID()}`,
        name: input.name.trim(),
        email: input.email.trim(),
        relation: input.relation,
        permission: input.permission,
        status: "pending",
    };
    const family = replaceFamily({ ...found.family, members: [...found.family.members, member] });
    return { ok: true as const, family };
};

export const setPermission = (profile: Profile, memberId: string, permission: FamilyPermission) => {
    const found = parentOf(profile);
    if (!found) return { ok: false as const, reason: "not-owner" as const };
    const target = found.family.members.find((member) => member.id === memberId);
    if (!target || target.id === found.member.id) return { ok: false as const, reason: "missing" as const };
    const members = found.family.members.map((member) => (member.id === target.id ? { ...member, permission } : member));
    return { ok: true as const, family: replaceFamily({ ...found.family, members }) };
};

export const acceptInvite = (profile: Profile, memberId: string) => {
    if (findMembership(profile.email)?.member.status === "active") return { ok: false as const, reason: "already" as const };
    const invite = incomingInvites(profile.email).find((item) => item.member.id === memberId);
    if (!invite) return { ok: false as const, reason: "missing" as const };
    const members = invite.family.members.map((member) =>
        member.id === memberId ? { ...member, status: "active" as const, name: profile.fullName || member.name } : member,
    );
    return { ok: true as const, family: replaceFamily({ ...invite.family, members }) };
};

export const declineInvite = (profile: Profile, memberId: string) => {
    const invite = incomingInvites(profile.email).find((item) => item.member.id === memberId);
    if (!invite) return { ok: false as const, reason: "missing" as const };
    const family = replaceFamily({ ...invite.family, members: invite.family.members.filter((member) => member.id !== memberId) });
    return { ok: true as const, family };
};

export const cancelInvite = (profile: Profile, memberId: string) => {
    const found = parentOf(profile);
    const target = found?.family.members.find((member) => member.id === memberId && member.status === "pending");
    if (!found || !target) return { ok: false as const, reason: "not-owner" as const };
    return { ok: true as const, family: replaceFamily({ ...found.family, members: found.family.members.filter((member) => member.id !== memberId) }) };
};

export const removeFamilyMember = (profile: Profile, memberId: string) => {
    const found = parentOf(profile);
    const target = found?.family.members.find((member) => member.id === memberId);
    if (!found || !target || target.id === found.member.id) return { ok: false as const, reason: "not-owner" as const };
    const members = found.family.members.filter((member) => member.id !== memberId);
    return { ok: true as const, family: replaceFamily({ ...found.family, members, useRequests: pruneRequests(found.family, members) }) };
};

export const leaveFamily = (profile: Profile, transferToId?: string) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return { ok: false as const, reason: "missing" as const };
    const otherParent = found.family.members.some((member) => member.id !== found.member.id && member.status === "active" && member.permission === "parent");
    if (found.member.permission !== "parent" || otherParent) {
        const members = found.family.members.filter((member) => member.id !== found.member.id);
        const family = members.length ? replaceFamily({ ...found.family, members, useRequests: pruneRequests(found.family, members) }) : null;
        if (!family) writeFamilies(readFamilies().filter((item) => item.id !== found.family.id));
        return { ok: true as const, family };
    }
    const nextParent = found.family.members.find((member) => member.id === transferToId && member.status === "active" && member.id !== found.member.id);
    if (!nextParent) return { ok: false as const, reason: "need-transfer" as const };
    const members = found.family.members
        .filter((member) => member.id !== found.member.id)
        .map((member) => (member.id === nextParent.id ? { ...member, permission: "parent" as const } : member));
    return { ok: true as const, family: replaceFamily({ ...found.family, members, useRequests: pruneRequests(found.family, members) }) };
};

export const deleteFamily = (profile: Profile) => {
    const found = parentOf(profile);
    if (!found) return { ok: false as const, reason: "not-owner" as const };
    writeFamilies(readFamilies().filter((family) => family.id !== found.family.id));
    return { ok: true as const, family: null };
};

export const createFamily = (profile: Profile, name: string) => {
    if (findMembership(profile.email)?.member.status === "active") return { ok: false as const, reason: "already" as const };
    const next = name.trim();
    if (!next) return { ok: false as const, reason: "missing" as const };
    const family: FamilyGroup = {
        id: `family-${crypto.randomUUID()}`,
        name: next,
        members: [{ id: profile.id, name: profile.fullName, email: profile.email, relation: "you", permission: "parent", status: "active" }],
    };
    writeFamilies([...readFamilies().filter((item) => !item.members.some((member) => emailOf(member.email) === emailOf(profile.email) && member.status === "pending")), family]);
    return { ok: true as const, family };
};

export const bookingFamily = (profile: Profile) => {
    const self = { id: profile.id, name: profile.fullName, relation: "You", isYou: true };
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active" || found.member.permission === "child") return [self];
    return [
        self,
        ...found.family.members
            .filter((member) => member.status === "active" && emailOf(member.email) !== emailOf(profile.email))
            .map((member) => ({ id: member.id, name: member.name, relation: member.relation, isYou: false })),
    ];
};

const profileForMember = (member: FamilyMember): Profile => {
    if (emailOf(member.email) === emailOf(DUMMY_EMAIL)) return { ...dummyProfile };
    return {
        id: member.id,
        email: member.email,
        fullName: member.name,
        identityCard: null,
        phone: null,
        dateOfBirth: null,
        address: null,
        gender: null,
        nationality: "Malaysian",
        avatarUrl: null,
    };
};

export const canUseFamilyAccount = (profile: Profile, targetId: string) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return false;
    const target = found.family.members.find((member) => member.id === targetId && member.status === "active");
    if (!target || target.id === found.member.id) return false;
    if (target.permission === "parent" && found.member.permission === "child") return false;
    if (found.member.permission === "parent") return true;
    return requestsOf(found.family).some((request) => request.fromId === found.member.id && request.targetId === targetId && request.status === "approved");
};

export const useRequestFor = (profile: Profile, targetId: string) => {
    const found = findMembership(profile.email);
    if (!found) return null;
    return requestsOf(found.family).find((request) => request.fromId === found.member.id && request.targetId === targetId) ?? null;
};

export const pendingUseRequests = (profile: Profile) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return [];
    if (found.member.permission !== "parent") return [];
    return requestsOf(found.family)
        .filter((request) => request.status === "pending")
        .flatMap((request) => {
            const from = found.family.members.find((member) => member.id === request.fromId);
            const target = found.family.members.find((member) => member.id === request.targetId);
            if (!from || !target) return [];
            return [{ request, from, target }];
        });
};

export const requestUseAccount = (profile: Profile, targetId: string) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return { ok: false as const, reason: "missing" as const };
    if (found.member.permission === "parent") return { ok: false as const, reason: "already" as const };
    const target = found.family.members.find((member) => member.id === targetId && member.status === "active");
    if (!target || target.id === found.member.id) return { ok: false as const, reason: "self" as const };
    if (target.permission === "parent") return { ok: false as const, reason: "not-allowed" as const };
    if (useRequestFor(profile, targetId)) return { ok: false as const, reason: "already" as const };
    const request: FamilyUseRequest = { id: `use-${crypto.randomUUID()}`, fromId: found.member.id, targetId, status: "pending" };
    return { ok: true as const, family: replaceFamily({ ...found.family, useRequests: [...requestsOf(found.family), request] }) };
};

export const decideUseRequest = (profile: Profile, requestId: string, accept: boolean) => {
    const found = findMembership(profile.email);
    if (!found || found.member.status !== "active") return { ok: false as const, reason: "missing" as const };
    if (found.member.permission !== "parent") return { ok: false as const, reason: "not-allowed" as const };
    const current = requestsOf(found.family).find((request) => request.id === requestId && request.status === "pending");
    if (!current) return { ok: false as const, reason: "missing" as const };
    const useRequests = accept
        ? requestsOf(found.family).map((request) => (request.id === requestId ? { ...request, status: "approved" as const } : request))
        : requestsOf(found.family).filter((request) => request.id !== requestId);
    return { ok: true as const, family: replaceFamily({ ...found.family, useRequests }) };
};

export const useFamilyAccount = (profile: Profile, targetId: string): Profile | null => {
    const found = findMembership(profile.email);
    if (!found || !canUseFamilyAccount(profile, targetId)) return null;
    const target = found.family.members.find((member) => member.id === targetId && member.status === "active");
    return target ? profileForMember(target) : null;
};

export const familyLogin = (email: string, password: string): Profile | null => {
    if (password !== DUMMY_PASSWORD || emailOf(email) === emailOf(DUMMY_EMAIL)) return null;
    const found = findMembership(email);
    if (!found) return null;
    return profileForMember(found.member);
};
