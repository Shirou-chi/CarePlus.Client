import type { Profile } from "@/utils/auth";
import type { ProfileSettings } from "@/utils/profile-settings";

export type MalaysiaRegion = "west" | "east";

export const PROFILE_ADDRESS_ID = "profile-address";
export const DELIVERY_FEE_WEST = 7;
export const DELIVERY_FEE_EAST = 14;

export type DeliveryAddress = {
    id: string;
    label: string;
    line: string;
    region: MalaysiaRegion;
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
        line: trimmed,
        region: detectMalaysiaRegion(trimmed),
    };

    return {
        ...settings,
        deliveryAddresses: [profileEntry, ...others],
        defaultDeliveryAddressId: settings.defaultDeliveryAddressId ?? PROFILE_ADDRESS_ID,
    };
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
