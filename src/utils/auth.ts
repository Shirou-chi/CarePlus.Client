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
export const DUMMY_EMAIL = "patient@careplus.my";
export const DUMMY_USERNAME = "kaiminn";
export const DUMMY_PASSWORD = "careplus123";
const PASSWORD_KEY = "careplus-password";

export const readPassword = () => {
    if (typeof localStorage === "undefined") {
        return DUMMY_PASSWORD;
    }
    return localStorage.getItem(PASSWORD_KEY) || DUMMY_PASSWORD;
};

export const savePassword = (password: string) => {
    localStorage.setItem(PASSWORD_KEY, password);
};

export const dummyProfile: Profile = {
    id: "patient-1",
    email: DUMMY_EMAIL,
    fullName: "Kaiminn",
    identityCard: "990101-14-5678",
    phone: "+60123456789",
    dateOfBirth: "1999-01-01",
    address: "Setapak, Kuala Lumpur",
    gender: "male",
    nationality: "Malaysian",
    avatarUrl: null,
};

export class AuthError extends Error {
    constructor(message = "Invalid email or password.") {
        super(message);
        this.name = "AuthError";
    }
}

export const readSession = (): Profile | null => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as Profile;
        return {
            ...parsed,
            gender: parsed.gender ?? null,
            nationality: "Malaysian",
            avatarUrl: parsed.avatarUrl ?? null,
        };
    } catch {
        return null;
    }
};

export const writeSession = (profile: Profile | null) => {
    if (profile) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
        return;
    }
    localStorage.removeItem(SESSION_KEY);
};

export const matchDummyLogin = (email: string, password: string) => {
    const id = email.trim().toLowerCase();
    return (id === DUMMY_EMAIL || id === DUMMY_USERNAME) && password === readPassword();
};

export const dummyLogin = (email: string, password: string): Profile => {
    if (!matchDummyLogin(email, password)) {
        throw new AuthError();
    }
    writeSession(dummyProfile);
    return dummyProfile;
};
