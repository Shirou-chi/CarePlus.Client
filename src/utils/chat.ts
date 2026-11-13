export type ChatRole = "user" | "assistant";

export type ChatMessage = {
    id: string;
    role: ChatRole;
    text: string;
    at: number;
    disclaimer?: string;
    sources?: ChatSource[];
};

export type ChatSource = {
    title: string;
    source: string;
    score: number;
};

export type ChatThread = {
    id: string;
    title: string;
    updatedAt: number;
    messages: ChatMessage[];
};

export const GUEST_CHAT_KEY = "careplus-chats-guest";
export const userChatKey = (patientId: string) => `careplus-chats:${patientId}`;

const PUBLIC_CHAT_PATHS = ["/", "/about", "/contact", "/announcements", "/login", "/register", "/forgot-password", "/doctors"];

/** Keep post-login redirects on-site. */
export const safeAppPath = (value: string | null | undefined) => {
    if (!value) return null;
    const path = value.trim();
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
    return path;
};

/** Guests hitting protected chat links go through login first, then return here. */
export const chatLinkHref = (href: string, isGuest: boolean) => {
    if (!isGuest || !href.startsWith("/")) return href;
    const pathOnly = href.split(/[?#]/)[0] || href;
    const isPublic = PUBLIC_CHAT_PATHS.some((path) => pathOnly === path || (path !== "/" && pathOnly.startsWith(`${path}/`)));
    if (isPublic) return href;
    return `/login?next=${encodeURIComponent(href)}`;
};

export const guestThreadsForImport = (threads: ChatThread[]) =>
    threads
        .filter((thread) => thread.messages.length > 0)
        .slice(0, 10)
        .map((thread) => ({
            title: thread.title || undefined,
            messages: thread.messages.slice(0, 40).map((message) => ({
                role: message.role,
                content: message.text,
                at: message.at,
                disclaimer: message.disclaimer,
            })),
        }));

export const clearGuestChats = () => {
    try {
        sessionStorage.removeItem(GUEST_CHAT_KEY);
    } catch {
        // ponytail: private mode may block sessionStorage writes
    }
};

export const MAX_CHAT_MESSAGE_CHARS = 2000;
export const MAX_CHAT_MESSAGES_PER_HOUR = 15;
export const MIN_CHAT_MESSAGE_INTERVAL_MS = 3_000;
export const DUPLICATE_CHAT_WINDOW_MS = 60_000;
const HOUR_MS = 60 * 60 * 1000;

export type ChatSendBlockReason = "empty" | "too_long" | "cooldown" | "duplicate" | "rate_limit" | "service_unavailable";

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
    const recentUserMessages = threads
        .flatMap((thread) => thread.messages)
        .filter((message) => message.role === "user")
        .sort((a, b) => b.at - a.at);
    const normalized = line.replace(/\s+/g, " ").toLocaleLowerCase();
    if (
        recentUserMessages.some(
            (message) =>
                message.at >= now - DUPLICATE_CHAT_WINDOW_MS &&
                message.text.trim().replace(/\s+/g, " ").toLocaleLowerCase() === normalized,
        )
    ) {
        return { ok: false as const, reason: "duplicate" as const };
    }
    if (recentUserMessages[0]?.at >= now - MIN_CHAT_MESSAGE_INTERVAL_MS) {
        return { ok: false as const, reason: "cooldown" as const };
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

export const appendUserMessage = (thread: ChatThread, text: string, now = Date.now()): ChatThread => {
    const line = text.trim().slice(0, MAX_CHAT_MESSAGE_CHARS);
    if (!line) {
        return thread;
    }
    const user: ChatMessage = { id: `m-${now}-u`, role: "user", text: line, at: now };
    return {
        ...thread,
        title: thread.title || titleFromText(line),
        updatedAt: now,
        messages: [...thread.messages, user],
    };
};

export const appendAssistantMessage = (
    thread: ChatThread,
    text: string,
    details?: { disclaimer?: string; sources?: ChatSource[] },
    now = Date.now(),
): ChatThread => ({
    ...thread,
    updatedAt: now,
    messages: [
        ...thread.messages,
        {
            id: `m-${now}-a`,
            role: "assistant",
            text: text.trim(),
            at: now,
            disclaimer: details?.disclaimer,
            sources: details?.sources,
        },
    ],
});

export const upsertThread = (threads: ChatThread[], next: ChatThread) => {
    const others = threads.filter((item) => item.id !== next.id);
    return [next, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
};

export const readThreads = (key: string): ChatThread[] => {
    try {
        const raw = (key === GUEST_CHAT_KEY ? sessionStorage : localStorage).getItem(key);
        if (!raw) {
            return [];
        }

        return (JSON.parse(raw) as ChatThread[]).map((thread) => {
            const messages = [...thread.messages];
            while (messages.at(-1)?.role === "user") {
                messages.pop();
            }
            return { ...thread, messages };
        });
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
