export const passwordLockoutMessage = (message: string, template: string): string | null => {
    const match = /^Account temporarily locked\. Try again in (\d+) minute\(s\)\.$/.exec(message);
    return match ? template.replace("{minutes}", match[1]) : null;
};
