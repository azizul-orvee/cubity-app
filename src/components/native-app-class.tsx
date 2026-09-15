"use client";

import { useEffect } from "react";

export function NativeAppClass() {
  useEffect(() => {
    if (navigator.userAgent.includes("CubityApp")) {
      document.documentElement.classList.add("cubity-app");
    }
  }, []);
  return null;
}
