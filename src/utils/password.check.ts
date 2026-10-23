import { passwordGaps, passwordIsValid, passwordMeter } from "./password.ts";

const weak = passwordMeter("12345aB@");
const medium = passwordMeter("k9Xm!pQa");
const strong = passwordMeter("Qm7!vL2#pX9w");
const long = passwordMeter("12345AB@!@#!@#!@#@!#@!#@!#@!#@!@!QWEWQweqwewqeasesasa12312555");

const checks = [
    passwordMeter("") === null,
    passwordMeter("abc")?.level === "weak",
    weak?.level === "weak" && (weak?.score ?? 100) < 50,
    passwordIsValid("12345aB@"),
    medium?.level === "medium",
    strong?.level === "strong",
    long?.level === "strong" && (long?.score ?? 0) >= 90,
    passwordMeter("Abcdefg1!")?.level !== "strong",
    !passwordIsValid("abcdefgh"),
    !passwordIsValid("Abcdefg1"),
    passwordIsValid("Abcdefg1!"),
    !passwordIsValid("Ab1!"),
    passwordGaps("abc").join(",") === "short,upper,number,symbol",
    passwordGaps("Abcdefg1!").length === 0,
];

if (checks.some((ok) => !ok)) {
    throw new Error(`password check failed ${JSON.stringify({ weak, medium, strong, long })}`);
}

console.log("password ok");
