import type { Medicine, MedicineId, ShotView } from "@/utils/prescribed-medicine";
import { cx } from "@/utils/cx";

export const medicineShots: Record<MedicineId, Record<ShotView, string>> = {
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
};

export const MedicineShot = ({ medicine, view, className }: { medicine: Medicine; view: ShotView; className?: string }) => (
    <img
        src={medicineShots[medicine.id][view]}
        alt={medicine.name}
        className={cx("block size-full object-cover object-center", className)}
    />
);
