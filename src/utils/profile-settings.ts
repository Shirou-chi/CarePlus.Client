import type { Locale } from "@/providers/locale-provider";
import { normalizeIdentityCard } from "@/utils/identity-card";
import { normalizeStoredDeliveryAddress, type DeliveryAddress } from "@/utils/delivery-address";

export type NotificationLevel = "all" | "reminder" | "none";

export type PaymentCard = {
    id: string;
    brand: string;
    last4: string;
    expiry: string;
    holderName: string;
    /** ponytail: full digit string so the same card cannot be saved twice */
    fingerprint: string;
};

export type AccountActivity = {
    id: string;
    device: string;
    location: string;
    when: string;
    current?: boolean;
};

export type ProfileSettings = {
    notificationLevel: NotificationLevel;
    twoFactorEnabled: boolean;
    paymentCards: PaymentCard[];
    defaultCardId: string | null;
    deliveryAddresses: DeliveryAddress[];
    defaultDeliveryAddressId: string | null;
};

const SETTINGS_KEY = "careplus-settings";

export const defaultProfileSettings = (): ProfileSettings => ({
    notificationLevel: "all",
    twoFactorEnabled: false,
    paymentCards: [],
    defaultCardId: null,
    deliveryAddresses: [],
    defaultDeliveryAddressId: null,
});

export const readProfileSettings = (profileId: string): ProfileSettings => {
    try {
        const raw = localStorage.getItem(`${SETTINGS_KEY}-${profileId}`);
        if (!raw) {
            return defaultProfileSettings();
        }
        const parsed = { ...defaultProfileSettings(), ...(JSON.parse(raw) as Partial<ProfileSettings>) };
        return {
            ...parsed,
            paymentCards: parsed.paymentCards.map(normalizePaymentCard),
            deliveryAddresses: (parsed.deliveryAddresses ?? []).map((address) => normalizeStoredDeliveryAddress(address)),
            defaultDeliveryAddressId: parsed.defaultDeliveryAddressId ?? null,
        };
    } catch {
        return defaultProfileSettings();
    }
};

export const writeProfileSettings = (profileId: string, settings: ProfileSettings) => {
    localStorage.setItem(`${SETTINGS_KEY}-${profileId}`, JSON.stringify(settings));
};

export const genderFromIdentityCard = (identityCard: string | null): "male" | "female" | null => {
    const digits = normalizeIdentityCard(identityCard ?? "");
    if (digits.length !== 12) {
        return null;
    }
    const last = Number(digits[11]);
    return last % 2 === 1 ? "male" : "female";
};

export const dobFromIdentityCard = (identityCard: string | null): string | null => {
    if (!identityCard) {
        return null;
    }
    const digits = normalizeIdentityCard(identityCard);
    if (digits.length < 6) {
        return null;
    }
    const year = Number(digits.slice(0, 2));
    const month = digits.slice(2, 4);
    const day = digits.slice(4, 6);
    const fullYear = year <= 29 ? 2000 + year : 1900 + year;
    return `${fullYear}-${month}-${day}`;
};

export const formatDob = (iso: string | null, locale: Locale) => {
    if (!iso) {
        return "—";
    }
    const date = new Date(`${iso}T00:00:00`);
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-MY", { year: "numeric", month: "long", day: "numeric" });
};

export const profileInitials = (fullName: string) =>
    fullName
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

export const isLocalAddress = (address: string) => address === "" || address === "127.0.0.1" || address === "::1";

export const formatActivityWhen = (iso: string, locale: Locale) => {
    const date = new Date(iso);
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : "en", { numeric: "auto" });
    if (abs < 45) {
        return formatter.format(0, "second");
    }
    if (abs < 3600) {
        return formatter.format(Math.round(seconds / 60), "minute");
    }
    if (abs < 86400) {
        return formatter.format(Math.round(seconds / 3600), "hour");
    }
    if (abs < 86400 * 30) {
        return formatter.format(Math.round(seconds / 86400), "day");
    }
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-MY", { dateStyle: "medium", timeStyle: "short" });
};

export const cardBrandFromDigits = (digits: string) => (digits.startsWith("4") ? "Visa" : digits ? "Mastercard" : "CarePlus");

export const previewCardNumber = (digits: string) => {
    if (!digits) {
        return "•••• •••• •••• ••••";
    }
    const groups = Array.from({ length: 4 }, (_, index) => digits.slice(index * 4, index * 4 + 4).padEnd(4, "•"));
    return groups.join(" ");
};

export const normalizePaymentCard = (card: PaymentCard): PaymentCard => ({
    ...card,
    fingerprint: card.fingerprint || `${card.last4}-${card.expiry}`,
});

export type SavedPaymentCard = {
    id: number;
    brand: string;
    last4: string;
    expiry: string;
    holderName: string;
    isDefault: boolean;
};

export const applyPaymentCards = (settings: ProfileSettings, rows: SavedPaymentCard[]): ProfileSettings => {
    const paymentCards = rows.map((row) => ({
        id: String(row.id),
        brand: row.brand,
        last4: row.last4,
        expiry: row.expiry,
        holderName: row.holderName,
        fingerprint: `${row.last4}-${row.expiry}`,
    }));
    const fallback = rows.find((row) => row.isDefault) ?? rows[0];
    return {
        ...settings,
        paymentCards,
        defaultCardId: fallback ? String(fallback.id) : null,
    };
};

export const isDuplicatePaymentCard = (cards: PaymentCard[], fingerprint: string, excludeId?: string) =>
    cards.some((existing) => existing.id !== excludeId && normalizePaymentCard(existing).fingerprint === fingerprint);
