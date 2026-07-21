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

// read the stored wishlist once, synchronously — used as the lazy initial
// state so the client's first render already has the hydrated value
function readStoredWishlist(): WishItem[] {
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
const EMPTY_ITEMS: WishItem[] = [];

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishItem[]>(readStoredWishlist);
  const ready = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  // Expose an empty wishlist until `ready` flips on the client. This keeps
  // the client's hydration-matching render identical to the server's (both
  // see an empty wishlist) even though `items` itself may already hold the
  // localStorage value — consumers that don't check `ready` themselves
  // (e.g. the wishlist toggle button, which reads `has()` directly) still
  // avoid a hydration mismatch.
  const displayItems = useMemo(
    () => (ready ? items : EMPTY_ITEMS),
    [items, ready]
  );

  const value = useMemo<WishState>(() => {
    const toggle = (item: WishItem) =>
      setItems((prev) =>
        prev.some((i) => i.slug === item.slug)
          ? prev.filter((i) => i.slug !== item.slug)
          : [...prev, item]
      );
    const remove = (slug: string) =>
      setItems((prev) => prev.filter((i) => i.slug !== slug));
    const has = (slug: string) => displayItems.some((i) => i.slug === slug);
    return { items: displayItems, toggle, remove, has, count: displayItems.length, ready };
  }, [displayItems, ready]);

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
