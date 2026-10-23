import { useState } from "react";
import { ChevronDown, MinusCircle, PlusCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

export type FaqItem = { id: string; question: string; answer: string };

export const FaqAccordion = ({ items }: { items: FaqItem[] }) => {
    const { t } = useI18n();
    const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

    return (
        <section className="mt-16 border-t border-secondary pt-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
                <div>
                    <p className="text-sm font-semibold text-brand-secondary">{t.faqEyebrow}</p>
                    <h2 className="mt-2 text-display-xs font-semibold text-primary [font-family:var(--font-display)] md:text-display-sm">{t.faqTitle}</h2>
                    <p className="mt-3 text-lg text-tertiary">{t.faqBody}</p>
                    <Button color="secondary" size="md" href="/chat" className="mt-6">
                        {t.faqContactCta}
                    </Button>
                </div>

                <ul className="divide-y divide-secondary rounded-2xl border border-primary/15 bg-primary ring-1 ring-primary/10">
                    {items.map((item) => {
                        const open = openId === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className="flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-left outline-focus-ring focus-visible:outline-2 md:px-5 md:py-5"
                                    aria-expanded={open}
                                    onClick={() => setOpenId(open ? null : item.id)}
                                >
                                    <span className="relative mt-0.5 size-5 shrink-0">
                                        <PlusCircle
                                            aria-hidden
                                            className={cx(
                                                "absolute inset-0 size-5 text-quaternary transition duration-300 ease-out motion-reduce:transition-none",
                                                open ? "scale-75 opacity-0" : "scale-100 opacity-100",
                                            )}
                                        />
                                        <MinusCircle
                                            aria-hidden
                                            className={cx(
                                                "absolute inset-0 size-5 text-brand-secondary transition duration-300 ease-out motion-reduce:transition-none",
                                                open ? "scale-100 opacity-100" : "scale-75 opacity-0",
                                            )}
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-md font-semibold text-primary">{item.question}</span>
                                        <span
                                            aria-hidden={!open}
                                            className={cx(
                                                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                                                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                                            )}
                                        >
                                            <span className="block min-h-0 overflow-hidden">
                                                <span className="mt-2 block text-md text-tertiary">{item.answer}</span>
                                            </span>
                                        </span>
                                    </span>
                                    <ChevronDown
                                        aria-hidden
                                        className={cx(
                                            "mt-1 size-5 shrink-0 text-quaternary transition duration-300 ease-out motion-reduce:transition-none",
                                            open && "rotate-180",
                                        )}
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};
