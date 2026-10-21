export const PHONE_REGION = "+60";

export function parsePhoneLocal(phone: string | null | undefined) {
    if (!phone) {
        return "";
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("60")) {
        return digits.slice(2).replace(/^0+/, "");
    }
    return digits.replace(/^0+/, "");
}

export function isValidLocalPhone(localDigits: string) {
    return /^1\d{8,9}$/.test(localDigits);
}

export function composePhone(nationalNumber: string) {
    const localDigits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
    if (!isValidLocalPhone(localDigits)) {
        return undefined;
    }
    return `${PHONE_REGION}${localDigits}`;
}
