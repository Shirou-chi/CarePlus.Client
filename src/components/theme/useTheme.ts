import { useEffect, useState } from "react";
import { TOKEN_KEY } from "@/services/api";
import { profileApi } from "@/services/profileApi";

export type Theme = "light" | "dark";

const STORAGE_KEY = "careplus-staff-theme";

function readTheme(): Theme {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

function writeTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.dataset.theme = next;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(readTheme);

    useEffect(() => {
        writeTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) {
            return;
        }

        let cancelled = false;
        profileApi
            .getAppSetting()
            .then(async (setting) => {
                if (cancelled) {
                    return;
                }
                if (!setting) {
                    setThemeState("light");
                    return;
                }
                if (setting.appearance === "light" || setting.appearance === "dark") {
                    setThemeState(setting.appearance);
                }
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, []);

    const toggleTheme = () => {
        setThemeState((current) => {
            const next = current === "dark" ? "light" : "dark";
            if (localStorage.getItem(TOKEN_KEY)) {
                void profileApi.saveAppSetting({ appearance: next }).catch(() => undefined);
            }
            return next;
        });
    };

    return { theme, setTheme: setThemeState, toggleTheme };
}
