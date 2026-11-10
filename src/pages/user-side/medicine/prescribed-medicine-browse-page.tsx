import { useState } from "react";
import { ChevronDown, Grid01, Rows01, SearchLg } from "@untitledui/icons";
import { Navigate } from "react-router";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { FormStatus } from "@/components/application/form-status";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { LandingFooter } from "@/components/marketing/header-navigation/landing-footer";
import { LandingHeader } from "@/components/marketing/header-navigation/landing-header";
import { PageBreadcrumb } from "@/components/marketing/header-navigation/page-breadcrumb";
import { MedicineCard } from "@/components/marketing/medicine/medicine-card";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useMedicineCatalog } from "@/providers/medicine-catalog";
import { useI18n, type Copy } from "@/providers/locale-provider";
import {
    getClinicPharmacy,
    type CatalogView,
    type Medicine,
    type MedicineKind,
} from "@/utils/prescribed-medicine";

const kindLabel = (kind: MedicineKind, t: Copy) =>
    ({
        antibiotic: t.medKindAntibiotic,
        analgesic: t.medKindAnalgesic,
        antihistamine: t.medKindAntihistamine,
    })[kind];

export const PrescribedMedicineBrowsePage = () => {
    const { profile, isReady } = useAuth();
    const { t, locale } = useI18n();
    const { add, flyToCart, remainingFor } = useCart();
    const { medicines, ready, error, reload } = useMedicineCatalog();
    const clinic = getClinicPharmacy(locale);
    const [view, setView] = useState<CatalogView>("grid");
    const results = medicines;

    if (!isReady) {
        return <div className="careplus-landing min-h-dvh" />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

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
                <div className="flex items-center justify-between gap-3">
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

                {!ready ? null : error ? (
                    <div className="mt-6">
                        <FormStatus error={t.medLoadFailed} />
                        <Button color="secondary" size="sm" className="mt-3" onClick={reload}>
                            {t.tryAgain}
                        </Button>
                    </div>
                ) : results.length === 0 ? (
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
