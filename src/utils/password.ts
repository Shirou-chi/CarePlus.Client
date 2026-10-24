import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { dictionary as englishDictionary } from "@zxcvbn-ts/language-en";

const hasLower = /[a-z]/;
const hasUpper = /[A-Z]/;
const hasNumber = /\d/;
const hasSymbol = /[^A-Za-z0-9]/;

const meter = new ZxcvbnFactory({
    graphs: adjacencyGraphs,
    dictionary: {
        ...commonDictionary,
        ...englishDictionary,
    },
});

export const passwordGaps = (value: string) => {
    const gaps: Array<"short" | "long" | "lower" | "upper" | "number" | "symbol"> = [];
    if (value.length < 8) gaps.push("short");
    if (value.length > 72) gaps.push("long");
    if (!hasLower.test(value)) gaps.push("lower");
    if (!hasUpper.test(value)) gaps.push("upper");
    if (!hasNumber.test(value)) gaps.push("number");
    if (!hasSymbol.test(value)) gaps.push("symbol");
    return gaps;
};

export const passwordIsValid = (value: string) => passwordGaps(value).length === 0;

export const passwordMeter = (value: string): { level: "weak" | "medium" | "strong"; score: number } | null => {
    if (!value) {
        return null;
    }
    const result = meter.check(value);
    const level = result.score <= 1 ? "weak" : result.score === 2 ? "medium" : "strong";
    const score = Math.max(8, Math.min(100, Math.round((result.guessesLog10 / 12) * 100)));
    return { level, score };
};
