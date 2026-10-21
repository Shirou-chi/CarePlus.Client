import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Globe01, HeartHand, MedicalCross, Package } from "@untitledui/icons";
import { Link, Navigate, useParams } from "react-router";
import { FormStatus } from "@/components/application/form-status";
import { Button } from "@/components/base/buttons/button";
import { InputNumber } from "@/components/base/input/input-number";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useI18n } from "@/providers/locale-provider";
import { cx } from "@/utils/cx";
import {
    formatRm,
    getClinicPharmacy,
    getMedicineCatalog,
    isMedicineId,
    MAX_MEDICINE_UNITS,
    shotViews,
    wholeQty,
    type ShotView,
} from "@/utils/prescribed-medicine";

const specTone = [
    { Icon: Package, box: "bg-[#ffe4d6] text-[#c2410c]" },
    { Icon: MedicalCross, box: "bg-[#d8f4ef] text-[#0f766e]" },
    { Icon: Globe01, box: "bg-[#dbeafe] text-[#1d4ed8]" },
    { Icon: HeartHand, box: "bg-[#ede9fe] text-[#6d28d9]" },
];

export const PrescribedMedicinePage = () => {
    const { id } = useParams();
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { add, flyToCart, remainingFor } = useCart();
    const medicines = getMedicineCatalog(locale);
    const clinic = getClinicPharmacy(locale);
    const [view, setView] = useState<ShotView>("bottle");
    const [qty, setQty] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    const medicine = isMedicineId(id) ? medicines.find((item) => item.id === id) : undefined;
    const remaining = medicine ? remainingFor(medicine.id) : 0;
    const canAdd = Boolean(medicine) && remaining > 0 && !adding;

    useEffect(() => {
        setView("bottle");
        setError(null);
        setSuccess(null);
    }, [id]);

    useEffect(() => {
        setQty((value) => wholeQty(value, remaining));
    }, [remaining]);

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    if (!medicine) {
        return <Navigate to="/medicine" replace />;
    }

    const specs = [
        { label: t.medPack, value: medicine.pack },
        { label: t.medForm, value: medicine.form },
        { label: t.medOrigin, value: medicine.origin },
        { label: t.medMethod, value: medicine.method },
    ];

    const addToCart = () => {
        if (!canAdd) {
            setSuccess(null);
            setError(t.medQtyMax);
            return;
        }

        setError(null);
        setSuccess(null);
        setAdding(true);
        const source = heroRef.current;
        const typed = Number(qtyInputRef.current?.value);
        const want = Number.isFinite(typed) && typed > 0 ? typed : qty;
        const payload = {
            medicineId: medicine.id,
            pharmacyId: clinic.id,
            name: medicine.name,
            pharmacy: clinic.name,
            unitPrice: medicine.price,
            qty: wholeQty(want, remaining),
        };

        const finish = () => {
            const added = add(payload);
            setAdding(false);
            if (added > 0) {
                setSuccess(t.medAdded);
            } else {
                setError(t.medQtyMax);
            }
        };

        if (source) {
            flyToCart(source, finish);
            return;
        }
        finish();
    };

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <Link
                    to="/medicine"
                    className="inline-flex size-8 items-center justify-center rounded-full ring-1 ring-secondary hover:bg-primary_hover"
                    aria-label={t.medListBack}
                >
                    <ArrowLeft className="size-4" />
                </Link>

                <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
                    <section className="lg:col-span-4">
                        <div ref={heroRef} id="med-hero" className="aspect-square overflow-hidden rounded-[1.75rem] bg-primary shadow-xs ring-1 ring-secondary">
                            <MedicineShot medicine={medicine} view={view} />
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-3">
                            {shotViews.map((shot) => (
                                <button
                                    key={shot}
                                    type="button"
                                    onClick={() => setView(shot)}
                                    className={cx(
                                        "aspect-square overflow-hidden rounded-2xl ring-1 outline-focus-ring focus-visible:outline-2",
                                        view === shot ? "ring-2 ring-[#0b1f38]" : "ring-secondary",
                                    )}
                                    aria-label={shot}
                                >
                                    <MedicineShot medicine={medicine} view={shot} />
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="lg:col-span-5">
                        <p className="text-sm text-tertiary">{medicine.brand}</p>
                        <h1 className="mt-1 text-display-xs font-semibold text-primary [font-family:var(--font-display)]">{medicine.name}</h1>
                        <p className="mt-3 text-display-sm font-semibold text-[#0f766e]">{formatRm(medicine.price)}</p>

                        <ul className="mt-6 grid grid-cols-2 gap-3">
                            {specs.map((spec, index) => {
                                const Icon = specTone[index].Icon;
                                return (
                                    <li key={spec.label} className="flex items-start gap-3 rounded-2xl bg-primary p-3.5 ring-1 ring-secondary">
                                        <span className={cx("flex size-11 shrink-0 items-center justify-center rounded-xl", specTone[index].box)}>
                                            <Icon className="size-5" />
                                        </span>
                                        <span>
                                            <span className="block text-xs text-tertiary">{spec.label}</span>
                                            <span className="mt-0.5 block text-sm font-semibold text-primary">{spec.value}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <h2 className="mt-8 text-lg font-semibold text-primary">{t.medDescription}</h2>
                        <p className="mt-2 max-w-prose text-md text-tertiary">{medicine.description}</p>
                    </section>

                    <aside className="rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary lg:sticky lg:top-28 lg:col-span-3">
                        <h2 className="text-md font-semibold text-primary">{t.medPickup}</h2>
                        <p className="mt-1 text-sm font-medium text-primary">{clinic.name}</p>
                        <p className="mt-0.5 text-sm text-tertiary">{t.medFulfilmentHint}</p>
                        <p className="mt-4 text-display-xs font-semibold text-[#0f766e]">{formatRm(medicine.price)}</p>

                        <div className="mt-5">
                            <InputNumber
                                ref={qtyInputRef}
                                label={t.medQty}
                                value={qty}
                                onChange={(value) => setQty(wholeQty(value ?? 1, remaining))}
                                minValue={1}
                                maxValue={Math.max(1, remaining)}
                                step={1}
                                formatOptions={{ maximumFractionDigits: 0 }}
                                inputClassName="text-center"
                                onKeyDown={(event) => {
                                    if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                                        event.preventDefault();
                                    }
                                }}
                                isDisabled={remaining === 0}
                                orientation="horizontal"
                                hint={remaining === 0 ? t.medQtyMax : t.medQtyHint.replace("{max}", String(MAX_MEDICINE_UNITS))}
                            />
                        </div>

                        <FormStatus error={error} success={success} />

                        <Button color="primary" size="lg" className="careplus-ink mt-5 w-full" isDisabled={!canAdd} onPress={addToCart}>
                            {t.medAddCart}
                        </Button>
                    </aside>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
};
