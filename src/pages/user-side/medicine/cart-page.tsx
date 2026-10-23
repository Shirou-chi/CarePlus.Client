import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Trash01 } from "@untitledui/icons";
import { Heading } from "react-aria-components";
import { Link, Navigate, useNavigate } from "react-router";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { FormStatus } from "@/components/application/form-status";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n, type Copy } from "@/providers/locale-provider";
import {
    applyDeliveryAddresses,
    formatDeliveryLine,
    availableDeliveryAddresses,
    defaultDeliveryOption,
    deliveryFeeForRegion,
    deliveryLabelText,
    type DeliveryOption,
} from "@/utils/delivery-address";
import { profileApi } from "@/services/profileApi";
import {
    formatRm,
    getClinicPharmacy,
    MAX_MEDICINE_UNITS,
    medicineName,
    type Medicine,
    type MedicineId,
} from "@/utils/prescribed-medicine";
import { applyPaymentCards, readProfileSettings, writeProfileSettings } from "@/utils/profile-settings";
import { writeCheckoutDraft } from "@/utils/checkout-draft";

type FulfilmentMethod = "pickup" | "delivery";
type PaymentMethod = "cod" | "card" | "fpx";

type PendingRemove =
    | { type: "one"; medicineId: MedicineId; name: string }
    | { type: "many"; count: number };

