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
    // National digits after +60, without the leading 0.
    // 012, 013, 016, 017, 018, 019 are 9 digits. 011 is 10. 010 and 014 are 9 or 10.
    if (/^11\d{8}$/.test(localDigits)) return true;
    if (/^1[04]\d{7,8}$/.test(localDigits)) return true;
    if (/^1[236-9]\d{7}$/.test(localDigits)) return true;
    return false;
}

export function composePhone(nationalNumber: string) {
    const localDigits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
    if (!isValidLocalPhone(localDigits)) {
        return undefined;
    }
    return `${PHONE_REGION}${localDigits}`;
}
