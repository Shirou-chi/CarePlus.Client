import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { dummyLogin, readSession, writeSession, type Profile } from "@/utils/auth";

type AuthContextValue = {
    profile: Profile | null;
    isReady: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (patch: Partial<Profile>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<Profile | null>(() => (typeof window === "undefined" ? null : readSession()));

    const value = useMemo<AuthContextValue>(
        () => ({
            profile,
            isReady: true,
            login: async (email, password) => {
                const next = dummyLogin(email, password);
                setProfile(next);
            },
            logout: async () => {
                writeSession(null);
                setProfile(null);
            },
            updateProfile: (patch) => {
                setProfile((current) => {
                    if (!current) {
                        return current;
                    }
                    const next = { ...current, ...patch, nationality: "Malaysian" };
                    writeSession(next);
                    return next;
                });
            },
        }),
        [profile],
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
