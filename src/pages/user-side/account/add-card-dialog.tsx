import { useEffect, useRef, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Heading } from "react-aria-components";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/providers/locale-provider";
import { stripeApi } from "@/services/stripeApi";

type StripeElement = { mount: (node: HTMLElement) => void; unmount: () => void };
type StripeElements = { create: (type: "payment", options: object) => StripeElement };
type StripeClient = {
    elements: (options: object) => StripeElements;
    confirmSetup: (options: { elements: StripeElements; confirmParams: { return_url: string }; redirect: "if_required" }) => Promise<{ error?: { message?: string }; setupIntent?: { id?: string; status?: string } }>;
};
type StripeFactory = (key: string) => StripeClient;

const loadStripeJs = () => {
    const current = (window as Window & { Stripe?: StripeFactory }).Stripe;
    if (current) return Promise.resolve(current);
    return new Promise<StripeFactory>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = () => {
            const factory = (window as Window & { Stripe?: StripeFactory }).Stripe;
            if (factory) resolve(factory);
            else reject(new Error("Stripe.js did not load."));
        };
        script.onerror = () => reject(new Error("Stripe.js did not load."));
        document.head.appendChild(script);
    });
};

export const AddCardDialog = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => Promise<void> | void }) => {
    const { t } = useI18n();
    const mountRef = useRef<HTMLDivElement>(null);
    const stripeRef = useRef<StripeClient | null>(null);
    const elementsRef = useRef<StripeElements | null>(null);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        let element: StripeElement | null = null;
        setReady(false);
        setError(null);
        stripeRef.current = null;
        elementsRef.current = null;
        void (async () => {
            try {
                const [setup, Stripe] = await Promise.all([stripeApi.createCardSetup(), loadStripeJs()]);
                if (cancelled || !mountRef.current) return;
                const dark = document.documentElement.classList.contains("dark-mode");
                const stripe = Stripe(setup.publishableKey);
                const elements = stripe.elements({
                    clientSecret: setup.clientSecret,
                    appearance: { theme: dark ? "night" : "stripe", variables: { colorPrimary: dark ? "#76e2eb" : "#122b4b", borderRadius: "12px" } },
                });
                element = elements.create("payment", {
                    layout: "tabs",
                    wallets: { applePay: "never", googlePay: "never", link: "never" },
                    defaultValues: { billingDetails: { address: { country: "MY" } } },
                });
                element.mount(mountRef.current);
                stripeRef.current = stripe;
                elementsRef.current = elements;
                if (!cancelled) setReady(true);
            } catch (reason: unknown) {
                if (!cancelled) setError(reason instanceof Error ? reason.message : t.authFailed);
            }
        })();
        return () => {
            cancelled = true;
            element?.unmount();
        };
    }, [open, t.authFailed]);

    const save = async () => {
        const stripe = stripeRef.current;
        const elements = elementsRef.current;
        if (!stripe || !elements) return;
        setBusy(true);
        setError(null);
        try {
            const result = await stripe.confirmSetup({
                elements,
                confirmParams: { return_url: `${window.location.origin}/account` },
                redirect: "if_required",
            });
            if (result.error) throw new Error(result.error.message || t.authFailed);
            const intentId = result.setupIntent?.id;
            if (!intentId || result.setupIntent?.status !== "succeeded") throw new Error(t.authFailed);
            await stripeApi.completeCardSetup(intentId);
            await onSaved();
        } catch (reason: unknown) {
            const message = reason instanceof Error ? reason.message : t.authFailed;
            setError(message.toLowerCase().includes("already") ? t.settingsDuplicateCard : message);
            setBusy(false);
        }
    };

    if (!open) return null;

    return (
        <ModalOverlay isDismissable={!busy} isOpen onOpenChange={(next) => !next && !busy && onClose()}>
            <Modal className="w-full max-w-lg">
                <Dialog className="flex w-full flex-col items-stretch rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.settingsAddCardTitle}
                            </Heading>
                            <p className="mt-1 text-sm text-tertiary">{t.settingsAddCardHint}</p>
                        </div>
                        <Button color="tertiary" size="sm" iconLeading={XClose} isDisabled={busy} onClick={onClose} aria-label={t.notifCancel} />
                    </div>
                    <div className="relative mt-5 min-h-40 w-full">
                        {!ready && !error ? <p className="absolute inset-0 flex items-center justify-center text-sm text-tertiary">{t.settingsAddCardPreparing}</p> : null}
                        <div ref={mountRef} className="w-full" />
                    </div>
                    <FormStatus error={error} className="mt-4" />
                    <div className="mt-6 flex justify-end gap-3">
                        <Button color="secondary" isDisabled={busy} onClick={onClose}>
                            {t.notifCancel}
                        </Button>
                        <Button color="primary" isLoading={busy} isDisabled={!ready || busy} onClick={() => void save()}>
                            {t.settingsSaveCard}
                        </Button>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
