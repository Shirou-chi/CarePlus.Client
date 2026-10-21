import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { Carousel, useCarousel } from "@/components/application/carousel/carousel-base";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";

const AUTOPLAY_MS = 5500;

type EmblaApi = UseEmblaCarouselType[1];

export type PromoSlide = {
    image: string;
    title: string;
    href: string;
};

const arrowClass =
    "absolute top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#214c59] shadow-md outline-focus-ring transition hover:bg-[#eef8fb] focus-visible:outline-2 disabled:opacity-40";

const PromoStage = ({ slides }: { slides: PromoSlide[] }) => {
    const { selectedIndex, api } = useCarousel();
    const { t } = useI18n();
    const slide = slides[selectedIndex] ?? slides[0];
    const indexLabel = String(selectedIndex + 1).padStart(2, "0");

    return (
        <>
            <p
                aria-hidden="true"
                className="pointer-events-none absolute top-[6%] left-4 z-10 font-semibold text-white/10 [font-family:var(--font-display)] text-[clamp(4.5rem,16vw,10rem)] leading-none md:left-8"
            >
                {indexLabel}
            </p>

            <Carousel.Content overflowHidden className="h-full items-stretch">
                {slides.map((item) => (
                    <Carousel.Item key={item.image} className="h-full basis-[90%] pl-3 md:basis-[80%] md:pl-5">
                        <div className="relative h-full overflow-hidden rounded-2xl bg-[#0a1622]">
                            <img src={item.image} alt="" className="size-full object-cover" />
                            <div className="absolute inset-0 bg-linear-to-r from-[#040c14]/80 via-[#040c14]/20 to-transparent" />
                        </div>
                    </Carousel.Item>
                ))}
            </Carousel.Content>

            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 max-w-lg -translate-y-1/2 px-12 md:max-w-xl md:px-16">
                <h2 className="text-lg font-semibold text-white [font-family:var(--font-display)] md:text-display-xs">{slide.title}</h2>
                <a
                    href={slide.href}
                    className="pointer-events-auto mt-3 inline-block text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
                >
                    {t.promoLearnMore}
                </a>
            </div>

            <Carousel.PrevTrigger className={cx(arrowClass, "left-3 md:left-4")}>
                <ChevronLeft className="size-5" />
            </Carousel.PrevTrigger>
            <Carousel.NextTrigger className={cx(arrowClass, "right-3 md:right-4")}>
                <ChevronRight className="size-5" />
            </Carousel.NextTrigger>

            <div className="absolute bottom-4 left-12 z-10 flex gap-2 md:bottom-5 md:left-16">
                {slides.map((item, index) => (
                    <button
                        key={item.image}
                        type="button"
                        aria-label={`${t.promoSlide} ${index + 1}`}
                        aria-current={index === selectedIndex ? "true" : undefined}
                        className={cx("h-1 w-8 rounded-full transition", index === selectedIndex ? "bg-[#76e2eb]" : "bg-white/25")}
                        onClick={() => api?.scrollTo(index)}
                    />
                ))}
            </div>
        </>
    );
};

export const PromoCarousel = ({ slides }: { slides: PromoSlide[] }) => {
    const [api, setApi] = useState<EmblaApi>();
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (!api || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const timer = window.setInterval(() => api.scrollNext(), AUTOPLAY_MS);
        return () => window.clearInterval(timer);
    }, [api, paused]);

    return (
        <section className="mx-auto w-full max-w-container px-4 pt-6 md:px-8 md:pt-8">
            <div
                className="relative mx-auto h-[min(48vh,24rem)] overflow-hidden rounded-3xl bg-[#070d14] md:h-[min(52vh,26rem)]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <Carousel.Root className="h-full" opts={{ loop: true, align: "start" }} setApi={setApi}>
                    <PromoStage slides={slides} />
                </Carousel.Root>
            </div>
        </section>
    );
};
