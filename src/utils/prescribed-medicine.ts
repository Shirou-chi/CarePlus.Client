import type { Locale } from "@/providers/locale-provider";

export const MAX_MEDICINE_UNITS = 5;
export const CART_STORAGE_KEY = "careplus-medicine-cart";
export const CART_ICON_SELECTOR = "[data-cart-icon]";
export const MEDICINE_IDS = ["amox", "para", "lora"] as const;

export type MedicineId = (typeof MEDICINE_IDS)[number];
export type PharmacyId = "clinic";
export type ShotView = "bottle" | "box" | "blister" | "label";
export type MedicineForm = "capsule" | "tablet";
export type MedicineKind = "antibiotic" | "analgesic" | "antihistamine";
export type CatalogView = "grid" | "list";

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

export const isMedicineId = (id: string | undefined): id is MedicineId =>
    !!id && (MEDICINE_IDS as readonly string[]).includes(id);

const clinic: Record<Locale, Pharmacy> = {
    en: { id: "clinic", name: "CarePlus Clinic pharmacy", area: "Collect at the counter" },
    zh: { id: "clinic", name: "CarePlus 诊所药房", area: "柜台领取" },
};

const catalog: Record<Locale, Medicine[]> = {
    en: [
        {
            id: "amox",
            brand: "CarePlus Pharmacy",
            name: "Amoxicillin 500 mg capsules",
            pack: "16 capsules",
            form: "Capsule",
            formKey: "capsule",
            kind: "antibiotic",
            origin: "Malaysia",
            method: "1 capsule, 3 times a day",
            description:
                "Prescribed after your last visit for a bacterial infection. Finish the course unless the doctor tells you to stop. Take with water. Tell the clinic if you get a rash or breathing trouble.",
            price: 12.5,
            tone: "amber",
        },
        {
            id: "para",
            brand: "CarePlus Pharmacy",
            name: "Paracetamol 500 mg tablets",
            pack: "20 tablets",
            form: "Tablet",
            formKey: "tablet",
            kind: "analgesic",
            origin: "Malaysia",
            method: "1 to 2 tablets, up to 4 times a day",
            description:
                "For fever or pain after the consult. Do not take more than 4 g in 24 hours, and do not mix with other paracetamol products. Leave a gap of at least 4 hours between doses.",
            price: 8.9,
            tone: "navy",
        },
        {
            id: "lora",
            brand: "CarePlus Pharmacy",
            name: "Loratadine 10 mg tablets",
            pack: "10 tablets",
            form: "Tablet",
            formKey: "tablet",
            kind: "antihistamine",
            origin: "Malaysia",
            method: "1 tablet once a day",
            description:
                "For the allergy symptoms noted on your record. It is non-drowsy for most people. Take it at the same time each day while the symptoms last.",
            price: 16.5,
            tone: "teal",
        },
    ],
    zh: [
        {
            id: "amox",
            brand: "CarePlus 药房",
            name: "阿莫西林 500 毫克胶囊",
            pack: "16 粒",
            form: "胶囊",
            formKey: "capsule",
            kind: "antibiotic",
            origin: "马来西亚",
            method: "每日 3 次，每次 1 粒",
            description: "上次就诊后开的抗生素。除非医生叫停，请把疗程吃完。用温水送服。如果出现皮疹或呼吸困难，立刻联系诊所。",
            price: 12.5,
            tone: "amber",
        },
        {
            id: "para",
            brand: "CarePlus 药房",
            name: "扑热息痛 500 毫克片",
            pack: "20 片",
            form: "片剂",
            formKey: "tablet",
            kind: "analgesic",
            origin: "马来西亚",
            method: "每次 1 至 2 片，每日最多 4 次",
            description: "用来退烧或止痛。24 小时内不要超过 4 克，也不要和其他含扑热息痛的药一起吃。两次服药至少间隔 4 小时。",
            price: 8.9,
            tone: "navy",
        },
        {
            id: "lora",
            brand: "CarePlus 药房",
            name: "氯雷他定 10 毫克片",
            pack: "10 片",
            form: "片剂",
            formKey: "tablet",
            kind: "antihistamine",
            origin: "马来西亚",
            method: "每日 1 次，每次 1 片",
            description: "针对你病历里记下的过敏症状。多数人吃了不会困。症状还在时，尽量每天同一时间服用。",
            price: 16.5,
            tone: "teal",
        },
    ],
};

export const getMedicineCatalog = (locale: Locale) => catalog[locale];

export const getClinicPharmacy = (locale: Locale) => clinic[locale];

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

export const roomLeft = (current: number) => Math.max(0, MAX_MEDICINE_UNITS - current);

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

export const clampAddQty = (current: number, want: number) =>
    Math.min(Math.max(0, Math.trunc(want || 0)), roomLeft(Math.trunc(current || 0)));

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.qty, 0);

export const addCartLine = (lines: CartLine[], incoming: Omit<CartLine, "qty"> & { qty: number }): { lines: CartLine[]; added: number } => {
    const added = clampAddQty(qtyInCart(lines, incoming.medicineId), incoming.qty);
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

export const setCartQty = (lines: CartLine[], medicineId: MedicineId, qty: number) =>
    sanitizeCart(lines.map((line) => (line.medicineId === medicineId ? { ...line, qty: wholeQty(qty, MAX_MEDICINE_UNITS) } : line)));

export const removeCartLine = (lines: CartLine[], medicineId: MedicineId) => lines.filter((line) => line.medicineId !== medicineId);

export const removeCartLines = (lines: CartLine[], medicineIds: MedicineId[]) => {
    const drop = new Set(medicineIds);
    return lines.filter((line) => !drop.has(line.medicineId));
};

export const formatRm = (value: number) => `RM ${value.toFixed(2)}`;
