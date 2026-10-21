import {
    addCartLine,
    clampAddQty,
    filterMedicines,
    getMedicineCatalog,
    qtyInCart,
    removeCartLines,
    roomLeft,
    sanitizeCart,
    setCartQty,
    wholeQty,
    type CartLine,
} from "./prescribed-medicine.ts";

const sample: CartLine[] = [{ medicineId: "amox", pharmacyId: "clinic", name: "Amox", pharmacy: "Clinic", unitPrice: 12.5, qty: 3 }];
const catalog = getMedicineCatalog("en");

const checks = [
    roomLeft(0) === 5,
    roomLeft(5) === 0,
    clampAddQty(4, 3) === 1,
    clampAddQty(5, 1) === 0,
    clampAddQty(0, 1.9) === 1,
    wholeQty(1.9, 5) === 1,
    wholeQty(0, 5) === 1,
    wholeQty(9, 5) === 5,
    sanitizeCart([{ ...sample[0], qty: 1.9 }])[0].qty === 1,
    sanitizeCart([{ ...sample[0], pharmacyId: "guardian" as unknown as CartLine["pharmacyId"], qty: 2 }])[0].pharmacyId === "clinic",
    qtyInCart(sample, "amox") === 3,
    addCartLine(sample, { ...sample[0], qty: 4 }).added === 2,
    addCartLine(sample, { ...sample[0], qty: 4 }).lines[0].qty === 5,
    addCartLine(sample, { medicineId: "para", pharmacyId: "clinic", name: "Para", pharmacy: "Clinic", unitPrice: 8, qty: 2 }).lines.length === 2,
    setCartQty(sample, "amox", 2)[0].qty === 2,
    removeCartLines(sample, ["amox"]).length === 0,
    filterMedicines(catalog, "amox", []).length === 1,
    filterMedicines(catalog, "", ["capsule"]).every((item) => item.formKey === "capsule"),
    filterMedicines(catalog, "no-such-med", []).length === 0,
];

if (checks.some((ok) => !ok)) {
    throw new Error("prescribed-medicine cart cap check failed");
}

console.log("prescribed-medicine cart cap ok");
