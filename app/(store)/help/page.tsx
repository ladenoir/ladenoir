import Link from "next/link";
import { HelpFaq } from "./HelpFaq";

export const metadata = {
  title: "Help centre · La De Noir",
  description: "Orders, shipping, returns and repairs.",
};

const TILES = [
  { icon: "◈", title: "Orders", note: "Track, edit or cancel" },
  { icon: "⇄", title: "Returns", note: "30-day free returns" },
  { icon: "✦", title: "Repairs", note: "Free for life" },
  { icon: "◷", title: "Shipping", note: "Free over ₹10,000" },
];

export default function HelpPage() {
  return (
    <>
      <div className="border-b border-gold/20 px-[5vw] pb-[30px] pt-14">
        <div className="mb-3.5 font-mono text-[11px] tracking-[0.2em] text-cream/50">
          HOME / HELP
        </div>
        <h1 className="font-serif text-[44px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[68px] lg:text-[88px]">
          Help centre<span className="text-gold">.</span>
        </h1>
        <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-cream/55">
          Everything on orders, shipping, returns and repairs. Still stuck?{" "}
          <Link href="/contact" className="text-gold hover:underline">
            Contact client care
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-2 border-b border-gold/20 lg:grid-cols-4">
        {TILES.map((t) => (
          <div
            key={t.title}
            className="border-r border-gold/12 px-6 py-10 text-center"
          >
            <div className="mb-3.5 text-[26px] text-gold">{t.icon}</div>
            <div className="mb-1.5 font-serif text-xl font-medium">
              {t.title}
            </div>
            <div className="text-xs leading-snug text-cream/55">{t.note}</div>
          </div>
        ))}
      </div>

      <HelpFaq />
    </>
  );
}
