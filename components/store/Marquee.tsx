const DEFAULT_ITEMS = [
  "★ New drop live",
  "Maison du Panthère",
  "Free shipping ₹10,000+",
];

export function Marquee({
  items = DEFAULT_ITEMS,
  className = "",
}: {
  items?: string[];
  className?: string;
}) {
  // duplicate the sequence so the -50% translate loops seamlessly
  const loop = [...items, ...items, ...items];
  return (
    <div
      className={`overflow-hidden bg-gold py-2.5 text-noir-deep ${className}`}
    >
      <div className="flex w-max animate-[ldn-marquee_22s_linear_infinite] font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
        <span className="flex gap-[34px] whitespace-nowrap pr-[34px]">
          {loop.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
