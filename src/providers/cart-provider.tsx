import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { TOKEN_KEY } from "@/services/api";
import { cartApi } from "@/services/cartApi";
import {
    addCartLine,
    cartCount,
    CART_ICON_SELECTOR,
    MAX_MEDICINE_UNITS,
    CART_STORAGE_KEY,
    qtyInCart,
    removeCartLine,
    removeCartLines,
    roomLeft,
    sanitizeCart,
    setCartQty,
    type CartLine,
    type MedicineId,
} from "@/utils/prescribed-medicine";

type CartContextValue = {
    lines: CartLine[];
    bought: Record<string, number>;
    count: number;
    bump: number;
    remainingFor: (medicineId: MedicineId) => number;
    add: (line: Omit<CartLine, "qty"> & { qty: number }) => number;
    setQty: (medicineId: MedicineId, qty: number) => void;
    remove: (medicineId: MedicineId) => void;
    removeMany: (medicineIds: MedicineId[]) => void;
    clear: () => void;
    flyToCart: (source: HTMLElement, onArrive?: () => void) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const readCart = (): CartLine[] => {
    try {
        const raw = sessionStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const next = sanitizeCart(JSON.parse(raw) as CartLine[]);
        const cleaned = JSON.stringify(next);
        if (raw !== cleaned) {
            sessionStorage.setItem(CART_STORAGE_KEY, cleaned);
        }
        return next;
    } catch {
        return [];
    }
};

const visibleCartIcon = () =>
    [...document.querySelectorAll<HTMLElement>(CART_ICON_SELECTOR)].find((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
    });

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const remoteCart = () => typeof window !== "undefined" && Boolean(localStorage.getItem(TOKEN_KEY));

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const [lines, setLines] = useState<CartLine[]>(() => (typeof window === "undefined" || remoteCart() ? [] : readCart()));
    const [bought, setBought] = useState<Record<string, number>>({});
    const [bump, setBump] = useState(0);
    const linesRef = useRef(lines);
    const boughtRef = useRef(bought);
    const modeRef = useRef<"guest" | "account" | null>(null);
    linesRef.current = lines;
    boughtRef.current = bought;

    const monthCap = (medicineId: MedicineId) => Math.max(0, MAX_MEDICINE_UNITS - (boughtRef.current[medicineId] ?? 0));

    const applyRemote = (next: { lines: CartLine[]; bought: Record<string, number> }) => {
        const capped = sanitizeCart(next.lines.map((line) => ({ ...line, qty: Math.min(line.qty, Math.max(0, MAX_MEDICINE_UNITS - (next.bought[line.medicineId] ?? 0))) })));
        boughtRef.current = next.bought;
        linesRef.current = capped;
        setBought(next.bought);
        setLines(capped);
    };

    useEffect(() => {
        let cancel = false;
        const account = remoteCart();
        if (account && modeRef.current !== "account") {
            setLines([]);
        }
        modeRef.current = account ? "account" : "guest";
        if (!account) {
            boughtRef.current = {};
            setBought({});
            setLines(readCart());
            return;
        }
        cartApi
            .list()
            .then((next) => {
                if (!cancel) {
                    applyRemote(next);
                }
            })
            .catch(() => {
                if (!cancel) {
                    setLines([]);
                }
            });
        return () => {
            cancel = true;
        };
    }, [profile?.id]);

    const keep = useCallback((next: CartLine[]) => {
        linesRef.current = next;
        setLines(next);
        if (!remoteCart()) {
            sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
        }
    }, []);

    const pushQty = useCallback((medicineId: MedicineId, qty: number) => {
        if (!remoteCart()) {
            return;
        }
        cartApi
            .setQty(medicineId, qty)
            .then(applyRemote)
            .catch(() => cartApi.list().then(applyRemote).catch(() => undefined));
    }, []);

    const add = useCallback(
        (line: Omit<CartLine, "qty"> & { qty: number }) => {
            const result = addCartLine(remoteCart() ? linesRef.current : readCart(), line, monthCap(line.medicineId));
            keep(result.lines);
            if (result.added > 0) {
                setBump((n) => n + 1);
                const qty = result.lines.find((item) => item.medicineId === line.medicineId)?.qty ?? 0;
                pushQty(line.medicineId, qty);
            }
            return result.added;
        },
        [keep, pushQty],
    );

    const clear = useCallback(() => {
        keep([]);
        if (remoteCart()) {
            cartApi.clear().then(applyRemote).catch(() => undefined);
        }
    }, [keep]);

    const setQty = useCallback(
        (medicineId: MedicineId, qty: number) => {
            const next = setCartQty(remoteCart() ? linesRef.current : readCart(), medicineId, qty, monthCap(medicineId));
            keep(next);
            pushQty(medicineId, next.find((item) => item.medicineId === medicineId)?.qty ?? qty);
        },
        [keep, pushQty],
    );

    const remove = useCallback(
        (medicineId: MedicineId) => {
            keep(removeCartLine(remoteCart() ? linesRef.current : readCart(), medicineId));
            pushQty(medicineId, 0);
        },
        [keep, pushQty],
    );

    const removeMany = useCallback(
        (medicineIds: MedicineId[]) => {
            keep(removeCartLines(remoteCart() ? linesRef.current : readCart(), medicineIds));
            if (remoteCart() && medicineIds.length > 0) {
                cartApi
                    .removeMany(medicineIds)
                    .then(applyRemote)
                    .catch(() => cartApi.list().then(applyRemote).catch(() => undefined));
            }
        },
        [keep],
    );

    const flyToCart = useCallback((source: HTMLElement, onArrive?: () => void) => {
        const cart = visibleCartIcon();
        if (!cart || prefersReducedMotion()) {
            onArrive?.();
            return;
        }

        const from = source.getBoundingClientRect();
        const to = cart.getBoundingClientRect();
        const clone = source.cloneNode(true) as HTMLElement;
        clone.removeAttribute("id");
        clone.setAttribute("aria-hidden", "true");
        clone.style.cssText = [
            "position:fixed",
            `left:${from.left}px`,
            `top:${from.top}px`,
            `width:${from.width}px`,
            `height:${from.height}px`,
            "margin:0",
            "z-index:80",
            "pointer-events:none",
            "border-radius:1.25rem",
            "overflow:hidden",
            "box-shadow:0 12px 32px rgb(11 31 56 / 0.28)",
        ].join(";");
        document.body.appendChild(clone);

        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const animation = clone.animate(
            [
                { transform: "translate(0,0) scale(1)", opacity: 1 },
                { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 90}px) scale(0.55)`, opacity: 0.95, offset: 0.55 },
                { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.25 },
            ],
            { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
        );

        animation.finished.then(() => {
            clone.remove();
            onArrive?.();
        }).catch(() => {
            clone.remove();
            onArrive?.();
        });
    }, []);

    const value = useMemo<CartContextValue>(
        () => ({
            lines,
            bought,
            count: cartCount(lines),
            bump,
            remainingFor: (medicineId) => roomLeft(qtyInCart(lines, medicineId), monthCap(medicineId)),
            add,
            setQty,
            remove,
            removeMany,
            clear,
            flyToCart,
        }),
        [add, bought, bump, clear, flyToCart, lines, remove, removeMany, setQty],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
};
