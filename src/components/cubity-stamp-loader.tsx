"use client";

import { cn } from "@/lib/utils";

export function CubityStampLoader({
  variant = "page",
  label = "Plotting the books",
}: {
  variant?: "page" | "overlay";
  label?: string;
}) {
  return (
    <div
      className={cn(
        "cubity-stamp grid place-items-center",
        variant === "overlay"
          ? "fixed inset-0 z-[60] bg-[#eef6f6]/[0.97] backdrop-blur-[3px]"
          : "min-h-[60vh] w-full",
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {variant === "overlay" ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #128C86 1px, transparent 1px), linear-gradient(to bottom, #128C86 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle at center, black 18%, transparent 72%)",
          }}
        />
      ) : null}

      <div className="relative grid size-[13.5rem] place-items-center">
        <span className="cubity-stamp-pulse absolute inset-3 rounded-full border border-[#128C86]/35" />
        <span
          className="cubity-stamp-pulse absolute inset-0 rounded-full border border-[#128C86]/20"
          style={{ animationDelay: "0.55s" }}
        />

        <svg
          viewBox="0 0 200 200"
          className="cubity-stamp-orbit absolute inset-0 size-full"
          aria-hidden
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="#128C86"
            strokeWidth="1.25"
            strokeDasharray="2 8"
            opacity="0.55"
          />
          <polygon points="100,4 104,14 96,14" fill="#128C86" />
          <text
            x="100"
            y="28"
            textAnchor="middle"
            fill="#0F766E"
            fontSize="9"
            fontWeight="700"
          >
            N
          </text>
        </svg>
        <svg
          viewBox="0 0 200 200"
          className="cubity-stamp-orbit-rev absolute inset-3 size-[calc(100%-1.5rem)]"
          aria-hidden
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#0F766E"
            strokeWidth="0.75"
            strokeDasharray="18 10 3 10"
            opacity="0.4"
          />
        </svg>

        <span
          className="cubity-stamp-cube absolute top-3 left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-[#128C86]"
          style={{ animationDelay: "0.05s" }}
        />
        <span
          className="cubity-stamp-cube absolute right-3 top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-[#2EC4B6]"
          style={{ animationDelay: "0.18s" }}
        />
        <span
          className="cubity-stamp-cube absolute bottom-3 left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-[#128C86]"
          style={{ animationDelay: "0.3s" }}
        />
        <span
          className="cubity-stamp-cube absolute top-1/2 left-3 size-2.5 -translate-y-1/2 rotate-45 bg-[#2EC4B6]"
          style={{ animationDelay: "0.42s" }}
        />

        <div className="cubity-stamp-seal relative size-[7.25rem] overflow-hidden rounded-full bg-white shadow-[0_10px_30px_rgba(18,140,134,0.22)] ring-1 ring-[#128C86]/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cubity-logo.jpg" alt="" className="size-full object-cover" />
          <span className="cubity-stamp-scan pointer-events-none absolute inset-x-0 h-px bg-[#2EC4B6] shadow-[0_0_12px_2px_rgba(46,196,182,0.85)]" />
        </div>
      </div>
      <p className="cubity-stamp-word relative mt-5 text-[11px] font-semibold tracking-[0.28em] text-[#0F766E] uppercase">
        {label}
      </p>
    </div>
  );
}
