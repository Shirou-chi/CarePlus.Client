export function normalizeIdentityCard(value: string) {
    return value.replace(/\D/g, "");
}

export function isValidIdentityCard(value: string) {
    const digits = normalizeIdentityCard(value);
    if (digits.length !== 12) {
        return false;
    }

    const year = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const day = Number(digits.slice(4, 6));
    const fullYear = year <= 29 ? 2000 + year : 1900 + year;
    const date = new Date(fullYear, month - 1, day);

    return date.getFullYear() === fullYear && date.getMonth() === month - 1 && date.getDate() === day;
}
