import { peekItemWidth } from "./service-nav-layout.ts";

const wide = peekItemWidth(1400, 88, 32, 10);
const medium = peekItemWidth(760, 80, 28, 10);
const phone = peekItemWidth(358, 80, 28, 10);

if (wide !== null) throw new Error("wide row should fit");
if (medium === null || medium < 64) throw new Error("medium row should peek");
if (phone === null) throw new Error("phone row should peek");

const slots = Math.floor((760 + 28) / (80 + 28));
const expected = (760 - slots * 28) / (slots + 0.5);
if (Math.abs(medium - expected) > 0.01) throw new Error("peek width mismatch");

console.log("service nav layout ok");
