import type { Copy } from "@/providers/locale-provider";
import { passwordGaps } from "@/utils/password";
import { isDeliveryLabelId } from "@/utils/delivery-address";
import { isValidLocalPhone, parsePhoneLocal, PHONE_REGION } from "@/utils/phone";

export type FieldResult = { ok: true; value: string } | { ok: false; message: string };

const namePattern = /^[\p{L}\s'.-]+$/u;

export const validateFullName = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim();
    if (!trimmed) {
        return { ok: false, message: t.settingsNameRequired };
    }
    if (trimmed.length < 2) {
        return { ok: false, message: t.settingsNameShort };
    }
    if (trimmed.length > 80) {
        return { ok: false, message: t.settingsNameLong };
    }
    if (!namePattern.test(trimmed)) {
        return { ok: false, message: t.settingsNameLetters };
    }
    return { ok: true, value: trimmed };
};

export const validateEmail = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
        return { ok: false, message: t.settingsEmailRequired };
    }
    if (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { ok: false, message: t.settingsEmailFormat };
    }
    return { ok: true, value: trimmed };
};

export const validatePhoneLocal = (value: string, t: Copy): FieldResult => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
        return { ok: false, message: t.settingsPhoneRequired };
    }
    const normalized = value.trim().startsWith("+") ? value.trim() : `+60${digits.replace(/^0+/, "")}`;
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
    if (trimmed.length < 5) {
        return { ok: false, message: t.settingsAddressShort };
    }
    if (trimmed.length > 200) {
        return { ok: false, message: t.settingsAddressLong };
    }
    if (!/\b\d{5}\b/.test(trimmed)) {
        return { ok: false, message: t.settingsAddressPostcode };
    }
    return { ok: true, value: trimmed };
};

export const validatePassword = (value: string, t: Copy): FieldResult => {
    const gaps = passwordGaps(value);
    if (gaps.includes("short") || gaps.includes("long")) {
        return { ok: false, message: t.settingsPasswordLength };
    }
    if (gaps.includes("lower")) {
        return { ok: false, message: t.settingsPasswordLower };
    }
    if (gaps.includes("upper")) {
        return { ok: false, message: t.settingsPasswordUpper };
    }
    if (gaps.includes("number")) {
        return { ok: false, message: t.settingsPasswordNumber };
    }
    if (gaps.includes("symbol")) {
        return { ok: false, message: t.settingsPasswordSymbol };
    }
    return { ok: true, value };
};

const passesLuhn = (digits: string) => {
    let sum = 0;
    let alternate = false;
    for (let index = digits.length - 1; index >= 0; index -= 1) {
        let current = Number(digits[index]);
        if (alternate) {
            current *= 2;
            if (current > 9) current -= 9;
        }
        sum += current;
        alternate = !alternate;
    }
    return sum % 10 === 0;
};

export const validateCardNumber = (value: string, t: Copy): FieldResult => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
        return { ok: false, message: t.settingsCardNumberRequired };
    }
    if (digits.length < 13 || digits.length > 19) {
        return { ok: false, message: t.settingsCardNumberLength };
    }
    if (!passesLuhn(digits)) {
        return { ok: false, message: t.settingsCardNumberCheck };
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
    const trimmed = value.trim();
    if (!trimmed) {
        return { ok: false, message: t.settingsCardExpiryRequired };
    }
    const match = trimmed.match(/^(\d{2})\/?(\d{2})$/);
    if (!match) {
        return { ok: false, message: t.settingsCardExpiryRequired };
    }
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) {
        return { ok: false, message: t.settingsCardExpiryMonth };
    }
    const expiry = new Date(year, month, 0);
    if (expiry < new Date()) {
        return { ok: false, message: t.settingsCardExpiryPast };
    }
    return { ok: true, value: `${match[1]}/${match[2]}` };
};

export const CARD_HOLDER_MAX = 26;

export const validateCardHolder = (value: string, t: Copy): FieldResult => {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
        return { ok: false, message: t.settingsCardHolderRequired };
    }
    if (trimmed.length < 2 || trimmed.length > CARD_HOLDER_MAX) {
        return { ok: false, message: t.settingsCardHolderLength };
    }
    if (!/^[A-Z\s'.-]+$/.test(trimmed)) {
        return { ok: false, message: t.settingsCardHolderLetters };
    }
    return { ok: true, value: trimmed };
};

export const validateCvv = (value: string, t: Copy, cardDigits = ""): FieldResult => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
        return { ok: false, message: t.settingsCvvRequired };
    }
    const amex = /^3[47]/.test(cardDigits);
    if (amex && digits.length !== 4) {
        return { ok: false, message: t.settingsCvvAmex };
    }
    if (!amex && digits.length !== 3) {
        return { ok: false, message: t.settingsCvvLength };
    }
    return { ok: true, value: digits };
};

export const validateDeliveryLabel = (value: string, t: Copy): FieldResult => {
    if (!isDeliveryLabelId(value)) {
        return { ok: false, message: t.settingsInvalidDeliveryLabel };
    }
    return { ok: true, value };
};

export const validateDeliveryAddress = (
    unit: string,
    street: string,
    t: Copy,
): { ok: true; unit: string; address: string } | { ok: false; message: string } => {
    const unitTrimmed = unit.trim();
    if (!unitTrimmed) {
        return { ok: false, message: t.settingsUnitRequired };
    }
    if (unitTrimmed.length > 30) {
        return { ok: false, message: t.settingsUnitLong };
    }
    const streetTrimmed = street.trim();
    if (streetTrimmed.length < 5) {
        return { ok: false, message: t.settingsDeliveryShort };
    }
    if (streetTrimmed.length > 200) {
        return { ok: false, message: t.settingsDeliveryLong };
    }
    if (!/\b\d{5}\b/.test(streetTrimmed)) {
        return { ok: false, message: t.settingsAddressPostcode };
    }
    return { ok: true, unit: unitTrimmed, address: streetTrimmed };
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
