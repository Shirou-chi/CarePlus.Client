import { request, type ApiResponse } from "./api";

export type FamilyPermission = "parent" | "child";
export type FamilyRelation = "parent" | "child";
export type FamilyStatus = "active" | "pending";

export type FamilyMember = {
    id: string;
    familyMemberId: number;
    name: string;
    email: string;
    relation: FamilyRelation | "you";
    permission: FamilyPermission;
    status: FamilyStatus;
    isOwner: boolean;
};

export type FamilyGroup = {
    id: string;
    name: string;
    ownerId: string;
    members: FamilyMember[];
};

export type FamilyInvite = {
    member: FamilyMember;
    family: Pick<FamilyGroup, "id" | "name" | "members">;
};

export type FamilyOverview = {
    currentPatientId: string;
    family: FamilyGroup | null;
    invites: FamilyInvite[];
};

type ApiMember = {
    familyMemberId: number;
    patientId: string;
    name: string;
    email: string;
    relation: string;
    permission: string;
    status: string;
    isOwner: boolean;
};

type ApiOverview = {
    currentPatientId: string;
    family: { familyGroupId: number; name: string; ownerPatientId: string; members: ApiMember[] } | null;
    invites: Array<{ familyMemberId: number; familyGroupId: number; familyName: string; invitedByName: string; relation: string; permission: string }>;
};

const unwrap = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const result = await request<ApiResponse<T>>(path, options, true);
    if (!result.isSuccess || result.data === null) throw new Error(result.respMessage || "Unable to update the family.");
    return result.data;
};

const normalizePermission = (value: string): FamilyPermission => (value.toLowerCase() === "parent" ? "parent" : "child");
const normalizeRelation = (value: string): FamilyRelation => (value.toLowerCase() === "parent" ? "parent" : "child");
const normalizeStatus = (value: string): FamilyStatus => (value.toLowerCase() === "active" ? "active" : "pending");

const mapMember = (member: ApiMember): FamilyMember => ({
    id: member.patientId,
    familyMemberId: member.familyMemberId,
    name: member.name,
    email: member.email,
    relation: normalizeRelation(member.relation),
    permission: normalizePermission(member.permission),
    status: normalizeStatus(member.status),
    isOwner: member.isOwner,
});

const mapOverview = (data: ApiOverview): FamilyOverview => {
    const members = data.family?.members.map(mapMember) ?? [];
    const family = data.family
        ? { id: String(data.family.familyGroupId), name: data.family.name, ownerId: data.family.ownerPatientId, members }
        : null;

    const invites = data.invites.map((invite) => {
        const member: FamilyMember = {
            id: `pending-${invite.familyMemberId}`,
            familyMemberId: invite.familyMemberId,
            name: "",
            email: "",
            relation: normalizeRelation(invite.relation),
            permission: normalizePermission(invite.permission),
            status: "pending",
            isOwner: false,
        };
        return {
            member,
            family: {
                id: String(invite.familyGroupId),
                name: invite.familyName,
                members: [{ id: "owner", familyMemberId: 0, name: invite.invitedByName, email: "", relation: "parent" as const, permission: "parent" as const, status: "active" as const, isOwner: true }],
            },
        };
    });

    return { currentPatientId: data.currentPatientId, family, invites };
};

export const familyApi = {
    async overview(): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family", { cache: "no-store" }));
    },
    async create(name: string): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family", { method: "POST", body: JSON.stringify({ name }) }));
    },
    async rename(name: string): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family", { method: "PUT", body: JSON.stringify({ name }) }));
    },
    async invite(email: string, relation: FamilyRelation): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family/members", { method: "POST", body: JSON.stringify({ email, relation }) }));
    },
    async acceptInvite(id: number): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>(`/api/Family/invites/${id}/accept`, { method: "POST" }));
    },
    async declineInvite(id: number): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>(`/api/Family/invites/${id}/decline`, { method: "POST" }));
    },
    async cancelInvite(id: number): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>(`/api/Family/invites/${id}`, { method: "DELETE" }));
    },
    async updateAccess(id: number, relation: FamilyRelation): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>(`/api/Family/members/${id}/access`, { method: "PUT", body: JSON.stringify({ relation }) }));
    },
    async renameSelf(name: string): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family/members/me/display-name", { method: "PUT", body: JSON.stringify({ name }) }));
    },
    async removeMember(id: number): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>(`/api/Family/members/${id}`, { method: "DELETE" }));
    },
    async leave(transferToMemberId?: number): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family/leave", { method: "POST", body: JSON.stringify({ transferToMemberId: transferToMemberId ?? null }) }));
    },
    async delete(): Promise<FamilyOverview> {
        return mapOverview(await unwrap<ApiOverview>("/api/Family", { method: "DELETE" }));
    },
};
