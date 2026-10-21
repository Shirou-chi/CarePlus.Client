export type ChatRole = "user" | "assistant";

export type ChatMessage = {
    id: string;
    role: ChatRole;
    text: string;
    at: number;
};

export type ChatThread = {
    id: string;
    title: string;
    updatedAt: number;
    messages: ChatMessage[];
};

export const GUEST_CHAT_KEY = "careplus-chats-guest";
export const userChatKey = (patientId: string) => `careplus-chats:${patientId}`;

export const MAX_CHAT_MESSAGE_CHARS = 2000;
export const MAX_CHAT_MESSAGES_PER_HOUR = 15;
const HOUR_MS = 60 * 60 * 1000;

export type ChatSendBlockReason = "empty" | "too_long" | "rate_limit";

export const clampChatText = (text: string) => text.slice(0, MAX_CHAT_MESSAGE_CHARS);

export const userMessagesInLastHour = (threads: ChatThread[], now = Date.now()) =>
    threads
        .flatMap((thread) => thread.messages)
        .filter((message) => message.role === "user" && message.at >= now - HOUR_MS).length;

export const validateChatSend = (threads: ChatThread[], text: string, now = Date.now()) => {
    const line = text.trim();
    if (!line) {
        return { ok: false as const, reason: "empty" as const };
    }
    if (line.length > MAX_CHAT_MESSAGE_CHARS) {
        return { ok: false as const, reason: "too_long" as const };
    }
    if (userMessagesInLastHour(threads, now) >= MAX_CHAT_MESSAGES_PER_HOUR) {
        return { ok: false as const, reason: "rate_limit" as const };
    }
    return { ok: true as const, text: line };
};

export const greetingSlot = (now = Date.now()): "morning" | "afternoon" | "evening" => {
    const hour = Number(
        new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kuala_Lumpur" })
            .formatToParts(new Date(now))
            .find((part) => part.type === "hour")?.value ?? 12,
    );
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
};

export const newThread = (now = Date.now()): ChatThread => ({
    id: `chat-${now}`,
    title: "",
    updatedAt: now,
    messages: [],
});

export const titleFromText = (text: string) => {
    const line = text.trim().replace(/\s+/g, " ");
    return line.length > 42 ? `${line.slice(0, 39)}…` : line;
};

export const dummyReply = (text: string) => {
    const q = text.toLowerCase();
    if (/(book|visit|slot|doctor|appointment)/.test(q)) {
        return "You can book from Appointments. Pick who the visit is for, a doctor or any doctor, then a 30-minute slot. Clinic hours run through the night.";
    }
    if (/(record|phr|blood|pressure|allerg)/.test(q)) {
        return "Health records live on this login under Records. Readings, tags, and past treatments stay on the device in this demo.";
    }
    if (/(medicine|prescription|pickup|deliver|cart|pharmacy)/.test(q)) {
        return "Prescribed medicine is on the medicine page. Add units to the cart, then choose pickup or delivery at checkout.";
    }
    if (/(hour|open|24|night)/.test(q)) {
        return "CarePlus Clinic is a 24-hour clinic. Morning slots run 6:00–17:30, night slots 18:00–05:30, Kuala Lumpur time.";
    }
    return "I'm a clinic helper for this demo. Ask about booking, records, or prescribed medicine, or open those pages from the header.";
};

export const sendInThread = (thread: ChatThread, text: string, now = Date.now()): ChatThread => {
    const line = text.trim().slice(0, MAX_CHAT_MESSAGE_CHARS);
    if (!line) {
        return thread;
    }
    const user: ChatMessage = { id: `m-${now}-u`, role: "user", text: line, at: now };
    const assistant: ChatMessage = { id: `m-${now}-a`, role: "assistant", text: dummyReply(line), at: now + 1 };
    return {
        ...thread,
        title: thread.title || titleFromText(line),
        updatedAt: now + 1,
        messages: [...thread.messages, user, assistant],
    };
};

export const upsertThread = (threads: ChatThread[], next: ChatThread) => {
    const others = threads.filter((item) => item.id !== next.id);
    return [next, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
};

export const readThreads = (key: string): ChatThread[] => {
    try {
        const raw = (key === GUEST_CHAT_KEY ? sessionStorage : localStorage).getItem(key);
        return raw ? (JSON.parse(raw) as ChatThread[]) : [];
    } catch {
        return [];
    }
};

export const writeThreads = (key: string, threads: ChatThread[]) => {
    const store = key === GUEST_CHAT_KEY ? sessionStorage : localStorage;
    store.setItem(key, JSON.stringify(threads));
};

export const filterThreads = (threads: ChatThread[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
        return threads;
    }
    return threads.filter((thread) => thread.title.toLowerCase().includes(q) || thread.messages.some((item) => item.text.toLowerCase().includes(q)));
};
