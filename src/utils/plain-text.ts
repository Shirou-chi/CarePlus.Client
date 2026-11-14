const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Blocks HTML/script junk in user-facing text fields. Passwords should skip this. */
export function containsDangerousMarkup(value: string | null | undefined): boolean {
    if (!value) return false;
    if (/[<>`]/.test(value)) return true;
    if (/javascript:/i.test(value)) return true;
    return CONTROL.test(value);
}

export const dangerousMarkupMessage = "Text fields cannot contain HTML or script characters.";
