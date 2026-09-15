"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MOTIONS = ["paint", "bloom", "rise"] as const;
type Motion = (typeof MOTIONS)[number];

export function CubityStampLoader({
  variant = "page",
  label = "Cubity",
}: {
  variant?: "page" | "overlay";
  label?: string;
}) {
  const [motion, setMotion] = useState<Motion | null>(null);

  useEffect(() => {
    setMotion(MOTIONS[Math.floor(Math.random() * MOTIONS.length)]);
  }, []);

  return (
    <div
      className={cn(
        "grid place-items-center",
        variant === "overlay" ? "fixed inset-0 z-[60] bg-[#eef6f6]" : "min-h-[60vh] w-full",
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="grid place-items-center">
        <div
          className={cn(
            "size-32 overflow-hidden rounded-full",
            motion === "paint" && "cubity-logo-paint",
            motion === "bloom" && "cubity-logo-bloom",
            motion === "rise" && "cubity-logo-rise",
            !motion && "opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cubity-logo.jpg" alt="" className="size-full object-cover" />
        </div>
        <p
          className={cn(
            "mt-4 text-[11px] font-semibold tracking-[0.28em] text-[#0F766E] uppercase",
            motion ? "cubity-logo-caption" : "opacity-0",
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
