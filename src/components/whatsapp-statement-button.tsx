"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    CubityAndroid?: {
      sharePdf: (base64: string, filename: string, phone: string) => void;
    };
  }
}

function whatsappDigits(phone: string) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`;
  else if (digits.length === 10) digits = `880${digits}`;
  return digits;
}

function filenameFrom(header: string | null) {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] || "Client-due-statement.pdf";
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function WhatsAppStatementButton({
  href,
  phone,
  className,
  children,
}: {
  href: string;
  phone: string;
  className: string;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);

  async function share() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error("Could not build the statement.");
      const blob = await response.blob();
      const filename = filenameFrom(response.headers.get("Content-Disposition"));
      const file = new File([blob], filename, { type: "application/pdf" });
      const bridge = window.CubityAndroid;
      if (bridge?.sharePdf) {
        bridge.sharePdf(await blobToBase64(blob), filename, whatsappDigits(phone));
        return;
      }
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      toast.error("This device can't attach the PDF to WhatsApp.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Couldn't attach the statement.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className={className} onClick={share} disabled={pending}>
      {children}
    </button>
  );
}
