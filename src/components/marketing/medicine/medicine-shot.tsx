import type { Medicine, MedicineImageKey, ShotView } from "@/utils/prescribed-medicine";
import { cx } from "@/utils/cx";

export const medicineShots: Record<MedicineImageKey, Record<ShotView, string>> = {
    amox: {
        bottle: "/medicine/amox-bottle.jpg",
        box: "/medicine/amox-box.jpg",
        blister: "/medicine/amox-blister.jpg",
        label: "/medicine/amox-label.jpg",
    },
    para: {
        bottle: "/medicine/para-bottle.jpg",
        box: "/medicine/para-box.jpg",
        blister: "/medicine/para-blister.jpg",
        label: "/medicine/para-label.jpg",
    },
    lora: {
        bottle: "/medicine/lora-bottle.jpg",
        box: "/medicine/lora-box.jpg",
        blister: "/medicine/lora-blister.jpg",
        label: "/medicine/lora-label.jpg",
    },
    // ponytail: reuse the 12 local shots in different primary "box" slots so catalog cards are not identical
    ibu: {
        bottle: "/medicine/amox-label.jpg",
        box: "/medicine/amox-blister.jpg",
        blister: "/medicine/amox-box.jpg",
        label: "/medicine/amox-bottle.jpg",
    },
    ceti: {
        bottle: "/medicine/para-label.jpg",
        box: "/medicine/para-blister.jpg",
        blister: "/medicine/para-box.jpg",
        label: "/medicine/para-bottle.jpg",
    },
    clox: {
        bottle: "/medicine/lora-label.jpg",
        box: "/medicine/lora-blister.jpg",
        blister: "/medicine/lora-box.jpg",
        label: "/medicine/lora-bottle.jpg",
    },
};

export const MedicineShot = ({ medicine, view, className }: { medicine: Medicine; view: ShotView; className?: string }) => (
    <img
        src={medicineShots[medicine.imageKey][view]}
        alt={medicine.name}
        className={cx("block size-full object-cover object-center", className)}
    />
);
