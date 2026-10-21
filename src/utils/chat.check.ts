import {
    MAX_CHAT_MESSAGE_CHARS,
    MAX_CHAT_MESSAGES_PER_HOUR,
    newThread,
    userMessagesInLastHour,
    validateChatSend,
} from "@/utils/chat";

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
console.assert(validateChatSend(rateLimited, "hello").reason === "rate_limit");
console.assert(userMessagesInLastHour(rateLimited) === MAX_CHAT_MESSAGES_PER_HOUR);
