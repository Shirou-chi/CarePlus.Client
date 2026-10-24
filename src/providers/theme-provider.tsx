import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TOKEN_KEY } from "@/services/api";
import { profileApi } from "@/services/profileApi";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    applyTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
    /**
     * The class to add to the root element when the theme is dark
     * @default "dark-mode"
     */
    darkModeClass?: string;
    /**
     * The default theme to use if no theme is stored in localStorage
     * @default "system"
     */
    defaultTheme?: Theme;
    /**
     * The key to use to store the theme in localStorage
     * @default "ui-theme"
     */
    storageKey?: string;
}

export const ThemeProvider = ({ children, defaultTheme = "light", storageKey = "ui-theme", darkModeClass = "dark-mode" }: ThemeProviderProps) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem(storageKey);
            return savedTheme === "light" || savedTheme === "dark" ? savedTheme : defaultTheme;
        }
        return defaultTheme;
    });

    useEffect(() => {
        const applyTheme = () => {
            const root = window.document.documentElement;

            if (theme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

                root.classList.toggle(darkModeClass, systemTheme === "dark");
                root.dataset.theme = systemTheme;
                localStorage.removeItem(storageKey);
            } else {
                root.classList.toggle(darkModeClass, theme === "dark");
                root.dataset.theme = theme;
                localStorage.setItem(storageKey, theme);
            }
        };

        applyTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                applyTheme();
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const applyTheme = useCallback((next: Theme) => {
        setThemeState(next);
    }, []);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        if ((next === "light" || next === "dark") && localStorage.getItem(TOKEN_KEY)) {
            void profileApi.saveAppSetting({ appearance: next }).catch(() => undefined);
        }
    }, []);

    return <ThemeContext.Provider value={{ theme, setTheme, applyTheme }}>{children}</ThemeContext.Provider>;
};
