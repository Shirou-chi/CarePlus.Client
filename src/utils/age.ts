export function ageYears(dateOfBirth: string | null | undefined, today = new Date()): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dob.getTime()) || dob > today) return null;
    let age = today.getFullYear() - dob.getFullYear();
    const month = today.getMonth() - dob.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age < 0 ? null : age;
}

export function isUnderTwelve(dateOfBirth: string | null | undefined): boolean {
    const age = ageYears(dateOfBirth);
    return age != null && age < 12;
}
