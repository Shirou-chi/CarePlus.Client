import { MessageChatCircle, SearchMd } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useChat } from "@/providers/chat-provider";
import { useI18n } from "@/providers/locale-provider";

type ChatHistoryPanelProps = {
    onPick?: () => void;
};

export const ChatHistoryPanel = ({ onPick }: ChatHistoryPanelProps) => {
    const { t } = useI18n();
    const { filtered, active, isGuest, query, setQuery, select, startNew } = useChat();

    return (
        <div className="flex h-full flex-col gap-4">
            <Input icon={SearchMd} size="sm" placeholder={t.chatSearch} value={query} onChange={setQuery} />
            {isGuest ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-tertiary">{t.chatGuestHint}</p> : null}
            {filtered.length === 0 ? (
                <EmptyState size="sm" className="py-8">
                    <EmptyState.Header pattern="none">
                        <EmptyState.FeaturedIcon icon={MessageChatCircle} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>{t.chatEmptyHistory}</EmptyState.Title>
                        <EmptyState.Description>{isGuest ? t.chatGuestHint : t.chatEmptyHistoryHint}</EmptyState.Description>
                    </EmptyState.Content>
                    <EmptyState.Footer>
                        <Button size="sm" color="secondary" onPress={startNew}>
                            {t.chatNew}
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            ) : (
                <ul className="flex flex-col gap-1">
                    {filtered.map((thread) => (
                        <li key={thread.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    select(thread.id);
                                    onPick?.();
                                }}
                                className={
                                    thread.id === active?.id
                                        ? "w-full rounded-lg bg-primary_hover px-3 py-2.5 text-left"
                                        : "w-full rounded-lg px-3 py-2.5 text-left hover:bg-primary_hover"
                                }
                            >
                                <span className="block text-sm font-semibold text-primary">{thread.title || t.chatUntitled}</span>
                                <span className="mt-0.5 block text-xs text-tertiary">
                                    {new Date(thread.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
