const AVATAR = ["#0F766E", "#128C86", "#2563EB", "#7C3AED", "#B45309", "#BE123C"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function InvoiceAvatar({ name, index }: { name: string; index: number }) {
  return (
    <span
      aria-hidden
      className="grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold tracking-wide text-white"
      style={{ backgroundColor: AVATAR[index % AVATAR.length] }}
    >
      {initials(name)}
    </span>
  );
}
