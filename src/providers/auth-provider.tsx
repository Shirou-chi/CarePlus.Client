import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOKEN_KEY } from "@/services/api";
import { authApi, type CurrentUserResponse } from "@/services/authApi";
import { profileApi, profilePictureUrl, type AppSettingResponse } from "@/services/profileApi";
import { useI18n } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { dummyLogin, SESSION_KEY, type Profile } from "@/utils/auth";
import { readProfileSettings, writeProfileSettings, type NotificationLevel } from "@/utils/profile-settings";

const OLD_STAFF_SESSION_KEY = "careplus-staff-session";

export type AuthUser = {
    name: string;
    username?: string;
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
    hasCompletedTutorial: boolean | null;
    login: (email: string, password: string) => Promise<void>;
    staffLogin: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    completeTutorial: () => Promise<void>;
    updateProfile: (patch: Partial<Profile>) => void;
    updateStaffProfile: (patch: Partial<Pick<AuthUser, "name" | "phone" | "username">>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Both patient and staff accounts use SESSION_KEY. Patient profiles are also
// accepted in their older unwrapped format for backwards compatibility.
function saveSession(session: StoredSession | null) {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
}

function readStoredSession(): StoredSession | null {
    if (typeof window === "undefined") return null;

    try {
        const saved = localStorage.getItem(SESSION_KEY);

        if (saved) {
            const data = JSON.parse(saved) as StoredSession | Profile | { type: "patient"; profile: Profile; ownProfile?: Profile };

            if ("type" in data && data.type === "patient") {
                // Migrate sessions created by the retired family-account switcher
                // back to the authenticated patient's own profile.
                const patientSession = data as { type: "patient"; profile: Profile; ownProfile?: Profile };
                return { type: "patient", profile: patientSession.ownProfile ?? patientSession.profile };
            }

            if ("type" in data && data.type === "staff") {
                return data;
            }

            if ("fullName" in data && "email" in data) {
                return { type: "patient", profile: data };
            }
        }

        const oldStaffSession = localStorage.getItem(OLD_STAFF_SESSION_KEY);
        if (oldStaffSession) {
            const user = JSON.parse(oldStaffSession) as AuthUser;
            if (user.name) {
                const migratedSession: StoredSession = { type: "staff", user };
                saveSession(migratedSession);
                return migratedSession;
            }
        }
    } catch {
        return null;
    }

    return null;
}

function convertApiUser(user: CurrentUserResponse): AuthUser {
    return {
        name: user.name || user.username,
        username: user.username,
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

export const profileFromUser = (user: CurrentUserResponse): Profile => ({
    id: user.patientId || String(user.userId),
    email: user.email,
    fullName: user.name,
    identityCard: user.identityCardNumber || null,
    phone: user.phone || null,
    dateOfBirth: null,
    address: user.address || null,
    gender: user.gender === "M" ? "male" : user.gender === "F" ? "female" : null,
    nationality: "Malaysian",
    avatarUrl: profilePictureUrl(user.profilePicture),
});

const isNotificationLevel = (value: string | null | undefined): value is NotificationLevel =>
    value === "all" || value === "reminder" || value === "none";

async function loadPatientPreferences(
    profileId: string,
    applyTheme: (theme: "light" | "dark") => void,
    applyLocale: (locale: "en" | "zh") => void,
): Promise<AppSettingResponse | null> {
    const setting = await profileApi.getAppSetting();
    if (!setting) {
        applyTheme("light");
        applyLocale("en");
        const current = readProfileSettings(profileId);
        writeProfileSettings(profileId, { ...current, notificationLevel: "all" });
        return null;
    }

    applyAppSetting(profileId, setting, applyTheme, applyLocale);
    return setting;
}

function applyAppSetting(
    profileId: string,
    setting: AppSettingResponse,
    applyTheme: (theme: "light" | "dark") => void,
    applyLocale: (locale: "en" | "zh") => void,
) {
    if (setting.appearance === "light" || setting.appearance === "dark") {
        applyTheme(setting.appearance);
    }
    if (setting.language === "en" || setting.language === "zh") {
        applyLocale(setting.language);
    }
    if (isNotificationLevel(setting.notification)) {
        const current = readProfileSettings(profileId);
        writeProfileSettings(profileId, { ...current, notificationLevel: setting.notification });
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { applyTheme } = useTheme();
    const { applyLocale } = useI18n();
    const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
    const [isReady, setIsReady] = useState(false);
    const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean | null>(null);

    const profile = session?.type === "patient" ? session.profile : null;
    const user = session?.type === "staff" ? session.user : null;

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            applyTheme("light");
            applyLocale("en");
            setHasCompletedTutorial(null);
            setIsReady(true);
            return;
        }

        let cancelled = false;
        authApi
            .getCurrentUser()
            .then(async (apiUser) => {
                if (cancelled) return;

                if (apiUser.accountType === "Staff" || apiUser.staffId) {
                    const nextSession: StoredSession = {
                        type: "staff",
                        user: convertApiUser(apiUser),
                    };
                    saveSession(nextSession);
                    setSession(nextSession);
                    setHasCompletedTutorial(null);
                    return;
                }

                const nextProfile = profileFromUser(apiUser);
                const setting = await loadPatientPreferences(nextProfile.id, applyTheme, applyLocale);
                if (cancelled) return;

                const nextSession: StoredSession = {
                    type: "patient",
                    profile: nextProfile,
                };
                saveSession(nextSession);
                setSession(nextSession);
                setHasCompletedTutorial(setting?.hasCompletedTutorial ?? false);
            })
            .catch(() => {
                if (cancelled) return;
                authApi.clearToken();
                saveSession(null);
                setSession(null);
                setHasCompletedTutorial(null);
                applyTheme("light");
                applyLocale("en");
            })
            .finally(() => {
                if (!cancelled) setIsReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [applyLocale, applyTheme]);

    const login = async (email: string, password: string) => {
        authApi.clearToken();

        try {
            const { token } = await authApi.patientLogin(email.trim(), password);
            authApi.saveToken(token);
            const apiUser = await authApi.getCurrentUser();

            if (apiUser.accountType === "Staff" || apiUser.staffId) {
                throw new Error("This account is not a patient account.");
            }

            const nextProfile = profileFromUser(apiUser);
            const setting = await loadPatientPreferences(nextProfile.id, applyTheme, applyLocale);
            const nextSession: StoredSession = {
                type: "patient",
                profile: nextProfile,
            };
            saveSession(nextSession);
            setSession(nextSession);
            setHasCompletedTutorial(setting?.hasCompletedTutorial ?? false);
        } catch (error) {
            authApi.clearToken();

            try {
                const fallbackProfile = dummyLogin(email, password);
                const nextSession: StoredSession = { type: "patient", profile: fallbackProfile };
                saveSession(nextSession);
                setSession(nextSession);
                setHasCompletedTutorial(false);
            } catch {
                throw error;
            }
        }
    };

    const staffLogin = async (identifier: string, password: string) => {
        const { token } = await authApi.staffLogin(identifier.trim(), password);
        authApi.saveToken(token);

        try {
            const apiUser = await authApi.getCurrentUser();
            if (apiUser.accountType !== "Staff" && !apiUser.staffId) {
                throw new Error("This account is not a staff account.");
            }

            const nextSession: StoredSession = {
                type: "staff",
                user: convertApiUser(apiUser),
            };
            saveSession(nextSession);
            setSession(nextSession);
            setHasCompletedTutorial(null);
        } catch (error) {
            authApi.clearToken();
            throw error;
        }
    };

    const logout = async () => {
        authApi.clearToken();
        saveSession(null);
        setSession(null);
        setHasCompletedTutorial(null);
        applyTheme("light");
        applyLocale("en");
    };

    const completeTutorial = async () => {
        if (!profile) return;

        setHasCompletedTutorial(true);
        if (!localStorage.getItem(TOKEN_KEY)) return;

        await profileApi.saveAppSetting({ hasCompletedTutorial: true });
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

    const value = useMemo<AuthContextValue>(
        () => ({
            profile,
            user,
            isReady,
            isAuthenticated: session !== null,
            hasCompletedTutorial,
            login,
            staffLogin,
            logout,
            completeTutorial,
            updateProfile,
            updateStaffProfile,
        }),
        [profile, user, isReady, session, hasCompletedTutorial, login, staffLogin, logout, completeTutorial, updateProfile, updateStaffProfile],
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
