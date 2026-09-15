"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? "Saving..." : children}
    </Button>
  );
}
