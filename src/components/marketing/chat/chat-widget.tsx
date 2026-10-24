import { useState } from "react";
import { Maximize01, MessageChatCircle, X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { ChatComposer } from "@/components/marketing/chat/chat-composer";
import { ChatThreadView } from "@/components/marketing/chat/chat-thread";
import { useChat } from "@/providers/chat-provider";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";
import { MAX_CHAT_MESSAGE_CHARS, MAX_CHAT_MESSAGES_PER_HOUR } from "@/utils/chat";

const FAB_BOTTOM = "bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:bottom-[max(2rem,env(safe-area-inset-bottom))]";
const FAB_BOTTOM_ABOVE_STICKY =
    "bottom-[calc(10rem+env(safe-area-inset-bottom))] lg:bottom-[max(2rem,env(safe-area-inset-bottom))]";

export const ChatWidget = ({ liftAboveStickyBar = false }: { liftAboveStickyBar?: boolean }) => {
    const { t } = useI18n();
    const { active, isGuest, send, sendError, clearSendError, startNew } = useChat();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const messages = active?.messages ?? [];

    const sendDraft = () => {
        if (send(draft)) {
            setDraft("");
        }
    };

    const composerError =
        sendError === "too_long"
            ? t.chatErrorTooLong.replace("{max}", String(MAX_CHAT_MESSAGE_CHARS))
            : sendError === "rate_limit"
              ? t.chatErrorRateLimit.replace("{limit}", String(MAX_CHAT_MESSAGES_PER_HOUR))
              : null;

    return (
        <div
            className={cx(
                "pointer-events-none fixed right-4 z-[60] flex flex-col items-end gap-3 md:right-8",
                liftAboveStickyBar ? FAB_BOTTOM_ABOVE_STICKY : FAB_BOTTOM,
            )}
        >
            {open ? (
                <section className="pointer-events-auto flex h-[min(32rem,70dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary">
                    <header className="flex items-center gap-2 border-b border-secondary px-3 py-2.5">
                        <img src="/clinic-logo.png" alt="" className="size-8 shrink-0 rounded-lg object-contain" />
                        <p className="min-w-0 flex-1 text-sm font-semibold text-primary">{t.chatTitle}</p>
                        <ButtonUtility color="tertiary" size="xs" icon={Maximize01} tooltip={t.chatOpenPage} href="/chat" />
                        <CloseButton size="xs" label={t.chatClose} onPress={() => setOpen(false)} />
                    </header>
                    {isGuest ? <p className="border-b border-secondary bg-secondary px-3 py-2 text-xs text-tertiary">{t.chatGuestHint}</p> : null}
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {messages.length === 0 ? <p className="text-sm text-tertiary">{t.chatWidgetEmpty}</p> : <ChatThreadView messages={messages} compact />}
                    </div>
                    <div className="border-t border-secondary p-3">
                        <ChatComposer
                            compact
                            value={draft}
                            error={composerError}
                            onChange={(value) => {
                                clearSendError();
                                setDraft(value);
                            }}
                            onSend={sendDraft}
                        />
                        <Button color="link-color" size="sm" className="mt-2" onPress={startNew}>
                            {t.chatNew}
                        </Button>
                    </div>
                </section>
            ) : null}

            <button
                type="button"
                aria-label={open ? t.chatClose : t.chatFabLabel}
                aria-expanded={open}
                className={cx(
                    "pointer-events-auto relative flex size-16 cursor-pointer items-center justify-center rounded-full shadow-lg outline-focus-ring transition duration-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                    open ? "careplus-ink text-white" : "bg-primary ring-2 ring-brand-solid hover:bg-secondary_subtle",
                )}
                onClick={() => setOpen((value) => !value)}
            >
                {open ? (
                    <X aria-hidden className="size-7" />
                ) : (
                    <>
                        <img src="/clinic-logo.png" alt="" className="size-10 rounded-[0.65rem] object-contain" />
                        <span
                            aria-hidden
                            className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full bg-brand-solid text-white ring-2 ring-primary shadow-sm"
                        >
                            <MessageChatCircle className="size-4" />
                        </span>
                        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-solid px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap text-white uppercase shadow-sm">
                            {t.chatFabBadge}
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};
