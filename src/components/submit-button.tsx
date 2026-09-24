"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "default",
  className,
  pendingLabel = "Saving...",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
