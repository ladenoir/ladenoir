import { CartProvider } from "@/components/store/cart-context";
import { WishlistProvider } from "@/components/store/wishlist-context";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Marquee } from "@/components/store/Marquee";
import { SiteHeader } from "@/components/store/SiteHeader";
import { SiteFooter } from "@/components/store/SiteFooter";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <MotionProvider>
          <div className="flex min-h-screen flex-col bg-noir text-cream">
            <Marquee />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </MotionProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
