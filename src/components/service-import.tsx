"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import {
  forgetPhoneServices,
  parsePhoneServiceNames,
  readPhoneServiceRaw,
} from "@/lib/invoice-catalog";
import { importPhoneServices } from "@/lib/service-actions";

/** localStorage does not change under us while this screen is open. */
const noSubscribe = () => () => {};

/**
 * The catalog used to live on each phone. If this phone still has its old list,
 * offer to move anything the office renamed or added into the shared one, once.
 */
export function ServiceImport({ knownNames }: { knownNames: string[] }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Read through useSyncExternalStore so the server renders nothing and the
  // client reads localStorage without pushing state in from an effect.
  const raw = useSyncExternalStore(noSubscribe, readPhoneServiceRaw, () => "");

  const extras = useMemo(() => {
    const known = new Set(knownNames);
    return [...new Set(parsePhoneServiceNames(raw).filter((name) => !known.has(name)))];
  }, [raw, knownNames]);

  if (done || extras.length === 0) return null;

  function run() {
    startTransition(async () => {
      const result = await importPhoneServices(extras);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      forgetPhoneServices();
      setDone(true);
      toast.success("Added to the office list");
    });
  }

  return (
    <section className="rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-primary/30">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">From this phone</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">
        {extras.length} {extras.length === 1 ? "service" : "services"} only on this phone
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        The list moved to the office database so every phone sees the same services. These were saved
        here before that and are not in the office list yet.
      </p>
      <ul className="mt-4 grid gap-2">
        {extras.map((name) => (
          <li key={name} className="rounded-2xl bg-[#F6FAFA] px-4 py-2.5 text-sm font-medium">
            {name}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Add to the office list
        </button>
        <button
          type="button"
          onClick={() => {
            forgetPhoneServices();
            setDone(true);
          }}
          className="inline-flex min-h-12 items-center rounded-2xl bg-white px-5 text-sm font-medium text-muted-foreground ring-1 ring-border"
        >
          Discard them
        </button>
      </div>
    </section>
  );
}
