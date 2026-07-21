import { ViewTransition } from "react";

export default function ProductLoading() {
  return (
    <ViewTransition exit="slide-down">
      <div className="grid items-stretch lg:grid-cols-[1.35fr_1fr]">
        <div className="grid grid-cols-[64px_1fr] gap-4 px-[5vw] py-7 lg:pr-[2vw]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1.1] animate-pulse border border-gold/20 bg-noir-panel"
              />
            ))}
          </div>
          <div className="aspect-[4/5] animate-pulse border border-gold/15 bg-noir-panel" />
        </div>
        <div className="flex flex-col justify-center gap-4 border-t border-gold/15 px-[5vw] py-10 lg:border-l lg:border-t-0 lg:pl-[3vw]">
          <div className="h-12 w-3/4 animate-pulse bg-noir-panel" />
          <div className="h-6 w-1/3 animate-pulse bg-noir-panel" />
          <div className="h-24 w-full animate-pulse bg-noir-panel" />
          <div className="h-14 w-full animate-pulse bg-noir-panel" />
        </div>
      </div>
    </ViewTransition>
  );
}
