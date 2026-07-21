"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
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

// read the stored cart once, synchronously — used as the lazy initial
// state so the client's first render already has the hydrated value
function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// "has the client mounted yet" flag via useSyncExternalStore: server (and
// the client's initial hydration pass) render `false`, then React
// re-syncs to the real client snapshot right after hydration completes —
// no manual setState-in-effect required.
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const EMPTY_ITEMS: CartItem[] = [];

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const ready = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot
  );

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  // Expose an empty cart until `ready` flips on the client. This keeps the
  // client's hydration-matching render identical to the server's (both see
  // an empty cart) even though `items` itself may already hold the
  // localStorage value — consumers that don't check `ready` themselves
  // (e.g. anything reading `items`/`count` directly) still avoid a
  // hydration mismatch.
  const displayItems = useMemo(
    () => (ready ? items : EMPTY_ITEMS),
    [items, ready]
  );

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
    const count = displayItems.reduce((n, i) => n + i.qty, 0);
    const subtotal = displayItems.reduce((n, i) => n + i.price * i.qty, 0);
    return { items: displayItems, add, remove, setQty, clear, count, subtotal, ready };
  }, [displayItems, ready]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
