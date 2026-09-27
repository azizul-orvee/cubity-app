"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CubityStampLoader } from "@/components/cubity-stamp-loader";

/*
 * Every route now has a loading.tsx, so Next commits a navigation immediately
 * and that screen's own skeleton takes over. This overlay is therefore only for
 * the gap before the commit: it waits this long before appearing, so a normal
 * navigation never flashes a full-screen stamp on the way to the skeleton.
 */
const SHOW_DELAY_MS = 180;

/** Once it is up, keep it up long enough to read as deliberate. */
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
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const failsafe = useRef<number | null>(null);

  // The route changed, so whatever was pending is done with.
  useEffect(() => {
    if (showTimer.current) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (failsafe.current) {
      window.clearTimeout(failsafe.current);
      failsafe.current = null;
    }

    const started = shownAt.current;
    // Never shown, because the screen arrived inside the delay. Nothing to hide.
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

      if (showTimer.current) window.clearTimeout(showTimer.current);
      showTimer.current = window.setTimeout(() => {
        showTimer.current = null;
        shownAt.current = Date.now();
        setPending(true);
      }, SHOW_DELAY_MS);

      if (failsafe.current) window.clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => {
        setPending(false);
        shownAt.current = 0;
      }, FAILSAFE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (showTimer.current) window.clearTimeout(showTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (failsafe.current) window.clearTimeout(failsafe.current);
    };
  }, []);

  if (!pending) return null;
  return <CubityStampLoader variant="overlay" />;
}
