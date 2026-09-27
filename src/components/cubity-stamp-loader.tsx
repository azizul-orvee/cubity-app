"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MOTIONS = ["paint", "bloom", "rise"] as const;
type Motion = (typeof MOTIONS)[number];

/** r = 46 in a 100-box, so the track is 2πr ≈ 289 units around. */
const ARC = 289;

export function CubityStampLoader({
  variant = "page",
  label = "Cubity",
}: {
  variant?: "page" | "overlay";
  label?: string;
}) {
  const [motion, setMotion] = useState<Motion | null>(null);

  useEffect(() => {
    // The motion is picked after hydration on purpose: choosing it while
    // rendering would give the server and the phone different animations.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="relative grid size-32 place-items-center">
          {/*
            The stamp reveals itself once, then keeps breathing, while this arc
            circles for as long as the loader is on screen. A screen that takes
            a while therefore still looks like it is working, instead of
            freezing on a finished stamp.
          */}
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className={cn("absolute -inset-3 size-auto", motion ? "cubity-orbit" : "opacity-0")}
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="#128C86" strokeOpacity={0.14} strokeWidth={2.5} />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#128C86"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={`${ARC * 0.24} ${ARC}`}
            />
          </svg>

          <div className={cn("size-32", motion ? "cubity-breathe" : null)}>
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
          </div>
        </div>
        <p
          className={cn(
            "mt-6 text-[11px] font-semibold tracking-[0.28em] text-[#0F766E] uppercase",
            motion ? "cubity-logo-caption" : "opacity-0",
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
