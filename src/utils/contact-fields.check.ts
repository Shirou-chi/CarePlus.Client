import { isValidIdentityCard } from "./identity-card.ts";
import { composePhone } from "./phone.ts";

const checks = [
    isValidIdentityCard("990101-14-5678"),
    isValidIdentityCard("990101145678"),
    !isValidIdentityCard("990101-14-567"),
    composePhone("0123451231") === "+60123451231",
    composePhone("012-3451231") === "+60123451231",
    composePhone("123451231") === "+60123451231",
    composePhone("12-3451231") === "+60123451231",
    composePhone("123") === undefined,
    composePhone("1312312321") === undefined,
    composePhone("0131231232") === "+60131231232",
    composePhone("01123456789") === "+601123456789",
];

if (checks.some((ok) => !ok)) {
    throw new Error("contact fields check failed");
}

console.log("contact fields ok");
