import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Link } from "react-router";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

const AUTOPLAY_MS = 4000;

export type ClinicCard = {
    image: string;
    alt: string;
};

export const ClinicCoverflow = ({ cards }: { cards: ClinicCard[] }) => {
    const { t } = useI18n();
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [zoomed, setZoomed] = useState<ClinicCard | null>(null);
    const drag = useRef<{ x: number; from: number } | null>(null);
    const skipClick = useRef(false);
    const count = cards.length;

    const go = (next: number) => {
        setActive(((next % count) + count) % count);
    };

    useEffect(() => {
        if (paused || zoomed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % count);
        }, AUTOPLAY_MS);
        return () => window.clearInterval(timer);
    }, [paused, zoomed, count]);

    return (
        <section className="mx-auto w-full max-w-container px-4 pb-10 md:px-8 md:pb-14">
            <div className="overflow-hidden rounded-3xl bg-[#0b2036] py-12 md:py-16 dark:bg-[#eef8fb]">
                <div
                    className="relative mx-auto h-[22rem] w-full max-w-5xl touch-pan-y select-none sm:h-[26rem] md:h-[30rem]"
                    style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onPointerDown={(event) => {
                        drag.current = { x: event.clientX, from: active };
                        skipClick.current = false;
                        setPaused(true);
                    }}
                    onPointerUp={(event) => {
                        if (!drag.current) {
                            return;
                        }
                        const delta = event.clientX - drag.current.x;
                        skipClick.current = Math.abs(delta) > 12;
                        if (delta < -48) {
                            go(active + 1);
                        } else if (delta > 48) {
                            go(active - 1);
                        }
                        drag.current = null;
                        setPaused(false);
                    }}
                    onPointerCancel={() => {
                        drag.current = null;
                        skipClick.current = true;
                        setPaused(false);
                    }}
                >
                    {cards.map((card, index) => {
                        let offset = index - active;
                        if (offset > count / 2) {
                            offset -= count;
                        } else if (offset < -count / 2) {
                            offset += count;
                        }

                        const abs = Math.abs(offset);
                        if (abs > 3) {
                            return null;
                        }

                        return (
                            <button
                                key={card.image}
                                type="button"
                                aria-label={card.alt}
                                aria-current={offset === 0 ? "true" : undefined}
                                className={cx(
                                    "absolute top-1/2 left-1/2 h-[18rem] w-[12.5rem] overflow-hidden rounded-[1.75rem] bg-[#1a1a1a] shadow-[0_24px_50px_rgba(0,0,0,0.45)] outline-focus-ring transition-transform duration-500 ease-out sm:h-[22rem] sm:w-[15rem] md:h-[25rem] md:w-[17rem]",
                                    offset === 0 ? "cursor-zoom-in" : "cursor-pointer",
                                )}
                                style={{
                                    zIndex: 20 - abs,
                                    transform: `translate(-50%, -50%) translateX(${offset * 42}%) translateZ(${-abs * 90}px) rotateY(${offset * -16}deg) scale(${1 - abs * 0.12})`,
                                    filter: offset === 0 ? "none" : "brightness(0.45)",
                                }}
                                onClick={() => {
                                    if (skipClick.current) {
                                        return;
                                    }
                                    if (offset !== 0) {
                                        go(index);
                                        return;
                                    }
                                    setZoomed(card);
                                }}
                            >
                                <img src={card.image} alt="" className="size-full object-cover" draggable={false} />
                            </button>
                        );
                    })}
                </div>

                <Link
                    to="/about"
                    className="group mx-auto mt-8 flex max-w-md flex-col items-center px-4 text-center outline-focus-ring focus-visible:outline-2"
                >
                    <span className="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase dark:text-[#071d35]/50">{t.clinicEnvironment}</span>
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-xl font-semibold text-white shadow-sm backdrop-blur-sm transition group-hover:border-white/60 group-hover:bg-white/15 group-hover:shadow-md [font-family:var(--font-display)] md:text-display-xs dark:border-[#071d35]/25 dark:bg-[#071d35]/8 dark:text-[#071d35] dark:group-hover:border-[#071d35]/45 dark:group-hover:bg-[#071d35]/12">
                        {t.aboutUs}
                        <ArrowRight aria-hidden className="size-5 transition group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-2 text-sm font-medium text-white/60 underline-offset-4 transition group-hover:text-white/85 group-hover:underline dark:text-[#071d35]/60 dark:group-hover:text-[#071d35]">
                        {t.aboutLearnMore}
                    </span>
                </Link>
            </div>

            <ModalOverlay isDismissable isOpen={zoomed !== null} onOpenChange={(open) => !open && setZoomed(null)}>
                <Modal className="w-fit max-w-[92vw]">
                    <Dialog className="relative w-fit">
                        {zoomed ? (
                            <>
                                <img src={zoomed.image} alt={zoomed.alt} className="max-h-[85dvh] w-auto rounded-2xl object-contain shadow-2xl" />
                                <CloseButton
                                    className="absolute top-3 right-3 bg-black/45"
                                    theme="dark"
                                    label={t.closePhoto}
                                    onPress={() => setZoomed(null)}
                                />
                            </>
                        ) : null}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </section>
    );
};
