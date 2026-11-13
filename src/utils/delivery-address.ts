import type { Profile } from "@/utils/auth";
import type { Copy } from "@/providers/locale-provider";
import type { ProfileSettings } from "@/utils/profile-settings";
import type { DeliveryAddressResponse } from "@/services/profileApi";

export const DELIVERY_LABEL_IDS = ["home", "office", "other"] as const;
export type DeliveryLabelId = (typeof DELIVERY_LABEL_IDS)[number];

export const isDeliveryLabelId = (value: string): value is DeliveryLabelId =>
    (DELIVERY_LABEL_IDS as readonly string[]).includes(value);

export const deliveryLabelText = (label: string, t: Copy) => {
    if (label === "home") return t.settingsLabelHome;
    if (label === "office") return t.settingsLabelOffice;
    if (label === "other") return t.settingsLabelOther;
    return label;
};

export const splitDeliveryLine = (line: string) => {
    const comma = line.indexOf(",");
    if (comma > 0 && comma <= 30 && /\b\d{5}\b/.test(line.slice(comma + 1))) {
        return { unit: line.slice(0, comma).trim(), street: line.slice(comma + 1).trim() };
    }
    return { unit: "", street: line };
};

export const formatDeliveryLine = (address: { unit?: string; address?: string }) => {
    const unit = address.unit?.trim() ?? "";
    const street = address.address?.trim() ?? "";
    if (unit && street) {
        return `${unit}, ${street}`;
    }
    return street || unit;
};

export type MalaysiaRegion = "west" | "east";

export const PROFILE_ADDRESS_ID = "profile-address";
export const DELIVERY_FEE_WEST = 7;
export const DELIVERY_FEE_EAST = 14;

export type DeliveryAddress = {
    id: string;
    label: string;
    unit: string;
    address: string;
    region: MalaysiaRegion;
};

export const normalizeStoredDeliveryAddress = (raw: Partial<DeliveryAddress> & { line?: string }): DeliveryAddress => {
    const split = raw.address != null || raw.unit != null
        ? { unit: raw.unit ?? "", street: raw.address ?? "" }
        : splitDeliveryLine(raw.line ?? "");
    return {
        id: raw.id ?? "",
        label: raw.label ?? "home",
        unit: split.unit,
        address: split.street,
        region: raw.region ?? detectMalaysiaRegion(split.street || split.unit),
    };
};

export type DeliveryOption = DeliveryAddress;

export const deliveryFeeForRegion = (region: MalaysiaRegion) => (region === "east" ? DELIVERY_FEE_EAST : DELIVERY_FEE_WEST);

const eastPattern = /\b(sabah|sarawak|labuan|kota\s*kinabalu|kuching|miri|sibu|sandakan|tawau|bintulu|沙巴|砂拉越|纳闽|古晋|亚庇)\b/i;

export const detectMalaysiaRegion = (text: string): MalaysiaRegion => (eastPattern.test(text) ? "east" : "west");

export const syncProfileAddressToDelivery = (
    settings: ProfileSettings,
    profileAddress: string | null,
    profileLabel: string,
): ProfileSettings => {
    const trimmed = profileAddress?.trim() ?? "";
    const others = settings.deliveryAddresses.filter((address) => address.id !== PROFILE_ADDRESS_ID);

    if (!trimmed) {
        return {
            ...settings,
            deliveryAddresses: others,
            defaultDeliveryAddressId:
                settings.defaultDeliveryAddressId === PROFILE_ADDRESS_ID ? (others[0]?.id ?? null) : settings.defaultDeliveryAddressId,
        };
    }

    const profileEntry: DeliveryAddress = {
        id: PROFILE_ADDRESS_ID,
        label: profileLabel,
        unit: "",
        address: trimmed,
        region: detectMalaysiaRegion(trimmed),
    };

    return {
        ...settings,
        deliveryAddresses: [profileEntry, ...others],
        defaultDeliveryAddressId: settings.defaultDeliveryAddressId ?? PROFILE_ADDRESS_ID,
    };
};

export const applyDeliveryAddresses = (
    settings: ProfileSettings,
    rows: DeliveryAddressResponse[],
    profileAddress: string | null,
    profileLabel: string,
): ProfileSettings => {
    const saved: DeliveryAddress[] = rows.map((row) => ({
        id: String(row.id),
        label: row.label,
        unit: row.unit,
        address: row.address,
        region: detectMalaysiaRegion(row.address),
    }));
    const apiDefault = rows.find((row) => row.isDefault);
    const synced = syncProfileAddressToDelivery(
        {
            ...settings,
            deliveryAddresses: saved,
            defaultDeliveryAddressId: apiDefault ? String(apiDefault.id) : null,
        },
        profileAddress,
        profileLabel,
    );
    if (!synced.defaultDeliveryAddressId && synced.deliveryAddresses[0]) {
        synced.defaultDeliveryAddressId = synced.deliveryAddresses[0].id;
    }
    return synced;
};

export const availableDeliveryAddresses = (_profile: Profile, settings: ProfileSettings): DeliveryOption[] =>
    settings.deliveryAddresses;

export const defaultDeliveryOption = (_profile: Profile, settings: ProfileSettings): DeliveryOption | null => {
    const options = settings.deliveryAddresses;
    if (options.length === 0) {
        return null;
    }
    if (settings.defaultDeliveryAddressId) {
        return options.find((option) => option.id === settings.defaultDeliveryAddressId) ?? options[0];
    }
    return options[0];
};

export const isProfileSyncedAddress = (id: string) => id === PROFILE_ADDRESS_ID;
