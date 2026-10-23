import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, FilterLines, Grid01, Rows01, SearchLg } from "@untitledui/icons";
import { Link, Navigate } from "react-router";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { BadgeWithButton } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineCard } from "@/components/marketing/medicine/medicine-card";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n, type Copy } from "@/providers/locale-provider";
import {
    filterMedicines,
    formFilters,
    getClinicPharmacy,
    type CatalogView,
    type Medicine,
    type MedicineForm,
    type MedicineKind,
} from "@/utils/prescribed-medicine";

const kindLabel = (kind: MedicineKind, t: Copy) =>
    ({
        antibiotic: t.medKindAntibiotic,
        analgesic: t.medKindAnalgesic,
        antihistamine: t.medKindAntihistamine,
    })[kind];

const formLabel = (form: MedicineForm, t: Copy) => (form === "capsule" ? t.medFormCapsule : t.medFormTablet);

export const PrescribedMedicineBrowsePage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { add, flyToCart, remainingFor } = useCart();
    const { medicines, ready } = useMedicineCatalog();
    const clinic = getClinicPharmacy(locale);
    const [query, setQuery] = useState("");
    const [forms, setForms] = useState<MedicineForm[]>([]);
    const [view, setView] = useState<CatalogView>("grid");

    const results = useMemo(() => filterMedicines(medicines, query, forms), [forms, medicines, query]);

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    const toggleForm = (form: MedicineForm) => {
        setForms((list) => (list.includes(form) ? list.filter((item) => item !== form) : [...list, form]));
    };

    const addOne = (medicine: Medicine, source: HTMLElement) => {
        const remaining = remainingFor(medicine.id);
        if (remaining <= 0) {
            return;
        }
        flyToCart(source, () => {
            add({
                medicineId: medicine.id,
                pharmacyId: clinic.id,
                name: medicine.name,
                pharmacy: clinic.name,
                unitPrice: medicine.price,
                qty: 1,
            });
        });
    };

    return (
        <div className="careplus-landing min-h-dvh overflow-x-hidden pt-[4.5rem] md:pt-22">
            <LandingHeader />
            <PageBreadcrumb />
            <main className="mx-auto w-full max-w-container px-4 py-8 md:px-8 md:py-10">
                <h1 className="sr-only">{t.medTitle}</h1>
                <div className="flex items-center gap-3">
                    <Link
                        to="/home"
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-secondary hover:bg-primary_hover"
                        aria-label={t.medBack}
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <Input
                        icon={SearchLg}
                        size="md"
                        placeholder={t.medSearch}
                        value={query}
                        onChange={setQuery}
                        className="min-w-0 flex-1"
                    />
                    <div className="relative shrink-0">
                        <Dropdown.Root>
                            <Button color="secondary" size="md" iconLeading={FilterLines} aria-label={t.medFilter} />
                            <Dropdown.Popover className="w-52">
                                <Dropdown.Menu
                                    selectionMode="multiple"
                                    selectedKeys={forms}
                                    onSelectionChange={(keys) => {
                                        if (keys === "all") {
                                            setForms([...formFilters]);
                                            return;
                                        }
                                        setForms(
                                            [...keys].filter((key): key is MedicineForm => formFilters.includes(key as MedicineForm)),
                                        );
                                    }}
                                >
                                    {formFilters.map((form) => (
                                        <Dropdown.Item key={form} id={form} label={formLabel(form, t)} selectionIndicator="checkbox" />
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                        {forms.length > 0 ? (
                            <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg-error-primary px-1 text-[10px] leading-none font-semibold text-white">
                                {forms.length}
                            </span>
                        ) : null}
                    </div>
                </div>

                {forms.length > 0 ? (
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                        <p className="shrink-0 text-sm text-tertiary">{t.medFilterBy}</p>
                        {forms.map((form) => (
                            <BadgeWithButton
                                key={form}
                                size="md"
                                color="brand"
                                type="pill-color"
                                buttonLabel={t.medFilter}
                                onButtonClick={() => toggleForm(form)}
                            >
                                {formLabel(form, t)}
                            </BadgeWithButton>
                        ))}
                    </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-primary">{t.medResults.replace("{count}", String(results.length))}</p>
                    <Dropdown.Root>
                        <Button
                            size="sm"
                            color="secondary"
                            iconLeading={view === "grid" ? Grid01 : Rows01}
                            iconTrailing={ChevronDown}
                            className="*:data-icon:size-4"
                        >
                            {view === "grid" ? t.medGridView : t.medListView}
                        </Button>
                        <Dropdown.Popover className="w-44">
                            <Dropdown.Menu>
                                <Dropdown.Item icon={Grid01} onAction={() => setView("grid")}>
                                    {t.medGridView}
                                </Dropdown.Item>
                                <Dropdown.Item icon={Rows01} onAction={() => setView("list")}>
                                    {t.medListView}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                </div>

                {!ready ? null : results.length === 0 ? (
                    <EmptyState size="sm" className="mt-16">
                        <EmptyState.Header pattern="circle">
                            <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                        </EmptyState.Header>
                        <EmptyState.Content>
                            <EmptyState.Title>{t.medNoResults}</EmptyState.Title>
                            <EmptyState.Description>{t.medNoResultsHint}</EmptyState.Description>
                        </EmptyState.Content>
                    </EmptyState>
                ) : (
                    <ul className={view === "grid" ? "mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3" : "mt-5 flex flex-col gap-3"}>
                        {results.map((medicine) => {
                            const remaining = remainingFor(medicine.id);
                            return (
                                <li key={medicine.id}>
                                    <MedicineCard
                                        medicine={medicine}
                                        remaining={remaining}
                                        layout={view}
                                        kindLabel={kindLabel(medicine.kind, t)}
                                        inStockLabel={t.medInStock.replace("{count}", String(remaining))}
                                        atLimitLabel={t.medCartLimit}
                                        viewMoreLabel={t.medViewMore}
                                        addLabel={t.medAddCart}
                                        onAdd={(source) => addOne(medicine, source)}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
            <LandingFooter />
        </div>
    );
};
