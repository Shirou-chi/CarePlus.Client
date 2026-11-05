import { Stars02 } from "@untitledui/icons";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { ChatMessage } from "@/utils/chat";
import { useI18n } from "@/providers/locale-provider";

type ChatThreadViewProps = {
    messages: ChatMessage[];
    compact?: boolean;
    isThinking?: boolean;
};

const withoutSourceMarkers = (text: string) => text.replace(/\s*(?:\[\d+\]|【\d+】)/g, "").trim();

export const ChatThreadView = ({ messages, compact, isThinking }: ChatThreadViewProps) => {
    const { t } = useI18n();
    return (
    <ul className={cx("flex flex-col gap-3", compact ? "px-1" : "px-1 md:px-2")}>
        {messages.map((item) => {
            const mine = item.role === "user";
            const displayText = mine ? item.text : withoutSourceMarkers(item.text);
            return (
                <li key={item.id} className={cx("flex gap-2", mine ? "justify-end" : "justify-start")}>
                    {mine ? null : <FeaturedIcon icon={Stars02} size="sm" color="brand" theme="light" className="mt-0.5 shrink-0" />}
                    <div
                        className={cx(
                            "max-w-[85%] break-words rounded-2xl px-3.5 py-2.5 text-sm",
                            mine ? "bg-[#0b1f38] text-white" : "bg-primary text-primary ring-1 ring-secondary",
                        )}
                    >
                        {mine ? (
                            <p className="whitespace-pre-wrap">{displayText}</p>
                        ) : (
                            <div className="space-y-2 leading-relaxed">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p>{children}</p>,
                                        strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                                        ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5">{children}</ol>,
                                        ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5">{children}</ul>,
                                        li: ({ children }) => <li className="pl-0.5">{children}</li>,
                                        a: ({ children, href }) =>
                                            href?.startsWith("/") ? (
                                                <Link to={href} className="font-semibold text-brand-secondary underline underline-offset-2 hover:text-brand-secondary_hover">
                                                    {children}
                                                </Link>
                                            ) : (
                                                <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary underline underline-offset-2 hover:text-brand-secondary_hover">
                                                    {children}
                                                </a>
                                            ),
                                    }}
                                >
                                    {displayText}
                                </ReactMarkdown>
                            </div>
                        )}
                        {!mine && item.disclaimer ? <p className="mt-2 text-xs text-tertiary">{t.chatDisclaimer}</p> : null}
                    </div>
                </li>
            );
        })}
        {isThinking ? (
            <li role="status" aria-live="polite" className="flex justify-start gap-2">
                <FeaturedIcon icon={Stars02} size="sm" color="brand" theme="light" className="mt-0.5 shrink-0" />
                <div className="flex items-center gap-2 rounded-2xl bg-primary px-3.5 py-2.5 text-sm text-tertiary ring-1 ring-secondary">
                    <span>{t.chatThinking}</span>
                    <span aria-hidden className="flex items-center gap-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:-0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:-0.1s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary" />
                    </span>
                </div>
            </li>
        ) : null}
    </ul>
    );
};
