import type { Copy } from "@/providers/locale-provider";
import { isDeliveryLabelId } from "@/utils/delivery-address";
import { isValidLocalPhone, parsePhoneLocal, PHONE_REGION } from "@/utils/phone";

export type FieldResult = { ok: true; value: string } | { ok: false; message: string };

const namePattern = /^[\p{L}\s'.-]+$/u;

export const validateFullName = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed.length > 80 || !namePattern.test(trimmed)) {
        return { ok: false, message: t.settingsInvalidFullName };
    }
    return { ok: true, value: trimmed };
};

export const validateEmail = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { ok: false, message: t.settingsInvalidEmail };
    }
    return { ok: true, value: trimmed };
};

export const validatePhoneLocal = (value: string, t: Copy): FieldResult => {
    const normalized = value.trim().startsWith("+") ? value.trim() : `+60${value.replace(/\D/g, "").replace(/^0+/, "")}`;
    const local = parsePhoneLocal(normalized);
    if (!isValidLocalPhone(local)) {
        return { ok: false, message: t.settingsInvalidPhone };
    }
    return { ok: true, value: `${PHONE_REGION}${local}` };
};

export const validateNationality = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed.length > 60 || !namePattern.test(trimmed)) {
        return { ok: false, message: t.settingsInvalidNationality };
    }
    return { ok: true, value: trimmed };
};

export const validateAddress = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim();
    if (trimmed.length < 5 || trimmed.length > 200) {
        return { ok: false, message: t.settingsInvalidAddress };
    }
    return { ok: true, value: trimmed };
};

export const validatePassword = (value: string, t: Copy): FieldResult => {
    if (value.length < 8 || value.length > 72) {
        return { ok: false, message: t.settingsInvalidPassword };
    }
    return { ok: true, value };
};

export const validateCardNumber = (value: string, t: Copy): FieldResult => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
        return { ok: false, message: t.settingsInvalidCardNumber };
    }
    return { ok: true, value: digits };
};

export const formatCardExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
        return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const validateCardExpiry = (value: string, t: Copy): FieldResult => {
    const match = value.trim().match(/^(\d{2})\/?(\d{2})$/);
    if (!match) {
        return { ok: false, message: t.settingsInvalidCardExpiry };
    }
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) {
        return { ok: false, message: t.settingsInvalidCardExpiry };
    }
    const expiry = new Date(year, month, 0);
    if (expiry < new Date()) {
        return { ok: false, message: t.settingsInvalidCardExpiry };
    }
    return { ok: true, value: `${match[1]}/${match[2]}` };
};

export const CARD_HOLDER_MAX = 26;

export const validateCardHolder = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length < 2 || trimmed.length > CARD_HOLDER_MAX || !/^[A-Z\s'.-]+$/.test(trimmed)) {
        return { ok: false, message: t.settingsInvalidCardHolder };
    }
    return { ok: true, value: trimmed };
};

export const validateCvv = (value: string, t: Copy): FieldResult => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 3 || digits.length > 4) {
        return { ok: false, message: t.settingsInvalidCvv };
    }
    return { ok: true, value: digits };
};

export const validateDeliveryLabel = (value: string, t: Copy): FieldResult => {
    if (!isDeliveryLabelId(value)) {
        return { ok: false, message: t.settingsInvalidDeliveryLabel };
    }
    return { ok: true, value };
};

export const validateDeliveryAddress = (unit: string, street: string, t: Copy): FieldResult => {
    const unitTrimmed = unit.trim();
    if (unitTrimmed.length < 1 || unitTrimmed.length > 30) {
        return { ok: false, message: t.settingsInvalidDeliveryUnit };
    }
    const streetTrimmed = street.trim();
    if (streetTrimmed.length < 5 || !/\b\d{5}\b/.test(streetTrimmed)) {
        return { ok: false, message: t.settingsDeliveryPostcodeRequired };
    }
    const line = `${unitTrimmed}, ${streetTrimmed}`;
    if (line.length > 200) {
        return { ok: false, message: t.settingsInvalidAddress };
    }
    return { ok: true, value: line };
};

export const validateProfileField = (field: "fullName" | "email" | "phone" | "nationality" | "address", value: string, t: Copy): FieldResult => {
    if (field === "fullName") return validateFullName(value, t);
    if (field === "email") return validateEmail(value, t);
    if (field === "phone") return validatePhoneLocal(value, t);
    if (field === "nationality") return validateNationality(value, t);
    return validateAddress(value, t);
};

export const formatPhoneForDisplay = (phone: string | null) => {
    const local = parsePhoneLocal(phone);
    return { region: "+60", local: local || "—" };
};
