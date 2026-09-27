"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CubityStampLoader } from "@/components/cubity-stamp-loader";

const MIN_STAMP_MS = 200;

/*
 * Only a safety net, for a navigation that never resolves. It used to be 8s,
 * which a cold function on a slow phone connection can genuinely exceed — and
 * hiding the loader mid-load leaves the old screen looking stuck.
 */
const FAILSAFE_MS = 20_000;

function isAppNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("sms:")) {
    return false;
  }
  if (href.includes("/statement") || href.includes("/reports/outstanding") || href.endsWith("/pdf")) return false;
  if (/^https?:/i.test(href) && !href.startsWith(window.location.origin)) return false;
  const next = new URL(href, window.location.href);
  return `${next.pathname}${next.search}` !== `${window.location.pathname}${window.location.search}`;
}

export function RouteStamp() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, setPending] = useState(false);
  const shownAt = useRef(0);
  const hideTimer = useRef<number | null>(null);
  const failsafe = useRef<number | null>(null);

  useEffect(() => {
    const started = shownAt.current;
    if (!started) return;

    const remain = Math.max(0, MIN_STAMP_MS - (Date.now() - started));
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setPending(false);
      shownAt.current = 0;
    }, remain);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isAppNavigation(anchor)) return;
      shownAt.current = Date.now();
      setPending(true);
      if (failsafe.current) window.clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => {
        setPending(false);
        shownAt.current = 0;
      }, FAILSAFE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (failsafe.current) window.clearTimeout(failsafe.current);
    };
  }, []);

  if (!pending) return null;
  return <CubityStampLoader variant="overlay" />;
}
