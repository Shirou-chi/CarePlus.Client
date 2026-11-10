export type Profile = {
    id: string;
    email: string;
    fullName: string;
    identityCard: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
    gender: string | null;
    nationality: string | null;
    avatarUrl: string | null;
};

export const SESSION_KEY = "careplus-session";
