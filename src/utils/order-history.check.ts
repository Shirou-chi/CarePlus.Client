import { isCompletedOrder, isReadyPickupOrder, normalizeOrderStatus, showsPaymentHistory, trackingLabels, trackingStepsFor } from "./order-history.ts";

if (normalizeOrderStatus("pickup", "awaiting_payment") !== "awaiting_payment") throw new Error("awaiting payment should stay");
if (normalizeOrderStatus("delivery", "paid") !== "paid") throw new Error("paid should stay");
if (normalizeOrderStatus("pickup", "processing") !== "processing") throw new Error("processing should not jump to ready");
if (normalizeOrderStatus("pickup", "completed") !== "picked_up") throw new Error("completed pickup should be picked_up");
if (normalizeOrderStatus("delivery", "dispensed") !== "delivered") throw new Error("dispensed delivery should be delivered");
if (normalizeOrderStatus("pickup", "Picked_up") !== "picked_up") throw new Error("capital Picked_up should match");
if (normalizeOrderStatus("pickup", "Picked Up") !== "picked_up") throw new Error("spaced Picked Up should match");
if (normalizeOrderStatus("delivery", "Delivered") !== "delivered") throw new Error("capital Delivered should match");
if (!isReadyPickupOrder("ready_pickup")) throw new Error("ready pickup helper");
if (!isCompletedOrder("picked_up") || !isCompletedOrder("delivered")) throw new Error("completed helper");
if (isCompletedOrder("ready_pickup") || isCompletedOrder("paid")) throw new Error("open statuses should not be completed");
const labels = trackingLabels("en");
const paidSteps = trackingStepsFor("delivery", "paid", labels);
if (paidSteps.join("|") !== "Paid") throw new Error(paidSteps.join("|"));
const sent = trackingStepsFor("delivery", "shipped", labels);
if (sent.join("|") !== "Paid|Preparing|Sent out") throw new Error(sent.join("|"));
const collected = trackingStepsFor("pickup", "picked_up", labels);
if (collected.join("|") !== "Paid|Preparing|Ready to pickup|Picked up") throw new Error(collected.join("|"));
if (showsPaymentHistory({ payment: "Cash on delivery", status: "ready_pickup", fulfilment: "pickup" })) throw new Error("pickup cod should hide payment until collected");
if (!showsPaymentHistory({ payment: "Cash on delivery", status: "picked_up", fulfilment: "pickup" })) throw new Error("picked up cod should show payment");
if (showsPaymentHistory({ payment: "Cash on delivery", status: "paid", fulfilment: "delivery" })) throw new Error("paid delivery cod should hide payment until delivered");
if (!showsPaymentHistory({ payment: "Cash on delivery", status: "delivered", fulfilment: "delivery" })) throw new Error("delivered cod should show payment");
if (!showsPaymentHistory({ payment: "Mastercard", status: "paid", fulfilment: "pickup" })) throw new Error("card pickup should show payment");

console.log("order history ok");
