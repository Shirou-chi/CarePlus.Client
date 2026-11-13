import { useState } from "react";
import { Heading } from "react-aria-components";
import { MessageChatCircle, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { useChat } from "@/providers/chat-provider";
import { useI18n } from "@/providers/locale-provider";

type ChatHistoryPanelProps = {
    onPick?: () => void;
};

export const ChatHistoryPanel = ({ onPick }: ChatHistoryPanelProps) => {
    const { t } = useI18n();
    const { threads, active, isGuest, isHistoryLoading, historyError, select, startNew, deleteThreads } = useChat();
    // Blank drafts (no messages yet) stay active for composing, but do not belong in history.
    const historyThreads = threads.filter((thread) => thread.messages.length > 0);
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const [pendingDeletion, setPendingDeletion] = useState<string[] | null>(null);
    const allSelected = historyThreads.length > 0 && selected.size === historyThreads.length;

    const setThreadSelected = (id: string, checked: boolean) => {
        setSelected((current) => {
            const next = new Set(current);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const confirmDelete = async () => {
        if (!pendingDeletion) return;
        const didDelete = await deleteThreads(pendingDeletion);
        if (!didDelete) return;
        const deleted = new Set(pendingDeletion);
        setSelected((current) => new Set([...current].filter((id) => !deleted.has(id))));
        setPendingDeletion(null);
    };

    return (
        <div className="flex h-full flex-col gap-4">
            {isGuest ? <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-tertiary">{t.chatGuestHint}</p> : null}
            {historyError ? <p className="rounded-xl bg-error-secondary px-3 py-2 text-sm text-error-primary">{t.chatHistoryLoadError}</p> : null}
            {isHistoryLoading ? (
                <p className="rounded-xl bg-secondary px-3 py-6 text-center text-sm text-tertiary">{t.chatLoadingHistory}</p>
            ) : historyThreads.length === 0 ? (
                <EmptyState size="sm" className="py-8">
                    <EmptyState.Header pattern="none">
                        <EmptyState.FeaturedIcon icon={MessageChatCircle} color="gray" theme="modern" />
                    </EmptyState.Header>
                    <EmptyState.Content>
                        <EmptyState.Title>{t.chatEmptyHistory}</EmptyState.Title>
                        <EmptyState.Description>{isGuest ? t.chatGuestHint : t.chatEmptyHistoryHint}</EmptyState.Description>
                    </EmptyState.Content>
                    <EmptyState.Footer>
                        <Button size="sm" color="secondary" onClick={startNew}>
                            {t.chatNew}
                        </Button>
                    </EmptyState.Footer>
                </EmptyState>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-secondary pb-3">
                        <Checkbox
                            size="sm"
                            label={t.chatSelectAll}
                            isSelected={allSelected}
                            isIndeterminate={selected.size > 0 && !allSelected}
                            onChange={(checked) => setSelected(checked ? new Set(historyThreads.map((thread) => thread.id)) : new Set())}
                        />
                        {selected.size > 0 ? (
                            <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={() => setPendingDeletion([...selected])}>
                                {t.chatDeleteSelected.replace("{count}", String(selected.size))}
                            </Button>
                        ) : null}
                    </div>
                    <ul className="flex flex-col gap-1">
                        {historyThreads.map((thread) => (
                            <li
                                key={thread.id}
                                className={
                                    thread.id === active?.id
                                        ? "flex items-center gap-2 rounded-lg bg-primary_hover px-2"
                                        : "flex items-center gap-2 rounded-lg px-2 hover:bg-primary_hover"
                                }
                            >
                                <Checkbox
                                    aria-label={`${t.chatSelectConversation}: ${thread.title || t.chatUntitled}`}
                                    isSelected={selected.has(thread.id)}
                                    onChange={(checked) => setThreadSelected(thread.id, checked)}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        select(thread.id);
                                        onPick?.();
                                    }}
                                    className="min-w-0 flex-1 py-2.5 text-left"
                                >
                                    <span className="block truncate text-sm font-semibold text-primary">{thread.title || t.chatUntitled}</span>
                                    <span className="mt-0.5 block text-xs text-tertiary">
                                        {new Date(thread.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                                    </span>
                                </button>
                                <ButtonUtility
                                    color="tertiary"
                                    size="xs"
                                    icon={Trash01}
                                    tooltip={t.chatDeleteConversation}
                                    className="shrink-0 text-error-primary hover:text-error-primary"
                                    onClick={() => setPendingDeletion([thread.id])}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {pendingDeletion ? (
                <ModalOverlay isDismissable isOpen className="z-[70]" onOpenChange={(open) => !open && setPendingDeletion(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.chatDeleteTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">
                                {pendingDeletion.length === 1
                                    ? t.chatDeleteOneBody
                                    : t.chatDeleteManyBody.replace("{count}", String(pendingDeletion.length))}
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onClick={() => setPendingDeletion(null)}>
                                    {t.chatDeleteCancel}
                                </Button>
                                <Button color="primary-destructive" iconLeading={Trash01} onClick={confirmDelete}>
                                    {t.chatDeleteConfirm}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </div>
    );
};
