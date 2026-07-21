"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WishItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

type WishState = {
  items: WishItem[];
  toggle: (item: WishItem) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  count: number;
  ready: boolean;
};

const WishlistContext = createContext<WishState | null>(null);
const STORAGE_KEY = "ldn.wishlist.v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const value = useMemo<WishState>(() => {
    const toggle = (item: WishItem) =>
      setItems((prev) =>
        prev.some((i) => i.slug === item.slug)
          ? prev.filter((i) => i.slug !== item.slug)
          : [...prev, item]
      );
    const remove = (slug: string) =>
      setItems((prev) => prev.filter((i) => i.slug !== slug));
    const has = (slug: string) => items.some((i) => i.slug === slug);
    return { items, toggle, remove, has, count: items.length, ready };
  }, [items, ready]);

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
