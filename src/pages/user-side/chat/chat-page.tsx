import { useEffect, useState, type FC } from "react";
import { CalendarCheck01, LayoutLeft, Plus, Stars02 } from "@untitledui/icons";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { ChatComposer } from "@/components/marketing/chat/chat-composer";
import { ChatHistoryPanel } from "@/components/marketing/chat/chat-history-panel";
import { ChatQuickPrompts } from "@/components/marketing/chat/chat-quick-prompts";
import { ChatThreadView } from "@/components/marketing/chat/chat-thread";
import { useAnimatedChatScroll } from "@/components/marketing/chat/use-animated-chat-scroll";
import { useAuth } from "@/providers/auth-provider";
import { useChat } from "@/providers/chat-provider";
import { useI18n } from "@/providers/locale-provider";
import { greetingSlot, MAX_CHAT_MESSAGE_CHARS, MAX_CHAT_MESSAGES_PER_HOUR } from "@/utils/chat";

const resetChatViewport = () => {
    // ponytail: iOS Safari leaves the page scrolled after the keyboard closes
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
};

type Prompt = {
    id: string;
    Icon: FC<{ className?: string }>;
    title: string;
    body: string;
    cta: string;
    prompt: string;
};

export const ChatPage = () => {
    const { t } = useI18n();
    const { profile } = useAuth();
    const { active, isGuest, send, sendError, isSending, clearSendError, startNew } = useChat();
    const [draft, setDraft] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);

    // Logged-in: leaving /chat and coming back mounts this page again with a blank chat; prior threads stay in history.
    useEffect(() => {
        if (isGuest) return;
        startNew();
        setDraft("");
        clearSendError();
    }, []);
    const slot = greetingSlot();
    const hello = profile
        ? (slot === "morning" ? t.chatMorningNamed : slot === "afternoon" ? t.chatAfternoonNamed : t.chatEveningNamed).replace("{name}", profile.fullName)
        : slot === "morning"
          ? t.chatMorningGuest
          : slot === "afternoon"
            ? t.chatAfternoonGuest
            : t.chatEveningGuest;
    const messages = active?.messages ?? [];
    const latestMessageId = messages.at(-1)?.id;
    const threadScrollRef = useAnimatedChatScroll(`${latestMessageId ?? "empty"}:${isSending}`);
    const primaryPrompt: Prompt = {
        id: "book",
        Icon: CalendarCheck01,
        title: t.chatAskBook,
        body: t.chatAskBookBody,
        cta: t.chatAskNow,
        prompt: t.chatAskBookPrompt,
    };
    const PrimaryPromptIcon = primaryPrompt.Icon;

    useEffect(() => {
        resetChatViewport();
        let lastHeight = window.visualViewport?.height ?? window.innerHeight;
        const onViewport = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            // Only snap back when the keyboard is closing (viewport grows again).
            if (height > lastHeight + 40) {
                resetChatViewport();
            }
            lastHeight = height;
        };
        window.visualViewport?.addEventListener("resize", onViewport);
        return () => window.visualViewport?.removeEventListener("resize", onViewport);
    }, []);

    const sendDraft = async () => {
        if (await send(draft)) {
            setDraft("");
            // Dismiss the keyboard so the layout can snap back.
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.setTimeout(resetChatViewport, 50);
            window.setTimeout(resetChatViewport, 300);
        }
    };

    const composerError =
        sendError === "too_long"
            ? t.chatErrorTooLong.replace("{max}", String(MAX_CHAT_MESSAGE_CHARS))
            : sendError === "duplicate"
              ? t.chatErrorDuplicate
              : sendError === "cooldown"
                ? t.chatErrorCooldown
            : sendError === "rate_limit"
              ? t.chatErrorRateLimit.replace("{limit}", String(MAX_CHAT_MESSAGES_PER_HOUR))
              : sendError === "service_unavailable"
                ? t.chatErrorUnavailable
                : null;

    return (
        <div className="careplus-landing flex flex-col overflow-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main className="careplus-chat-main mx-auto flex min-h-0 w-full max-w-container flex-1 flex-col overflow-hidden px-4 py-3 md:px-8 md:py-6">
                <PageBreadcrumb contained={false} />
                <div className="flex shrink-0 items-center gap-2">
                    <Button color="secondary" size="sm" iconLeading={Plus} onClick={startNew}>
                        {t.chatNew}
                    </Button>
                    <div className="ml-auto">
                        <ButtonUtility color="secondary" icon={LayoutLeft} tooltip={t.chatHistory} onClick={() => setHistoryOpen(true)} />
                    </div>
                </div>

                {isGuest ? (
                    <div className="mt-3 flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                        <p className="min-w-0 flex-1 text-sm text-tertiary">{t.chatGuestHint}</p>
                        <Button href="/login" color="primary" size="sm">
                            {t.signIn}
                        </Button>
                    </div>
                ) : null}

                <div className="mx-auto mt-4 flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl border border-primary/15 bg-primary shadow-xs ring-1 ring-primary/20 md:mt-6">
                    <div ref={threadScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-5 [overflow-anchor:none]">
                        {messages.length === 0 ? (
                            <div className="flex w-full flex-col items-center pb-2">
                                <FeaturedIcon icon={Stars02} size="xl" color="brand" theme="modern" />
                                <h1 className="mt-4 text-center text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                    {hello}
                                </h1>
                                <p className="mt-2 text-center text-md text-tertiary">{t.chatSubhead}</p>
                                {/* One primary prompt stays above the fold; more live in quick prompts under the composer. */}
                                <div className="mt-6 w-full max-w-md rounded-2xl bg-secondary p-5 ring-1 ring-secondary">
                                    <PrimaryPromptIcon className="size-5 text-fg-brand-primary" />
                                    <h2 className="mt-3 text-md font-semibold text-primary">{primaryPrompt.title}</h2>
                                    <p className="mt-2 text-sm text-tertiary">{primaryPrompt.body}</p>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="mt-4 w-full rounded-full"
                                        isDisabled={isSending}
                                        onClick={() => void send(primaryPrompt.prompt)}
                                    >
                                        {primaryPrompt.cta}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <ChatThreadView messages={messages} isThinking={isSending} />
                        )}
                    </div>

                    <div className="shrink-0 border-t border-primary/15 px-3 py-3 md:px-4 md:py-4">
                        <ChatQuickPrompts disabled={isSending} onSelect={(prompt) => void send(prompt)} />
                        <ChatComposer
                            value={draft}
                            error={composerError}
                            onChange={(value) => {
                                clearSendError();
                                setDraft(value);
                            }}
                            onSend={sendDraft}
                            isSending={isSending}
                            onHistory={() => setHistoryOpen(true)}
                        />
                    </div>
                </div>
            </main>

            <SlideoutMenu isOpen={historyOpen} onOpenChange={setHistoryOpen}>
                {({ close }) => (
                    <>
                        <SlideoutMenu.Header onClose={close}>
                            <h2 className="pr-10 text-lg font-semibold text-primary">{t.chatHistory}</h2>
                        </SlideoutMenu.Header>
                        <SlideoutMenu.Content>
                            <ChatHistoryPanel onPick={close} />
                        </SlideoutMenu.Content>
                    </>
                )}
            </SlideoutMenu>
        </div>
    );
};
