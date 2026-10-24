import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi, type CurrentUserResponse } from "@/services/authApi";
import { dummyLogin, SESSION_KEY, type Profile } from "@/utils/auth";

<<<<<<< Updated upstream
const OLD_STAFF_SESSION_KEY = "careplus-staff-session";

export type AuthUser = {
    name: string;
    username?: string;
=======

export type AuthUser = {
    name: string;
>>>>>>> Stashed changes
    email?: string;
    userId?: string;
    role?: string;
    accountType?: string;
    patientId?: string;
    staffId?: string;
    phone?: string;
    status?: string;
};

type StoredSession =
    | { type: "patient"; profile: Profile }
    | { type: "staff"; user: AuthUser };

type AuthContextValue = {
    profile: Profile | null;
    user: AuthUser | null;
    isReady: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    staffLogin: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (patch: Partial<Profile>) => void;
    updateStaffProfile: (patch: Partial<Pick<AuthUser, "name" | "phone" | "username">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Both patient and staff accounts are saved under SESSION_KEY.
function saveSession(session: StoredSession | null) {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }

}

function readSession(): StoredSession | null {
    if (typeof window === "undefined") return null;

    try {
        const saved = localStorage.getItem(SESSION_KEY);

        if (saved) {
            const data = JSON.parse(saved) as StoredSession | Profile;

            if ("type" in data && data.type === "patient") {
                return data;
            }

            if ("type" in data && data.type === "staff") {
                return data;
            }
<<<<<<< Updated upstream

            // Support the old patient-only session format.
            if ("fullName" in data) {
                return { type: "patient", profile: data };
            }
        }

        // Migrate an existing staff session from the previous key.
        const oldStaffSession = localStorage.getItem(OLD_STAFF_SESSION_KEY);
        if (oldStaffSession) {
            const user = JSON.parse(oldStaffSession) as AuthUser;
            if (user.name) {
                const migratedSession: StoredSession = { type: "staff", user };
                saveSession(migratedSession);
                return migratedSession;
            }
        }
=======
        }

>>>>>>> Stashed changes
    } catch {
        return null;
    }

    return null;
}

function convertApiUser(user: CurrentUserResponse): AuthUser {
    return {
        name: user.name || user.username,
<<<<<<< Updated upstream
        username: user.username,
=======
>>>>>>> Stashed changes
        email: user.email,
        userId: String(user.userId),
        role: user.role,
        accountType: user.accountType,
        patientId: user.patientId,
        staffId: user.staffId,
        phone: user.phone,
        status: user.status,
    };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<StoredSession | null>(readSession);

    const profile = session?.type === "patient" ? session.profile : null;
    const user = session?.type === "staff" ? session.user : null;

    const login = async (email: string, password: string) => {
        const nextSession: StoredSession = {
            type: "patient",
            profile: dummyLogin(email, password),
        };

        authApi.clearToken();
        saveSession(nextSession);
        setSession(nextSession);
    };

    const staffLogin = async (identifier: string, password: string) => {
        const { token } = await authApi.staffLogin(identifier, password);
        authApi.saveToken(token);

        try {
            const apiUser = await authApi.getCurrentUser();
            const nextSession: StoredSession = {
                type: "staff",
                user: convertApiUser(apiUser),
            };

            saveSession(nextSession);
            setSession(nextSession);
        } catch (error) {
            authApi.clearToken();
            throw error;
        }
    };

    const logout = async () => {
        authApi.clearToken();
        saveSession(null);
        setSession(null);
    };

    const updateProfile = (patch: Partial<Profile>) => {
        setSession((currentSession) => {
            if (!currentSession || currentSession.type !== "patient") {
                return currentSession;
            }

            const nextSession: StoredSession = {
                type: "patient",
                profile: {
                    ...currentSession.profile,
                    ...patch,
                    nationality: "Malaysian",
                },
            };

            saveSession(nextSession);
            return nextSession;
        });
    };
<<<<<<< Updated upstream

    const updateStaffProfile = (patch: Partial<Pick<AuthUser, "name" | "phone" | "username">>) => {
        setSession((currentSession) => {
            if (!currentSession || currentSession.type !== "staff") {
                return currentSession;
            }

            const nextSession: StoredSession = {
                type: "staff",
                user: {
                    ...currentSession.user,
                    ...patch,
                },
            };

            saveSession(nextSession);
            return nextSession;
        });
    };
=======
>>>>>>> Stashed changes

    const value = useMemo<AuthContextValue>(
        () => ({
            profile,
            user,
            isReady: true,
            isAuthenticated: session !== null,
            login,
            staffLogin,
            logout,
            updateProfile,
<<<<<<< Updated upstream
            updateStaffProfile,
=======
>>>>>>> Stashed changes
        }),
        [profile, user, session],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
