import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

type ChatQuickPromptsProps = {
    compact?: boolean;
    disabled?: boolean;
    onSelect: (prompt: string) => void;
};

export const ChatQuickPrompts = ({ compact, disabled, onSelect }: ChatQuickPromptsProps) => {
    const { t } = useI18n();
    const prompts = [t.chatQuickBooking, t.chatQuickContact, t.chatQuickLocation, t.chatQuickDoctors];

    return (
        <div className="mb-2 min-w-0">
            <p className="mb-1.5 px-0.5 text-xs font-semibold text-tertiary">{t.chatQuickTitle}</p>
            <div className={cx("scrollbar-hide flex gap-2 overflow-x-auto pb-1", !compact && "sm:flex-wrap")}>
                {prompts.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(prompt)}
                        className="shrink-0 cursor-pointer rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary ring-1 ring-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};
