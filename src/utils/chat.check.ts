import {
    MAX_CHAT_MESSAGE_CHARS,
    MAX_CHAT_MESSAGES_PER_HOUR,
    chatLinkHref,
    newThread,
    safeAppPath,
    userMessagesInLastHour,
    validateChatSend,
} from "./chat.ts";

console.assert(safeAppPath("/book") === "/book");
console.assert(safeAppPath("//evil.com") === null);
console.assert(chatLinkHref("/book", true) === "/login?next=%2Fbook");
console.assert(chatLinkHref("/contact", true) === "/contact");
console.assert(chatLinkHref("/book", false) === "/book");

const hourAgo = Date.now() - 30 * 60 * 1000;
const rateLimited = [
    {
        ...newThread(hourAgo),
        messages: Array.from({ length: MAX_CHAT_MESSAGES_PER_HOUR }, (_, index) => ({
            id: `u-${index}`,
            role: "user" as const,
            text: "hi",
            at: hourAgo + index,
        })),
    },
];

console.assert(validateChatSend([], "").ok === false);
console.assert(validateChatSend([], "ok").ok === true);
console.assert(validateChatSend([], "x".repeat(MAX_CHAT_MESSAGE_CHARS + 1)).reason === "too_long");
const recent = [
    {
        ...newThread(Date.now()),
        messages: [{ id: "recent", role: "user" as const, text: "hello clinic", at: Date.now() - 1_000 }],
    },
];
console.assert(validateChatSend(recent, "hello clinic").reason === "duplicate");
console.assert(validateChatSend(recent, "a different question").reason === "cooldown");
console.assert(validateChatSend(rateLimited, "hello").reason === "rate_limit");
console.assert(userMessagesInLastHour(rateLimited) === MAX_CHAT_MESSAGES_PER_HOUR);
