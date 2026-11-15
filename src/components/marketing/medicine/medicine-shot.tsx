import { useState } from "react";
import { baseUrl } from "@/services/api";
import type { Medicine, ShotView } from "@/utils/prescribed-medicine";
import { cx } from "@/utils/cx";

export const medicineImageUrl = (medicineId: string, imagePath?: string | null) => {
    if (!imagePath?.startsWith("medicines/")) return null;
    const file = imagePath.split("/").pop();
    if (!file) return null;
    return `${baseUrl}/api/Medicine/Image/${encodeURIComponent(medicineId)}?v=${encodeURIComponent(file)}`;
};

const fallbackShots: Record<ShotView, string> = {
    bottle: "/medicine/para-bottle.jpg",
    box: "/medicine/para-box.jpg",
    blister: "/medicine/para-blister.jpg",
    label: "/medicine/para-label.jpg",
};

export const MedicineShot = ({ medicine, view, className }: { medicine: Medicine; view: ShotView; className?: string }) => {
    const uploaded = medicineImageUrl(medicine.id, medicine.imagePath);
    const [failedPath, setFailedPath] = useState<string | null>(null);
    const showUploaded = Boolean(uploaded) && failedPath !== medicine.imagePath;

    return (
        <img
            src={showUploaded && uploaded ? uploaded : fallbackShots[view]}
            alt={medicine.name}
            className={cx("block size-full object-center", showUploaded ? "object-contain" : "object-cover", className)}
            onError={() => {
                if (medicine.imagePath) setFailedPath(medicine.imagePath);
            }}
        />
    );
};
