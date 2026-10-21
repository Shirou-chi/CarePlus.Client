import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
    filterThreads,
    GUEST_CHAT_KEY,
    newThread,
    readThreads,
    sendInThread,
    upsertThread,
    userChatKey,
    validateChatSend,
    writeThreads,
    type ChatSendBlockReason,
    type ChatThread,
} from "@/utils/chat";

type ChatContextValue = {
    threads: ChatThread[];
    active: ChatThread | null;
    isGuest: boolean;
    query: string;
    sendError: ChatSendBlockReason | null;
    setQuery: (query: string) => void;
    filtered: ChatThread[];
    select: (id: string) => void;
    startNew: () => void;
    send: (text: string) => boolean;
    clearSendError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const key = profile ? userChatKey(profile.id) : GUEST_CHAT_KEY;
    const [threads, setThreads] = useState<ChatThread[]>(() => (typeof window === "undefined" ? [] : readThreads(key)));
    const [activeId, setActiveId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [sendError, setSendError] = useState<ChatSendBlockReason | null>(null);
    const [storeKey, setStoreKey] = useState(key);

    if (storeKey !== key) {
        const next = readThreads(key);
        setStoreKey(key);
        setThreads(next);
        setActiveId(null);
        setQuery("");
        setSendError(null);
    }

    const persist = useCallback(
        (next: ChatThread[]) => {
            setThreads(next);
            writeThreads(key, next);
        },
        [key],
    );

    const active = threads.find((item) => item.id === activeId) ?? threads[0] ?? null;
    const filtered = useMemo(() => filterThreads(threads, query), [query, threads]);

    const select = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    const startNew = useCallback(() => {
        const blank = threads.find((item) => item.messages.length === 0);
        if (blank) {
            setActiveId(blank.id);
            return;
        }
        const next = newThread();
        persist(upsertThread(threads, next));
        setActiveId(next.id);
    }, [persist, threads]);

    const send = useCallback(
        (text: string) => {
            const check = validateChatSend(threads, text);
            if (!check.ok) {
                if (check.reason !== "empty") {
                    setSendError(check.reason);
                }
                return false;
            }
            setSendError(null);
            const base = active ?? threads.find((item) => item.messages.length === 0) ?? newThread();
            const next = sendInThread(base, check.text);
            persist(upsertThread(threads, next));
            setActiveId(next.id);
            return true;
        },
        [active, persist, threads],
    );

    const clearSendError = useCallback(() => setSendError(null), []);

    const value = useMemo<ChatContextValue>(
        () => ({
            threads,
            active,
            isGuest: !profile,
            query,
            sendError,
            setQuery,
            filtered,
            select,
            startNew,
            send,
            clearSendError,
        }),
        [active, clearSendError, filtered, profile, query, send, sendError, select, startNew, threads],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within ChatProvider");
    }
    return context;
}
