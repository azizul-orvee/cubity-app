"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "default",
  className,
  pendingLabel = "Saving...",
  disabled,
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} variant={variant} className={className}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
