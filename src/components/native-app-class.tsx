"use client";

import { useEffect } from "react";

export function NativeAppClass() {
  useEffect(() => {
    if (navigator.userAgent.includes("CubityApp")) {
      document.documentElement.classList.add("cubity-app");
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncKeyboard = () => {
      const open = window.innerHeight - viewport.height > 100;
      document.documentElement.classList.toggle("keyboard-open", open);
      const el = document.activeElement;
      if (
        open &&
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
      ) {
        window.setTimeout(() => {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 80);
      }
    };

    viewport.addEventListener("resize", syncKeyboard);
    viewport.addEventListener("scroll", syncKeyboard);
    return () => {
      viewport.removeEventListener("resize", syncKeyboard);
      viewport.removeEventListener("scroll", syncKeyboard);
    };
  }, []);

  return null;
}
