import type { Locale } from "@/providers/locale-provider";

export const MAX_MEDICINE_UNITS = 5;
export const CART_STORAGE_KEY = "careplus-medicine-cart";
export const CART_ICON_SELECTOR = "[data-cart-icon]";

export type MedicineId = string;
export type PharmacyId = "clinic";
export type ShotView = "bottle" | "box" | "blister" | "label";
export type MedicineForm = "capsule" | "tablet";
export type MedicineKind = "antibiotic" | "analgesic" | "antihistamine";
export type CatalogView = "grid" | "list";
export type MedicineImageKey = "amox" | "para" | "lora";

export type MedicineRow = {
    medicineId: string;
    medicineName: string;
    nameZh: string | null;
    description: string;
    descriptionZh: string | null;
    pack: string;
    packZh: string | null;
    form: string;
    kind: string;
    method: string;
    methodZh: string | null;
    imageKey: string;
    price: number;
    status: string;
};

export type Medicine = {
    id: MedicineId;
    brand: string;
    name: string;
    pack: string;
    form: string;
    formKey: MedicineForm;
    kind: MedicineKind;
    origin: string;
    method: string;
    description: string;
    price: number;
    tone: "amber" | "navy" | "teal";
    imageKey: MedicineImageKey;
};

export type Pharmacy = {
    id: PharmacyId;
    name: string;
    area: string;
};

export type CartLine = {
    medicineId: MedicineId;
    pharmacyId: PharmacyId;
    name: string;
    pharmacy: string;
    unitPrice: number;
    qty: number;
};

export const shotViews: ShotView[] = ["bottle", "box", "blister", "label"];
export const formFilters: MedicineForm[] = ["capsule", "tablet"];

export const isMedicineId = (id: string | undefined): id is MedicineId => !!id && /^[a-z0-9]{2,20}$/i.test(id);

const kinds: MedicineKind[] = ["antibiotic", "analgesic", "antihistamine"];
const imageKeys: MedicineImageKey[] = ["amox", "para", "lora"];

let catalogRows: MedicineRow[] = [];
let catalogReady = false;

export const setMedicineRows = (rows: MedicineRow[]) => {
    catalogRows = rows;
    catalogReady = true;
};

export const medicineCatalogReady = () => catalogReady;

const asKind = (value: string): MedicineKind => (kinds.includes(value as MedicineKind) ? (value as MedicineKind) : "analgesic");

const asImageKey = (value: string): MedicineImageKey => (imageKeys.includes(value as MedicineImageKey) ? (value as MedicineImageKey) : "para");

const toMedicine = (row: MedicineRow, locale: Locale): Medicine => {
    const zh = locale === "zh";
    const formKey: MedicineForm = row.form === "capsule" ? "capsule" : "tablet";
    const imageKey = asImageKey(row.imageKey);
    return {
        id: row.medicineId,
        brand: zh ? "CarePlus 药房" : "CarePlus Pharmacy",
        name: zh && row.nameZh ? row.nameZh : row.medicineName,
        pack: zh && row.packZh ? row.packZh : row.pack,
        form: formKey === "capsule" ? (zh ? "胶囊" : "Capsule") : zh ? "片剂" : "Tablet",
        formKey,
        kind: asKind(row.kind),
        origin: zh ? "马来西亚" : "Malaysia",
        method: zh && row.methodZh ? row.methodZh : row.method,
        description: zh && row.descriptionZh ? row.descriptionZh : row.description,
        price: Number(row.price),
        tone: imageKey === "amox" ? "amber" : imageKey === "lora" ? "teal" : "navy",
        imageKey,
    };
};

const clinic: Record<Locale, Pharmacy> = {
    en: { id: "clinic", name: "CarePlus Clinic pharmacy", area: "Collect at the counter" },
    zh: { id: "clinic", name: "CarePlus 诊所药房", area: "柜台领取" },
};

export const getMedicineCatalog = (locale: Locale) => catalogRows.map((row) => toMedicine(row, locale));

export const getClinicPharmacy = (locale: Locale) => clinic[locale];

export const medicineName = (locale: Locale, medicineId: MedicineId, fallback: string) =>
    getMedicineCatalog(locale).find((item) => item.id === medicineId)?.name ?? fallback;

export const filterMedicines = (items: Medicine[], query: string, forms: MedicineForm[]) => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
        if (forms.length > 0 && !forms.includes(item.formKey)) {
            return false;
        }
        if (!needle) {
            return true;
        }
        return [item.name, item.brand, item.form, item.pack, item.kind].join(" ").toLowerCase().includes(needle);
    });
};

export const qtyInCart = (lines: CartLine[], medicineId: MedicineId) =>
    lines.filter((line) => line.medicineId === medicineId).reduce((sum, line) => sum + line.qty, 0);

export const roomLeft = (current: number, cap = MAX_MEDICINE_UNITS) => Math.max(0, cap - current);

export const wholeQty = (n: number, cap: number) => {
    const v = Math.trunc(Number.isFinite(n) ? n : 1);
    return Math.min(Math.max(v, 1), Math.max(1, cap));
};

export const sanitizeCart = (lines: CartLine[]) => {
    const merged = new Map<MedicineId, CartLine>();
    for (const line of lines) {
        if (!isMedicineId(line.medicineId)) {
            continue;
        }
        const qty = Math.max(0, Math.trunc(Number(line.qty) || 0));
        if (qty <= 0) {
            continue;
        }
        const prev = merged.get(line.medicineId);
        merged.set(line.medicineId, {
            ...line,
            medicineId: line.medicineId,
            pharmacyId: "clinic",
            qty: Math.min(MAX_MEDICINE_UNITS, (prev?.qty ?? 0) + qty),
        });
    }
    return [...merged.values()];
};

export const clampAddQty = (current: number, want: number, cap = MAX_MEDICINE_UNITS) =>
    Math.min(Math.max(0, Math.trunc(want || 0)), roomLeft(Math.trunc(current || 0), cap));

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0);

export const addCartLine = (lines: CartLine[], incoming: Omit<CartLine, "qty"> & { qty: number }, cap = MAX_MEDICINE_UNITS): { lines: CartLine[]; added: number } => {
    const added = clampAddQty(qtyInCart(lines, incoming.medicineId), incoming.qty, cap);
    if (added <= 0) {
        return { lines, added: 0 };
    }

    const index = lines.findIndex((line) => line.medicineId === incoming.medicineId);
    if (index === -1) {
        return { lines: [...lines, { ...incoming, pharmacyId: "clinic", qty: added }], added };
    }

    return {
        lines: lines.map((line, i) => (i === index ? { ...line, pharmacyId: "clinic", qty: line.qty + added } : line)),
        added,
    };
};

export const setCartQty = (lines: CartLine[], medicineId: MedicineId, qty: number, cap = MAX_MEDICINE_UNITS) => {
    if (cap <= 0) {
        return removeCartLine(lines, medicineId);
    }
    return sanitizeCart(lines.map((line) => (line.medicineId === medicineId ? { ...line, qty: wholeQty(qty, cap) } : line)));
};

export const removeCartLine = (lines: CartLine[], medicineId: MedicineId) => lines.filter((line) => line.medicineId !== medicineId);

export const removeCartLines = (lines: CartLine[], medicineIds: MedicineId[]) => {
    const drop = new Set(medicineIds);
    return lines.filter((line) => !drop.has(line.medicineId));
};

export const formatRm = (value: number) => `RM ${value.toFixed(2)}`;