export const CartPage = () => {
    const navigate = useNavigate();
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { lines, bought, setQty, remove, removeMany } = useCart();
    const [selected, setSelected] = useState<Set<MedicineId>>(() => new Set(lines.map((line) => line.medicineId)));
    const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("pickup");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [cardId, setCardId] = useState<string | null>(null);
    const [addressId, setAddressId] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);

    const [deliveryTick, setDeliveryTick] = useState(0);
    const settings = useMemo(() => (profile ? readProfileSettings(profile.id) : null), [profile, deliveryTick]);
    const deliveryOptions = profile && settings ? availableDeliveryAddresses(profile, settings) : [];
    const { medicines: catalog } = useMedicineCatalog();
    const pharmacyName = getClinicPharmacy(locale).name;

    useEffect(() => {
        if (!profile || profile.id.startsWith("fam-")) {
            return;
        }
        let cancelled = false;
        profileApi
            .listDeliveryAddresses()
            .then((rows) => {
                if (cancelled) {
                    return;
                }
                const next = applyDeliveryAddresses(readProfileSettings(profile.id), rows, profile.address, t.settingsProfileAddressLabel);
                writeProfileSettings(profile.id, next);
                setDeliveryTick((tick) => tick + 1);
            })
            .catch(() => undefined);
        profileApi
            .listPaymentCards()
            .then((rows) => {
                if (cancelled) {
                    return;
                }
                const next = applyPaymentCards(readProfileSettings(profile.id), rows);
                writeProfileSettings(profile.id, next);
                setDeliveryTick((tick) => tick + 1);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [profile, t.settingsProfileAddressLabel]);

    useEffect(() => {
        setSelected((prev) => {
            const next = new Set([...prev].filter((id) => lines.some((line) => line.medicineId === id)));
            if (next.size === 0 && lines.length > 0) {
                return new Set(lines.map((line) => line.medicineId));
            }
            return next;
        });
    }, [lines]);

    useEffect(() => {
        if (fulfilment !== "delivery" || !profile || !settings || deliveryOptions.length === 0) {
            return;
        }
        const fallback = defaultDeliveryOption(profile, settings);
        setAddressId((current) => (current && deliveryOptions.some((option) => option.id === current) ? current : fallback?.id ?? null));
    }, [deliveryOptions, fulfilment, profile, settings]);

    useEffect(() => {
        if (paymentMethod !== "card" || !settings || settings.paymentCards.length === 0) {
            return;
        }
        const fallback = settings.defaultCardId ?? settings.paymentCards[0]?.id ?? null;
        setCardId((current) => (current && settings.paymentCards.some((card) => card.id === current) ? current : fallback));
    }, [paymentMethod, settings]);

    const selectedLines = useMemo(() => lines.filter((line) => selected.has(line.medicineId)), [lines, selected]);
    const subtotal = selectedLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const activeAddress = deliveryOptions.find((option) => option.id === addressId) ?? null;
    const deliveryFee = fulfilment === "delivery" && activeAddress ? deliveryFeeForRegion(activeAddress.region) : 0;
    const total = subtotal + deliveryFee;
    const allSelected = lines.length > 0 && lines.every((line) => selected.has(line.medicineId));

    const toggleLine = (id: MedicineId, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
            return;
        }
        setSelected(new Set(lines.map((line) => line.medicineId)));
    };

    const removeSelected = () => {
        if (selected.size === 0) {
            return;
        }
        setPendingRemove({ type: "many", count: selected.size });
    };

    const confirmRemove = () => {
        if (!pendingRemove) {
            return;
        }
        if (pendingRemove.type === "one") {
            remove(pendingRemove.medicineId);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(pendingRemove.medicineId);
                return next;
            });
        } else {
            removeMany([...selected]);
            setSelected(new Set());
        }
        setPendingRemove(null);
    };

    const checkout = () => {
        setCheckoutError(null);
        if (!profile) {
            return;
        }
        if (selectedLines.length === 0) {
            setCheckoutError(t.medCartCheckoutHint);
            return;
        }
        if (fulfilment === "delivery" && (!activeAddress || deliveryOptions.length === 0)) {
            setCheckoutError(t.medCartNoDeliveryAddress);
            return;
        }
        const card = settings?.paymentCards.find((item) => item.id === cardId);
        if (paymentMethod === "card" && !card) {
            setCheckoutError(t.medCartNoPaymentCard);
            return;
        }
        writeCheckoutDraft({
            profileId: profile.id,
            fulfilment,
            paymentLabel: paymentMethod === "card" && card ? `${card.brand} ···· ${card.last4}` : paymentMethod === "fpx" ? t.medCartPayFpx : t.medCartPayCod,
            addressId: fulfilment === "delivery" ? activeAddress?.id : undefined,
            address: fulfilment === "delivery" && activeAddress ? `${deliveryOptionLabel(activeAddress, t)} · ${formatDeliveryLine(activeAddress)}` : undefined,
            deliveryFee,
            lines: selectedLines.map((line) => {
                const medicine = catalog.find((item) => item.id === line.medicineId);
                return {
                    medicineId: line.medicineId,
                    name: medicineName(locale, line.medicineId, line.name),
                    detail: medicine ? `${medicine.pack} · ${pharmacyName}` : pharmacyName,
                    unitPrice: line.unitPrice,
                    qty: line.qty,
                };
            }),
        });
        navigate("/checkout");
    };

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="careplus-landing min-h-dvh pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h1 className="text-display-xs font-semibold uppercase tracking-wide text-primary [font-family:var(--font-display)] md:text-display-sm">
                        {t.medCartPageTitle}
                    </h1>
                    <Button color="link-color" size="sm" href="/orders">
                        {t.ordersTitle}
                    </Button>
                </div>

                {lines.length === 0 ? (
                    <EmptyState className="mt-10">
                        <EmptyState.Header pattern="grid">
                            <EmptyState.Illustration type="cloud" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>{t.medCartEmpty}</EmptyState.Title>
                            <EmptyState.Description>{t.medCartEmptyHint}</EmptyState.Description>
                        </EmptyState.Content>
                        <EmptyState.Footer>
                            <Button color="primary" href="/medicine">
                                {t.medYourList}
                            </Button>
                        </EmptyState.Footer>
                    </EmptyState>
                ) : (
                    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
                        <section aria-label={t.cart} className="min-w-0">
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <Button color="secondary" size="sm" onClick={toggleAll}>
                                    {t.medCartSelectAll}
                                </Button>
                                {selected.size > 0 ? (
                                    <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={removeSelected}>
                                        {t.medCartRemoveSelected}
                                    </Button>
                                ) : null}
                            </div>

                            <ul className="flex flex-col gap-4">
                                {lines.map((line) => {
                                    const medicine = catalog.find((item) => item.id === line.medicineId);
                                    return (
                                        <CartLineCard
                                            key={line.medicineId}
                                            t={t}
                                            line={line}
                                            maxQty={Math.max(0, MAX_MEDICINE_UNITS - (bought[line.medicineId] ?? 0))}
                                            medicine={medicine}
                                            pharmacyName={pharmacyName}
                                            checked={selected.has(line.medicineId)}
                                            onCheckedChange={(checked) => toggleLine(line.medicineId, checked)}
                                            onQtyChange={(qty) => setQty(line.medicineId, qty)}
                                            onRemove={() => setPendingRemove({ type: "one", medicineId: line.medicineId, name: medicineName(locale, line.medicineId, line.name) })}
                                        />
                                    );
                                })}
                            </ul>
                        </section>

                        <aside className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary lg:sticky lg:top-28">
                            <h2 className="text-lg font-semibold text-primary">{t.medCartOrderSummary}</h2>
                            <FormStatus error={checkoutError} className="mt-4" />

                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-tertiary">{t.medCartSubtotal}</dt>
                                    <dd className="font-semibold text-primary">{formatRm(subtotal)}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-tertiary">{t.medCartDeliveryFee}</dt>
                                    <dd className="font-semibold text-primary">{formatRm(deliveryFee)}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-secondary pt-3">
                                    <dt className="text-md font-semibold text-primary">{t.medCartTotal}</dt>
                                    <dd className="text-lg font-semibold text-primary">{formatRm(total)}</dd>
                                </div>
                            </dl>

                            <div className="mt-6">
                                <p className="text-sm font-semibold text-primary">{t.medCartFulfilment}</p>
                                <RadioGroup value={fulfilment} onChange={(value) => setFulfilment(value as FulfilmentMethod)} className="mt-3 gap-4">
                                    <RadioButton value="pickup" label={t.medCartPickup} hint={t.medCartPickupHint} />
                                    <RadioButton value="delivery" label={t.medCartDelivery} hint={t.medCartDeliveryHint} />
                                </RadioGroup>
                            </div>

                            {fulfilment === "delivery" ? (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-primary">{t.medCartDeliveryAddress}</p>
                                    {deliveryOptions.length === 0 ? (
                                        <div className="mt-3 rounded-xl bg-secondary p-3">
                                            <p className="text-sm text-tertiary">{t.medCartNoDeliveryAddress}</p>
                                            <Button color="link-color" size="sm" href="/account#profile" className="mt-2">
                                                {t.medCartAddAddress}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            selectedKey={addressId ?? undefined}
                                            onSelectionChange={(key) => setAddressId(String(key))}
                                            size="sm"
                                            className="mt-3 w-full"
                                            items={deliveryOptions.map((option) => ({
                                                id: option.id,
                                                label: deliveryOptionLabel(option, t),
                                                description: `${formatDeliveryLine(option)} · ${regionLabel(option.region, t)}`,
                                            }))}
                                        >
                                            {(item) => (
                                                <SelectItem id={item.id} textValue={item.label}>
                                                    <span className="block font-medium">{item.label}</span>
                                                    <span className="block text-xs text-tertiary">{item.description}</span>
                                                </SelectItem>
                                            )}
                                        </Select>
                                    )}
                                </div>
                            ) : null}

                            <div className="mt-6">
                                <p className="text-sm font-semibold text-primary">{t.medCartPayment}</p>
                                <RadioGroup
                                    value={paymentMethod}
                                    onChange={(value) => setPaymentMethod(value as PaymentMethod)}
                                    className="mt-3 gap-4"
                                >
                                    <RadioButton
                                        value="cod"
                                        label={t.medCartPayCod}
                                        hint={fulfilment === "delivery" ? t.medCartPayCodDeliveryHint : t.medCartPayCodPickupHint}
                                    />
                                    <RadioButton value="card" label={t.medCartPayCard} hint={t.medCartPayCardHint} />
                                    <RadioButton value="fpx" label={t.medCartPayFpx} hint={t.medCartPayFpxHint} />
                                </RadioGroup>
                            </div>

                            {paymentMethod === "card" ? (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-primary">{t.medCartPaymentCard}</p>
                                    {!settings || settings.paymentCards.length === 0 ? (
                                        <div className="mt-3 rounded-xl bg-secondary p-3">
                                            <p className="text-sm text-tertiary">{t.medCartNoPaymentCard}</p>
                                            <Button color="link-color" size="sm" href="/account#payment" className="mt-2">
                                                {t.medCartAddPaymentCard}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            selectedKey={cardId ?? undefined}
                                            onSelectionChange={(key) => setCardId(String(key))}
                                            size="sm"
                                            className="mt-3 w-full"
                                            items={settings.paymentCards.map((card) => ({
                                                id: card.id,
                                                label: `${card.brand} · ${card.holderName}`,
                                                description: `•••• ${card.last4} · ${card.expiry}`,
                                            }))}
                                        >
                                            {(item) => (
                                                <SelectItem id={item.id} textValue={item.label}>
                                                    <span className="block font-medium">{item.label}</span>
                                                    <span className="block text-xs text-tertiary">{item.description}</span>
                                                </SelectItem>
                                            )}
                                        </Select>
                                    )}
                                </div>
                            ) : null}

                            <Button
                                color="primary"
                                size="lg"
                                className="careplus-ink mt-6 w-full"
                                iconTrailing={ArrowRight}
                                isDisabled={selectedLines.length === 0}
                                onClick={checkout}
                            >
                                {t.medCartCheckout}
                            </Button>
                            <p className="mt-2 text-xs text-tertiary">{t.medCartCheckoutHint}</p>
                        </aside>
                    </div>
                )}
            </main>
            <LandingFooter />

            {pendingRemove ? (
                <ModalOverlay isDismissable isOpen className="z-[70]" onOpenChange={(open) => !open && setPendingRemove(null)}>
                    <Modal className="w-full max-w-md">
                        <Dialog className="flex w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-secondary outline-hidden">
                            <Heading slot="title" className="text-lg font-semibold text-primary">
                                {t.medCartDeleteTitle}
                            </Heading>
                            <p className="mt-2 text-sm text-tertiary">
                                {pendingRemove.type === "one"
                                    ? t.medCartDeleteOneBody.replace("{name}", pendingRemove.name)
                                    : t.medCartDeleteManyBody.replace("{count}", String(pendingRemove.count))}
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <Button color="secondary" onPress={() => setPendingRemove(null)}>
                                    {t.notifCancel}
                                </Button>
                                <Button color="primary-destructive" iconLeading={Trash01} onPress={confirmRemove}>
                                    {t.medCartDeleteConfirm}
                                </Button>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            ) : null}
        </div>
    );
};

