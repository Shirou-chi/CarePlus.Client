import { Mail01, MarkerPin01, Phone01 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { FaqAccordion } from "@/components/marketing/faq/faq-accordion";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { useI18n } from "@/providers/locale-provider";

const CLINIC = {
    email: "hello@careplus.my",
    phone: "+60 3-4141 8888",
    address: "Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur",
    lat: 3.215865,
    lng: 101.730489,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=TAR+UMT+Jalan+Genting+Kelang+Setapak",
};

const mapEmbedUrl = () => {
    const pad = 0.008;
    const bbox = [CLINIC.lng - pad, CLINIC.lat - pad, CLINIC.lng + pad, CLINIC.lat + pad].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${CLINIC.lat}%2C${CLINIC.lng}`;
};

export const ContactPage = () => {
    const { t } = useI18n();

    const faqItems = [
        { id: "booking", question: t.faqQ1, answer: t.faqA1 },
        { id: "hours", question: t.faqQ2, answer: t.faqA2 },
        { id: "medicine", question: t.faqQ3, answer: t.faqA3 },
        { id: "records", question: t.faqQ4, answer: t.faqA4 },
        { id: "contact", question: t.faqQ5, answer: t.faqA5 },
    ];

    const items = [
        { icon: Mail01, label: t.contactEmail, value: CLINIC.email, href: `mailto:${CLINIC.email}` },
        { icon: Phone01, label: t.contactPhone, value: CLINIC.phone, href: `tel:${CLINIC.phone.replace(/\s/g, "")}` },
        { icon: MarkerPin01, label: t.contactAddress, value: CLINIC.address, href: CLINIC.googleMapsUrl },
    ];

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <main className="mx-auto w-full max-w-container px-4 py-10 md:px-8 md:py-16">
                <div className="max-w-3xl">
                    <p className="text-sm font-semibold text-brand-secondary">{t.clinicName}</p>
                    <h1 className="mt-2 text-display-sm font-semibold text-primary [font-family:var(--font-display)]">{t.contactTitle}</h1>
                    <p className="mt-3 text-lg text-tertiary">{t.contactBody}</p>
                </div>

                <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-8">
                        <ul className="space-y-6">
                            {items.map((item) => (
                                <li key={item.label} className="flex gap-4">
                                    <FeaturedIcon icon={item.icon} color="brand" theme="light" size="lg" />
                                    <div className="min-w-0 pt-1">
                                        <p className="text-sm font-semibold text-primary">{item.label}</p>
                                        <a
                                            href={item.href}
                                            target={item.icon === MarkerPin01 ? "_blank" : undefined}
                                            rel={item.icon === MarkerPin01 ? "noreferrer" : undefined}
                                            className="mt-1 block text-md text-brand-secondary hover:text-brand-primary"
                                        >
                                            {item.value}
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="rounded-2xl bg-secondary_subtle p-5 ring-1 ring-secondary">
                            <p className="text-sm font-semibold text-primary">{t.contactHours}</p>
                            <p className="mt-1 text-md text-secondary">{t.contactHoursValue}</p>
                            <p className="mt-2 text-sm text-tertiary">{t.contactHoursNote}</p>
                        </div>
                    </div>

                    <div className="flex h-80 flex-col overflow-hidden rounded-2xl bg-secondary shadow-xs ring-1 ring-secondary lg:h-[28rem]">
                        <iframe
                            title={t.contactMapTitle}
                            src={mapEmbedUrl()}
                            className="size-full min-h-0 flex-1 border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />
                        <p className="border-t border-secondary bg-primary px-3 py-2 text-xs text-quaternary">
                            {t.contactMapAttribution}{" "}
                            <a
                                href={CLINIC.googleMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-brand-secondary hover:text-brand-primary"
                            >
                                {t.contactOpenInMaps}
                            </a>
                        </p>
                    </div>
                </div>

                <FaqAccordion items={faqItems} />
            </main>
            <LandingFooter />
        </div>
    );
};
