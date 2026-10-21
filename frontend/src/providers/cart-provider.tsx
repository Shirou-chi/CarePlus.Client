import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
    addCartLine,
    cartCount,
    CART_ICON_SELECTOR,
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [lines, setLines] = useState<CartLine[]>(() => (typeof window === "undefined" ? [] : readCart()));
    const [bump, setBump] = useState(0);

    const persist = useCallback((next: CartLine[]) => {
        setLines(next);
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    }, []);

    const add = useCallback(
        (line: Omit<CartLine, "qty"> & { qty: number }) => {
            const result = addCartLine(readCart(), line);
            persist(result.lines);
            if (result.added > 0) {
                setBump((n) => n + 1);
            }
            return result.added;
        },
        [persist],
    );

    const clear = useCallback(() => {
        persist([]);
    }, [persist]);

    const setQty = useCallback(
        (medicineId: MedicineId, qty: number) => {
            persist(setCartQty(readCart(), medicineId, qty));
        },
        [persist],
    );

    const remove = useCallback(
        (medicineId: MedicineId) => {
            persist(removeCartLine(readCart(), medicineId));
        },
        [persist],
    );

    const removeMany = useCallback(
        (medicineIds: MedicineId[]) => {
            persist(removeCartLines(readCart(), medicineIds));
        },
        [persist],
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
            count: cartCount(lines),
            bump,
            remainingFor: (medicineId) => roomLeft(qtyInCart(lines, medicineId)),
            add,
            setQty,
            remove,
            removeMany,
            clear,
            flyToCart,
        }),
        [add, bump, clear, flyToCart, lines, remove, removeMany, setQty],
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
