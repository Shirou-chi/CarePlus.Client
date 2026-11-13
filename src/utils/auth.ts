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
    /** Server path for the profile photo; used to detect cross-device updates without refreshing. */
    pictureKey?: string | null;
};

export const SESSION_KEY = "careplus-session";
export const OLD_STAFF_SESSION_KEY = "careplus-staff-session";
