import { ViewTransition } from "react";

export default function ShopLoading() {
  return (
    <ViewTransition exit="slide-down">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/12 px-[5vw] py-[22px]">
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[38px] w-24 animate-pulse border border-gold/20 bg-noir-panel"
              />
            ))}
          </div>
        </div>
        <div className="px-[5vw] pb-20 pt-10">
          <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="mb-3.5 aspect-[4/5] animate-pulse border border-gold/12 bg-noir-panel" />
                <div className="h-4 w-2/3 animate-pulse bg-noir-panel" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
