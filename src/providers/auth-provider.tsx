import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOKEN_KEY } from "@/services/api";
import { authApi, type CurrentUserResponse } from "@/services/authApi";
import { profileApi, profilePictureUrl, type AppSettingResponse } from "@/services/profileApi";
import { useI18n } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import { readSession, writeSession, type Profile } from "@/utils/auth";
import { familyLogin } from "@/utils/family";
import { readProfileSettings, writeProfileSettings, type NotificationLevel } from "@/utils/profile-settings";

type AuthContextValue = {
    profile: Profile | null;
    isReady: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    switchProfile: (next: Profile) => void;
    updateProfile: (patch: Partial<Profile>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
) {
    const setting = await profileApi.getAppSetting();
    if (!setting) {
        applyTheme("light");
        applyLocale("en");
        const current = readProfileSettings(profileId);
        writeProfileSettings(profileId, { ...current, notificationLevel: "all" });
        return;
    }

    applyAppSetting(profileId, setting, applyTheme, applyLocale);
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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            const existing = readSession();
            if (existing?.id.startsWith("fam-")) {
                setProfile(existing);
            } else {
                writeSession(null);
            }
            setIsReady(true);
            return;
        }

        let cancelled = false;
        authApi
            .getCurrentUser()
            .then(async (user) => {
                if (cancelled) return;
                const next = profileFromUser(user);
                if (user.accountType !== "Staff") {
                    await loadPatientPreferences(next.id, applyTheme, applyLocale);
                }
                if (cancelled) return;
                writeSession(next);
                setProfile(next);
            })
            .catch(() => {
                if (cancelled) return;
                authApi.clearToken();
                writeSession(null);
            })
            .finally(() => {
                if (!cancelled) setIsReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [applyLocale, applyTheme]);

    const value = useMemo<AuthContextValue>(
        () => ({
            profile,
            isReady,
            login: async (email, password) => {
                try {
                    const { token } = await authApi.patientLogin(email.trim(), password);
                    authApi.saveToken(token);
                    const user = await authApi.getCurrentUser();
                    const next = profileFromUser(user);
                    if (user.accountType !== "Staff") {
                        await loadPatientPreferences(next.id, applyTheme, applyLocale);
                    }
                    writeSession(next);
                    setProfile(next);
                } catch (error) {
                    authApi.clearToken();
                    const family = familyLogin(email, password);
                    if (!family) {
                        throw error;
                    }
                    writeSession(family);
                    setProfile(family);
                }
            },
            logout: async () => {
                authApi.clearToken();
                writeSession(null);
                setProfile(null);
            },
            switchProfile: (next) => {
                writeSession(next);
                setProfile(next);
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
        [profile, isReady, applyTheme, applyLocale],
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
