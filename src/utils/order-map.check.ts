import { mapQuery } from "./order-map.ts";

const labeled = mapQuery("home · 10, Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur");
const plain = mapQuery("Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur");
const checks = [
    labeled === "10, Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur",
    plain === "Jalan Genting Kelang, Setapak, 53300 Kuala Lumpur",
];

if (checks.every(Boolean)) {
    console.log("order map ok");
} else {
    console.error(labeled, plain, checks);
    process.exit(1);
}