const regionLabel = (region: DeliveryOption["region"], t: Copy) =>
    region === "east" ? t.medCartEastMalaysia : t.medCartWestMalaysia;

const deliveryOptionLabel = (option: DeliveryOption, t: Copy) => deliveryLabelText(option.label, t);

const CartLineCard = ({
    t,
    line,
    maxQty,
    medicine,
    pharmacyName,
    checked,
    onCheckedChange,
    onQtyChange,
    onRemove,
}: {
    t: Copy;
    line: { medicineId: MedicineId; name: string; pharmacy: string; unitPrice: number; qty: number };
    maxQty: number;
    medicine?: Medicine;
    pharmacyName: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    onQtyChange: (qty: number) => void;
    onRemove: () => void;
}) => (
    <li className="rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
        <div className="flex gap-4">
            <Checkbox aria-label={medicine?.name ?? line.name} isSelected={checked} onChange={onCheckedChange} className="mt-1 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                <Link to={`/medicine/${line.medicineId}`} className="shrink-0 outline-focus-ring">
                    <div className="size-24 overflow-hidden rounded-xl bg-[#f4f6f8] sm:size-28">
                        {medicine ? <MedicineShot medicine={medicine} view="box" className="!object-contain p-2" /> : null}
                    </div>
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <Link
                                to={`/medicine/${line.medicineId}`}
                                className="line-clamp-2 text-md font-semibold text-primary outline-focus-ring hover:underline"
                            >
                                {medicine?.name ?? line.name}
                            </Link>
                            <p className="mt-1 text-sm text-tertiary">{pharmacyName}</p>
                            <p className="mt-2 text-md font-semibold text-primary">{formatRm(line.unitPrice * line.qty)}</p>
                        </div>
                        <Button color="tertiary-destructive" size="sm" iconLeading={Trash01} aria-label={t.medCartRemoveItem} onClick={onRemove} />
                    </div>

                    <div className="mt-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <QtyStepper qty={line.qty} maxQty={maxQty} onChange={onQtyChange} />
                            {line.qty < maxQty ? (
                                <span className="text-xs text-tertiary">{t.medQtyHint.replace("{max}", String(MAX_MEDICINE_UNITS))}</span>
                            ) : null}
                        </div>
                        {line.qty >= maxQty ? (
                            <p className="text-xs text-tertiary">{t.medCartWalkInForMore}</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    </li>
);

const QtyStepper = ({ qty, maxQty, onChange }: { qty: number; maxQty: number; onChange: (qty: number) => void }) => (
    <div className="inline-flex items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset">
        <button
            type="button"
            aria-label="Decrease quantity"
            className="inline-flex size-9 items-center justify-center rounded-l-lg text-fg-quaternary hover:bg-primary_hover disabled:opacity-40"
            disabled={qty <= 1}
            onClick={() => onChange(qty - 1)}
        >
            <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center text-sm font-semibold text-primary">{qty}</span>
        <button
            type="button"
            aria-label="Increase quantity"
            className="inline-flex size-9 items-center justify-center rounded-r-lg text-fg-quaternary hover:bg-primary_hover disabled:opacity-40"
            disabled={qty >= maxQty}
            onClick={() => onChange(qty + 1)}
        >
            <Plus className="size-4" />
        </button>
    </div>
);
