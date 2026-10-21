import { useState, type FC } from "react";
import { CalendarCheck01, File06, LayoutLeft, MedicalCross, Plus, Stars02 } from "@untitledui/icons";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { ChatComposer } from "@/components/marketing/chat/chat-composer";
import { ChatHistoryPanel } from "@/components/marketing/chat/chat-history-panel";
import { ChatThreadView } from "@/components/marketing/chat/chat-thread";
import { useAuth } from "@/providers/auth-provider";
import { useChat } from "@/providers/chat-provider";
import { useI18n } from "@/providers/locale-provider";
import { greetingSlot, MAX_CHAT_MESSAGE_CHARS, MAX_CHAT_MESSAGES_PER_HOUR } from "@/utils/chat";

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
    const { active, isGuest, send, sendError, clearSendError, startNew } = useChat();
    const [draft, setDraft] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);
    const slot = greetingSlot();
    const hello = profile
        ? (slot === "morning" ? t.chatMorningNamed : slot === "afternoon" ? t.chatAfternoonNamed : t.chatEveningNamed).replace("{name}", profile.fullName)
        : slot === "morning"
          ? t.chatMorningGuest
          : slot === "afternoon"
            ? t.chatAfternoonGuest
            : t.chatEveningGuest;
    const messages = active?.messages ?? [];
    const prompts: Prompt[] = [
        {
            id: "book",
            Icon: CalendarCheck01,
            title: t.chatAskBook,
            body: t.chatAskBookBody,
            cta: t.chatAskNow,
            prompt: t.chatAskBookPrompt,
        },
        {
            id: "records",
            Icon: File06,
            title: t.chatAskRecords,
            body: t.chatAskRecordsBody,
            cta: t.chatAskNow,
            prompt: t.chatAskRecordsPrompt,
        },
        {
            id: "medicine",
            Icon: MedicalCross,
            title: t.chatAskMeds,
            body: t.chatAskMedsBody,
            cta: t.chatAskNow,
            prompt: t.chatAskMedsPrompt,
        },
    ];

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
        <div className="careplus-landing flex min-h-dvh flex-col overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main className="mx-auto flex h-[calc(100dvh-4.5rem)] w-full max-w-container flex-col overflow-hidden px-4 py-4 md:h-[calc(100dvh-5.5rem)] md:px-8 md:py-6">
                <PageBreadcrumb contained={false} />
                <div className="flex shrink-0 items-center gap-2">
                    <Button color="secondary" size="sm" iconLeading={Plus} onPress={startNew}>
                        {t.chatNew}
                    </Button>
                    <div className="ml-auto">
                        <ButtonUtility color="secondary" icon={LayoutLeft} tooltip={t.chatHistory} onClick={() => setHistoryOpen(true)} />
                    </div>
                </div>

                {isGuest ? <p className="mt-4 shrink-0 rounded-xl bg-primary px-4 py-3 text-sm text-tertiary ring-1 ring-secondary">{t.chatGuestHint}</p> : null}

                <div className="mx-auto mt-6 flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden rounded-2xl border border-primary/15 bg-primary shadow-xs ring-1 ring-primary/20">
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
                        {messages.length === 0 ? (
                            <div className="flex w-full flex-col items-center pb-2">
                                <FeaturedIcon icon={Stars02} size="xl" color="brand" theme="modern" />
                                <h1 className="mt-6 text-center text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">
                                    {hello}
                                </h1>
                                <p className="mt-2 text-center text-md text-tertiary">{t.chatSubhead}</p>
                                <ul className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {prompts.map((item) => (
                                        <li key={item.id} className="flex h-full flex-col rounded-2xl bg-secondary_subtle p-5 ring-1 ring-secondary">
                                            <item.Icon className="size-5 text-fg-brand-primary" />
                                            <h2 className="mt-4 text-md font-semibold text-primary">{item.title}</h2>
                                            <p className="mt-2 flex-1 text-sm text-tertiary">{item.body}</p>
                                            <Button color="secondary" size="sm" className="mt-5 w-full rounded-full" onPress={() => send(item.prompt)}>
                                                {item.cta}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <ChatThreadView messages={messages} />
                        )}
                    </div>

                    <div className="shrink-0 border-t border-primary/15 px-3 py-3 md:px-4 md:py-4">
                        <ChatComposer
                            value={draft}
                            error={composerError}
                            onChange={(value) => {
                                clearSendError();
                                setDraft(value);
                            }}
                            onSend={sendDraft}
                            onHistory={() => setHistoryOpen(true)}
                        />
                    </div>
                </div>
            </main>
            <LandingFooter />

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
