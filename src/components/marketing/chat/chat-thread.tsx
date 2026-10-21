import { Stars02 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { ChatMessage } from "@/utils/chat";

type ChatThreadViewProps = {
    messages: ChatMessage[];
    compact?: boolean;
};

export const ChatThreadView = ({ messages, compact }: ChatThreadViewProps) => (
    <ul className={cx("flex flex-col gap-3", compact ? "px-1" : "px-1 md:px-2")}>
        {messages.map((item) => {
            const mine = item.role === "user";
            return (
                <li key={item.id} className={cx("flex gap-2", mine ? "justify-end" : "justify-start")}>
                    {mine ? null : <FeaturedIcon icon={Stars02} size="sm" color="brand" theme="light" className="mt-0.5 shrink-0" />}
                    <p
                        className={cx(
                            "max-w-[85%] break-words rounded-2xl px-3.5 py-2.5 text-sm",
                            mine ? "bg-[#0b1f38] text-white" : "bg-primary text-primary ring-1 ring-secondary",
                        )}
                    >
                        {item.text}
                    </p>
                </li>
            );
        })}
    </ul>
);
