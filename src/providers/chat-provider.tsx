import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
    GUEST_CHAT_KEY,
    newThread,
    readThreads,
    appendAssistantMessage,
    appendUserMessage,
    upsertThread,
    validateChatSend,
    writeThreads,
    type ChatSendBlockReason,
    type ChatThread,
} from "@/utils/chat";
import { ApiRequestError, api } from "@/services/api";

type ChatContextValue = {
    threads: ChatThread[];
    active: ChatThread | null;
    isGuest: boolean;
    isHistoryLoading: boolean;
    historyError: boolean;
    sendError: ChatSendBlockReason | null;
    isSending: boolean;
    select: (id: string) => void;
    deleteThreads: (ids: string[]) => Promise<boolean>;
    startNew: () => void;
    send: (text: string) => Promise<boolean>;
    clearSendError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { profile, isReady } = useAuth();
    const [threads, setThreads] = useState<ChatThread[]>(() => (typeof window === "undefined" ? [] : readThreads(GUEST_CHAT_KEY)));
    const [activeId, setActiveId] = useState<string | null>(null);
    const [sendError, setSendError] = useState<ChatSendBlockReason | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(false);

    useEffect(() => {
        if (!isReady) return;

        setActiveId(null);
        setSendError(null);
        setIsSending(false);
        setHistoryError(false);

        if (!profile) {
            setThreads(readThreads(GUEST_CHAT_KEY));
            setIsHistoryLoading(false);
            return;
        }

        let cancelled = false;
        setThreads([]);
        setIsHistoryLoading(true);
        api.getChatThreads()
            .then((savedThreads) => {
                if (cancelled) return;
                setThreads(savedThreads as ChatThread[]);
            })
            .catch(() => {
                if (cancelled) return;
                setThreads([]);
                setHistoryError(true);
            })
            .finally(() => {
                if (!cancelled) setIsHistoryLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isReady, profile?.id]);

    const updateThreads = useCallback(
        (next: ChatThread[]) => {
            setThreads(next);
            if (!profile) {
                writeThreads(GUEST_CHAT_KEY, next);
            }
        },
        [profile],
    );

    const active = threads.find((item) => item.id === activeId) ?? threads[0] ?? null;
    const select = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    const deleteThreads = useCallback(
        async (ids: string[]) => {
            if (ids.length === 0) return false;
            const removed = new Set(ids);
            const next = threads.filter((thread) => !removed.has(thread.id));
            updateThreads(next);
            if (activeId && removed.has(activeId)) {
                setActiveId(next[0]?.id ?? null);
            }

            if (!profile) return true;

            try {
                const persistedIds = ids.filter((id) => /^\d+$/.test(id));
                if (persistedIds.length > 0) {
                    await api.deleteChatThreads(persistedIds);
                }
                setHistoryError(false);
                return true;
            } catch {
                setThreads(threads);
                setActiveId(activeId);
                setHistoryError(true);
                return false;
            }
        },
        [activeId, profile, threads, updateThreads],
    );

    const startNew = useCallback(() => {
        const blank = threads.find((item) => item.messages.length === 0);
        if (blank) {
            setActiveId(blank.id);
            return;
        }
        const next = newThread();
        updateThreads(upsertThread(threads, next));
        setActiveId(next.id);
    }, [threads, updateThreads]);

    const send = useCallback(
        async (text: string) => {
            if (isSending) {
                return false;
            }
            const check = validateChatSend(threads, text);
            if (!check.ok) {
                if (check.reason !== "empty") {
                    setSendError(check.reason);
                }
                return false;
            }
            setSendError(null);
            const base = active ?? threads.find((item) => item.messages.length === 0) ?? newThread();
            const withUser = appendUserMessage(base, check.text);
            updateThreads(upsertThread(threads, withUser));
            setActiveId(withUser.id);
            setIsSending(true);

            try {
                if (profile) {
                    const saved = await api.sendStoredChat(check.text, /^\d+$/.test(base.id) ? base.id : undefined);
                    const withoutOptimisticThread = threads.filter((thread) => thread.id !== base.id);
                    updateThreads(upsertThread(withoutOptimisticThread, saved as ChatThread));
                    setActiveId(saved.id);
                    setHistoryError(false);
                } else {
                    const history = base.messages.slice(-6).map((message) => ({ role: message.role, content: message.text }));
                    const response = await api.sendChat(check.text, history);
                    const completed = appendAssistantMessage(withUser, response.reply, {
                        disclaimer: response.disclaimer,
                        sources: response.sources,
                    });
                    updateThreads(upsertThread(threads, completed));
                }
                return true;
            } catch (error) {
                updateThreads(threads);
                setActiveId(active?.id ?? null);
                setSendError(
                    error instanceof ApiRequestError && error.status === 429
                        ? error.code === "duplicate"
                            ? "duplicate"
                            : error.code === "cooldown"
                              ? "cooldown"
                              : "rate_limit"
                        : "service_unavailable",
                );
                return false;
            } finally {
                setIsSending(false);
            }
        },
        [active, isSending, profile, threads, updateThreads],
    );

    const clearSendError = useCallback(() => setSendError(null), []);

    const value = useMemo<ChatContextValue>(
        () => ({
            threads,
            active,
            isGuest: !profile,
            isHistoryLoading,
            historyError,
            sendError,
            isSending,
            select,
            deleteThreads,
            startNew,
            send,
            clearSendError,
        }),
        [active, clearSendError, deleteThreads, historyError, isHistoryLoading, isSending, profile, send, sendError, select, startNew, threads],
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
