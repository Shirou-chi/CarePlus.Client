import { ArrowUp, Clock, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useI18n } from "@/providers/locale-provider";
import { clampChatText, MAX_CHAT_MESSAGE_CHARS } from "@/utils/chat";
import { cx } from "@/utils/cx";

type ChatComposerProps = {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onHistory?: () => void;
    compact?: boolean;
    error?: string | null;
};

export const ChatComposer = ({ value, onChange, onSend, onHistory, compact, error }: ChatComposerProps) => {
    const { t } = useI18n();
    const canSend = value.trim().length > 0;
    const nearLimit = value.length >= MAX_CHAT_MESSAGE_CHARS - 200;

    return (
        <div className="w-full min-w-0">
            <div
                className={cx(
                    "flex w-full min-w-0 items-center gap-1 bg-primary shadow-lg ring-1 ring-secondary sm:gap-2",
                    compact ? "rounded-2xl px-2 py-1.5" : "rounded-2xl px-2 py-2 sm:rounded-full sm:px-3",
                    error ? "ring-error_subtle" : null,
                )}
            >
                <ButtonUtility color="tertiary" size="sm" icon={Plus} tooltip={t.chatAttachSoon} className="shrink-0" />
                {onHistory ? <ButtonUtility color="tertiary" size="sm" icon={Clock} tooltip={t.chatHistory} className="shrink-0" onClick={onHistory} /> : null}
                <input
                    value={value}
                    maxLength={MAX_CHAT_MESSAGE_CHARS}
                    onChange={(event) => onChange(clampChatText(event.target.value))}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            if (canSend) {
                                onSend();
                            }
                        }
                    }}
                    placeholder={t.chatPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder"
                    aria-label={t.chatPlaceholder}
                    aria-invalid={error ? true : undefined}
                />
                <Button
                    color="primary"
                    size="sm"
                    iconLeading={ArrowUp}
                    aria-label={t.chatSend}
                    isDisabled={!canSend}
                    className="careplus-ink shrink-0 rounded-full"
                    onPress={onSend}
                />
            </div>
            <div className="mt-1.5 flex min-h-5 items-center justify-between gap-3 px-1">
                {error ? <p className="text-xs text-error-primary">{error}</p> : <span />}
                {nearLimit ? (
                    <p className={cx("text-xs tabular-nums", value.length >= MAX_CHAT_MESSAGE_CHARS ? "text-error-primary" : "text-tertiary")}>
                        {t.chatCharCount.replace("{count}", String(value.length)).replace("{max}", String(MAX_CHAT_MESSAGE_CHARS))}
                    </p>
                ) : null}
            </div>
        </div>
    );
};
