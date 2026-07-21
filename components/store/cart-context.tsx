"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number; // whole rupees
  image: string;
  size: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "ldn.cart.v1";
const keyOf = (slug: string, size: string) => `${slug}::${size}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const value = useMemo<CartState>(() => {
    const add: CartState["add"] = (item, qty = 1) => {
      setItems((prev) => {
        const k = keyOf(item.slug, item.size);
        const existing = prev.find((i) => keyOf(i.slug, i.size) === k);
        if (existing) {
          return prev.map((i) =>
            keyOf(i.slug, i.size) === k ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { ...item, qty }];
      });
    };
    const remove: CartState["remove"] = (slug, size) =>
      setItems((prev) =>
        prev.filter((i) => keyOf(i.slug, i.size) !== keyOf(slug, size))
      );
    const setQty: CartState["setQty"] = (slug, size, qty) =>
      setItems((prev) =>
        qty <= 0
          ? prev.filter((i) => keyOf(i.slug, i.size) !== keyOf(slug, size))
          : prev.map((i) =>
              keyOf(i.slug, i.size) === keyOf(slug, size) ? { ...i, qty } : i
            )
      );
    const clear = () => setItems([]);
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    return { items, add, remove, setQty, clear, count, subtotal, ready };
  }, [items, ready]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
