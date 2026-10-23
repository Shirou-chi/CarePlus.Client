import { mergeOrders, nextOrderId, normalizeOrderStatus, showsPaymentHistory, trackingStepsFor, type MedicineOrder } from "./order-history.ts";

const seed = { id: "CP-2026-0142" } as MedicineOrder;
const placed = { id: "CP-2026-0004" } as MedicineOrder;
const merged = mergeOrders([placed], [seed, placed]);
if (merged.map((order) => order.id).join() !== "CP-2026-0004,CP-2026-0142") {
    throw new Error("placed order should stay first");
}

const id = nextOrderId([seed, { id: "CP-2026-0003" } as MedicineOrder], new Date("2026-10-22T12:00:00+08:00"));
if (id !== "CP-2026-0004") {
    throw new Error(`expected CP-2026-0004, got ${id}`);
}

const pickup = normalizeOrderStatus("pickup", "processing");
if (pickup !== "ready_pickup") throw new Error("pickup should be ready to pickup");
const labels = { confirmed: "Order confirmed", ready: "Ready to pickup", pickedUp: "Picked up", delivered: "Delivered" };
const steps = trackingStepsFor("pickup", pickup, labels);
if (steps.join("|") !== "Order confirmed|Ready to pickup") throw new Error(steps.join("|"));
const collected = trackingStepsFor("pickup", "picked_up", labels);
if (collected.at(-1) !== "Picked up") throw new Error("picked up step missing");
if (showsPaymentHistory({ payment: "Cash on delivery", status: "ready_pickup", fulfilment: "pickup" })) throw new Error("pickup cod should hide payment until collected");
if (!showsPaymentHistory({ payment: "Cash on delivery", status: "picked_up", fulfilment: "pickup" })) throw new Error("picked up cod should show payment");
if (showsPaymentHistory({ payment: "Cash on delivery", status: "processing", fulfilment: "delivery" })) throw new Error("open delivery cod should hide payment");
if (!showsPaymentHistory({ payment: "Cash on delivery", status: "delivered", fulfilment: "delivery" })) throw new Error("delivered cod should show payment");
if (!showsPaymentHistory({ payment: "Mastercard", status: "ready_pickup", fulfilment: "pickup" })) throw new Error("card pickup should show payment");

console.log("order history ok");
