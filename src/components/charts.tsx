import Link from "next/link";
import { formatMoney } from "@/lib/money";

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const sweep = Math.max(end - start, 0.01);
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, start + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y}`;
}

export function DonutChart({
  slices,
  size = 196,
  thickness = 26,
  centerLabel,
  centerValue,
}: {
  slices: ChartSlice[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thickness / 2;
  let cursor = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E7F4F3" strokeWidth={thickness} />
        {total > 0
          ? slices
              .filter((slice) => slice.value > 0)
              .map((slice) => {
                const sweep = (slice.value / total) * 360;
                const start = cursor;
                cursor += sweep;
                return (
                  <path
                    key={slice.label}
                    d={arcPath(cx, cy, r, start, start + sweep)}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={thickness}
                    strokeLinecap="butt"
                  />
                );
              })
          : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {centerLabel}
          </p>
          <p className="text-lg font-semibold tracking-tight">{centerValue}</p>
        </div>
      </div>
    </div>
  );
}

export function RingMeter({
  percent,
  color,
  track = "#E7F4F3",
  label,
  value,
  hint,
}: {
  percent: number;
  color: string;
  track?: string;
  label: string;
  value: string;
  hint: string;
}) {
  const size = 108;
  const thickness = 10;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(percent, 0), 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - clamped)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-sm font-semibold">{Math.round(clamped * 100)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export function DualLineChart({
  points,
}: {
  points: { label: string; billed: number; collected: number }[];
}) {
  const width = 360;
  const height = 168;
  const pad = { l: 12, r: 12, t: 18, b: 28 };
  const max = Math.max(1, ...points.flatMap((point) => [point.billed, point.collected]));
  const n = Math.max(points.length, 1);
  const xAt = (index: number) =>
    n === 1 ? (width + pad.l - pad.r) / 2 : pad.l + (index / (n - 1)) * (width - pad.l - pad.r);
  const yAt = (value: number) => pad.t + (1 - value / max) * (height - pad.t - pad.b);
  const toPoints = (key: "billed" | "collected") =>
    points.map((point, index) => `${xAt(index)},${yAt(point[key])}`).join(" ");
  const area = points.length
    ? `M ${xAt(0)},${yAt(0)} L ${points.map((point, index) => `${xAt(index)},${yAt(point.collected)}`).join(" ")} L ${xAt(n - 1)},${yAt(0)} Z`
    : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      <defs>
        <linearGradient id="collectFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2EC4B6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={pad.l}
          x2={width - pad.r}
          y1={yAt(max * frac)}
          y2={yAt(max * frac)}
          stroke="#D7EBE9"
          strokeDasharray="4 6"
        />
      ))}
      {area ? <path d={area} fill="url(#collectFill)" /> : null}
      <polyline fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinejoin="round" points={toPoints("billed")} />
      <polyline fill="none" stroke="#2EC4B6" strokeWidth="3" strokeLinejoin="round" points={toPoints("collected")} />
      {points.map((point, index) => (
        <g key={point.label}>
          <circle cx={xAt(index)} cy={yAt(point.billed)} r="3.5" fill="#6366F1" />
          <circle cx={xAt(index)} cy={yAt(point.collected)} r="4" fill="#2EC4B6" stroke="white" strokeWidth="1.5" />
          <text x={xAt(index)} y={height - 8} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HorizontalBars({
  rows,
}: {
  rows: { id: string; name: string; value: number; href: string; color?: string }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No open balances.</p>;
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <Link key={row.id} href={row.href} className="grid gap-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{row.name}</span>
            <span className="shrink-0 font-semibold">{formatMoney(row.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(8, (row.value / max) * 100)}%`,
                background: row.color ?? "linear-gradient(90deg,#2EC4B6,#38BDF8)",
              }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AgingCapsule({
  items,
}: {
  items: { key: string; label: string; value: number; color: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {total === 0 ? (
          <div className="w-full bg-muted" />
        ) : (
          items
            .filter((item) => item.value > 0)
            .map((item) => (
              <div
                key={item.key}
                className="h-full"
                style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
              />
            ))
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-2 rounded-xl bg-muted/60 px-2.5 py-2">
            <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="truncate text-sm font-semibold">{formatMoney(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ slices }: { slices: ChartSlice[] }) {
  return (
    <div className="grid gap-2">
      {slices.map((slice) => (
        <div key={slice.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
            {slice.label}
          </span>
          <span className="font-semibold">{formatMoney(slice.value)}</span>
        </div>
      ))}
    </div>
  );
}
