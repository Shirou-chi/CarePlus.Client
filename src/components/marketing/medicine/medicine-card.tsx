import { Link, type PressEvent } from "react-aria-components";
import { MedicalCross, Package, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { MedicineShot } from "@/components/marketing/medicine/medicine-shot";
import { cx } from "@/utils/cx";
import { formatRm, type CatalogView, type Medicine } from "@/utils/prescribed-medicine";

type MedicineCardProps = {
    medicine: Medicine;
    remaining: number;
    layout: CatalogView;
    kindLabel: string;
    inStockLabel: string;
    atLimitLabel: string;
    viewMoreLabel: string;
    addLabel: string;
    onAdd: (source: HTMLElement) => void;
};

export const MedicineCard = ({
    medicine,
    remaining,
    layout,
    kindLabel,
    inStockLabel,
    atLimitLabel,
    viewMoreLabel,
    addLabel,
    onAdd,
}: MedicineCardProps) => {
    const inStock = remaining > 0;
    const list = layout === "list";

    const addOne = (event: PressEvent) => {
        const source = event.target.closest("[data-med-card]")?.querySelector("[data-med-hero]");
        if (source instanceof HTMLElement) {
            onAdd(source);
        }
    };

    return (
        <article
            data-med-card
            className={cx(
                "rounded-2xl bg-primary p-3.5 shadow-xs ring-1 ring-secondary",
                list ? "flex items-stretch gap-4" : "flex h-full flex-col",
            )}
        >
            <Link href={`/medicine/${medicine.id}`} className={cx("min-w-0 outline-focus-ring", list ? "flex flex-1 items-stretch gap-4" : "flex flex-1 flex-col")}>
                <div
                    data-med-hero
                    className={cx(
                        "overflow-hidden rounded-2xl bg-[#f4f6f8]",
                        list ? "size-28 shrink-0 sm:size-32" : "aspect-square w-full",
                    )}
                >
                    <MedicineShot medicine={medicine} view="box" className="!object-contain p-3" />
                </div>
                <div className={cx("min-w-0", list ? "flex flex-1 flex-col justify-center" : "mt-3")}>
                    <h2 className="line-clamp-2 text-sm font-semibold text-primary">{medicine.name}</h2>
                    <p className="mt-1 text-md font-semibold text-primary">{formatRm(medicine.price)}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tertiary">
                        <span className="inline-flex items-center gap-1">
                            <MedicalCross className="size-3.5" />
                            {kindLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Package className="size-3.5" />
                            {medicine.form}
                        </span>
                    </p>
                </div>
            </Link>

            <div className={cx("flex flex-col gap-3", list ? "shrink-0 self-end" : "mt-4")}>
                <p className={cx("text-sm font-medium", inStock ? "text-[#0f766e]" : "text-fg-error-primary")}>
                    {inStock ? inStockLabel : atLimitLabel}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        color="secondary"
                        size="sm"
                        href={`/medicine/${medicine.id}`}
                        className={list ? undefined : "min-w-0 flex-1"}
                    >
                        {viewMoreLabel}
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        iconLeading={Plus}
                        aria-label={addLabel}
                        isDisabled={!inStock}
                        className="careplus-ink shrink-0 rounded-full"
                        onPress={addOne}
                    />
                </div>
            </div>
        </article>
    );
};
