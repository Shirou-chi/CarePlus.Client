import { isCompletedOrder, isReadyPickupOrder, normalizeOrderStatus, showsPaymentHistory, trackingStepsFor } from "./order-history.ts";

const pickup = normalizeOrderStatus("pickup", "processing");
if (pickup !== "ready_pickup") throw new Error("pickup should be ready to pickup");
if (normalizeOrderStatus("pickup", "completed") !== "picked_up") throw new Error("completed pickup should be picked_up");
if (normalizeOrderStatus("delivery", "dispensed") !== "delivered") throw new Error("dispensed delivery should be delivered");
if (normalizeOrderStatus("pickup", "Picked_up") !== "picked_up") throw new Error("capital Picked_up should match");
if (normalizeOrderStatus("pickup", "Picked Up") !== "picked_up") throw new Error("spaced Picked Up should match");
if (normalizeOrderStatus("delivery", "Delivered") !== "delivered") throw new Error("capital Delivered should match");
if (!isReadyPickupOrder("ready_pickup")) throw new Error("ready pickup helper");
if (!isCompletedOrder("picked_up") || !isCompletedOrder("delivered")) throw new Error("completed helper");
if (isCompletedOrder("ready_pickup")) throw new Error("ready should not be completed");
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
