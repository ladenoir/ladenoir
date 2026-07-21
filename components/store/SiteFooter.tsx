import Link from "next/link";

const COLUMNS = [
  {
    heading: "SHOP",
    links: [
      { label: "Outerwear", href: "/shop?c=Outerwear" },
      { label: "Knitwear", href: "/shop?c=Knitwear" },
      { label: "Bottoms", href: "/shop?c=Bottoms" },
      { label: "Accessories", href: "/shop?c=Accessories" },
    ],
  },
  {
    heading: "HOUSE",
    links: [
      { label: "Our story", href: "/maison" },
      { label: "Help", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Account", href: "/account" },
    ],
  },
  {
    heading: "FOLLOW",
    links: [
      { label: "Instagram", href: "#" },
      { label: "TikTok", href: "#" },
      { label: "Newsletter", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer
      className="border-t border-gold/20 bg-noir-deep px-[5vw] pb-[30px] pt-14 text-parchment"
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="mb-10 flex flex-wrap justify-between gap-10">
        <div className="max-w-[320px]">
          <div className="mb-3.5 font-serif text-[26px] font-semibold tracking-[0.22em] text-gold">
            LA DE NOIR
          </div>
          <p className="text-[13px] leading-relaxed text-parchment/55">
            Menswear for the after-hours. Made in limited runs.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-14 gap-y-8 font-mono text-xs leading-[2.1] text-parchment/60">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="mb-2 tracking-[0.1em] text-gold">{col.heading}</div>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="block transition-colors hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-3 border-t border-parchment/10 pt-5 font-mono text-[10.5px] tracking-[0.06em] text-parchment/40">
        <span>© 2026 LA DE NOIR</span>
        <span>TERMS · PRIVACY · SHIPPING</span>
      </div>
    </footer>
  );
}
