const hasLower = /[a-z]/;
const hasUpper = /[A-Z]/;
const hasNumber = /\d/;
const hasSymbol = /[^A-Za-z0-9]/;

type Meter = { check: (value: string) => { score: number; guessesLog10: number } };
let meter: Meter | null = null;
let loading: Promise<void> | null = null;

// The zxcvbn dictionaries are ~1.6 MB, so they load on first use instead of with every page that validates passwords.
export const loadPasswordMeter = () =>
    (loading ??= Promise.all([import("@zxcvbn-ts/core"), import("@zxcvbn-ts/language-common"), import("@zxcvbn-ts/language-en")]).then(
        ([core, common, en]) => {
            meter = new core.ZxcvbnFactory({
                graphs: common.adjacencyGraphs,
                dictionary: { ...common.dictionary, ...en.dictionary },
            });
        },
    ));

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
    if (!value || !meter) {
        return null;
    }
    const result = meter.check(value);
    const level = result.score <= 1 ? "weak" : result.score === 2 ? "medium" : "strong";
    const score = Math.max(8, Math.min(100, Math.round((result.guessesLog10 / 12) * 100)));
    return { level, score };
};
