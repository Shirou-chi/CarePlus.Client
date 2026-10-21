import type { Locale } from "@/providers/locale-provider";
import { normalizeIdentityCard } from "@/utils/identity-card";
import type { DeliveryAddress } from "@/utils/delivery-address";

export type NotificationLevel = "all" | "reminder" | "none";

export type PaymentCard = {
    id: string;
    brand: string;
    last4: string;
    expiry: string;
    holderName: string;
    /** ponytail: full digit string for duplicate detection on this demo login */
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
            deliveryAddresses: parsed.deliveryAddresses ?? [],
            defaultDeliveryAddressId: parsed.defaultDeliveryAddressId ?? null,
        };
    } catch {
        return defaultProfileSettings();
    }
};

export const writeProfileSettings = (profileId: string, settings: ProfileSettings) => {
    localStorage.setItem(`${SETTINGS_KEY}-${profileId}`, JSON.stringify(settings));
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

export const demoAccountActivity = (locale: Locale): AccountActivity[] =>
    locale === "zh"
        ? [
              { id: "1", device: "MacBook Pro", location: "吉隆坡", when: "现在", current: true },
              { id: "2", device: "iPhone 15", location: "吉隆坡", when: "3 天前" },
              { id: "3", device: "Chrome · Windows", location: "八打灵加里", when: "2 周前" },
          ]
        : [
              { id: "1", device: "MacBook Pro", location: "Kuala Lumpur", when: "Now", current: true },
              { id: "2", device: "iPhone 15", location: "Kuala Lumpur", when: "3 days ago" },
              { id: "3", device: "Chrome · Windows", location: "Petaling Jaya", when: "2 weeks ago" },
          ];

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

export const isDuplicatePaymentCard = (cards: PaymentCard[], fingerprint: string, excludeId?: string) =>
    cards.some((existing) => existing.id !== excludeId && normalizePaymentCard(existing).fingerprint === fingerprint);
