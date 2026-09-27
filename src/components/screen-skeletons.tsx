import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholders for `loading.tsx` files.
 *
 * A `loading.tsx` is what lets Next commit a navigation straight away instead of
 * holding the previous screen until the server answers. These mirror the shape
 * of the screen that is coming, so the wait shows structure rather than a blank
 * panel — which reads as faster even when the query takes exactly as long.
 */

function Heading() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  );
}

function Field() {
  return (
    <div className="grid gap-2.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

/** Any screen that is mostly a card of inputs. */
export function FormSkeleton({ fields = 4, wide }: { fields?: number; wide?: boolean }) {
  return (
    <div className={cn("cb-rise mx-auto grid gap-7", wide ? "max-w-2xl" : "max-w-lg")}>
      <Heading />
      <div className="grid gap-6 rounded-[1.75rem] bg-white px-6 py-6 ring-1 ring-black/[0.06]">
        {Array.from({ length: fields }, (_, index) => (
          <Field key={index} />
        ))}
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** A searchable list of cards: the invoice list, the service catalog. */
export function ListSkeleton({ rows = 5, header = true }: { rows?: number; header?: boolean }) {
  return (
    <div className="cb-rise mx-auto grid max-w-lg gap-7 md:max-w-2xl">
      {header ? <Heading /> : null}
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-[1.5rem] bg-white px-5 py-4 ring-1 ring-black/[0.06]"
          >
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The dashboard: the heaviest screen in the app, because it reads every client
 * with their whole ledger. Sketching the hero card, the three rings, and the
 * charts tells the office what is arriving instead of hiding it behind a mark.
 */
export function DashboardSkeleton({ header = true }: { header?: boolean }) {
  return (
    <div className="cb-rise grid min-w-0 gap-5">
      {/* The page itself renders the real header, so it is skipped there. */}
      {header ? (
        <div className="grid gap-2">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-7 w-44" />
        </div>
      ) : null}

      {/* Hero money card. */}
      <div className="rounded-[1.75rem] bg-white/70 p-5 ring-1 ring-black/[0.06]">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-3 h-10 w-52" />
        <Skeleton className="mt-3 h-4 w-40" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>

      {/* The three rings. */}
      <div className="grid min-w-0 grid-cols-3 gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="grid justify-items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-border">
            <Skeleton className="size-[72px] rounded-full" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Donut, then the six-month lines. */}
      <div className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <Skeleton className="mx-auto size-40 rounded-full" />
          <div className="grid gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-4 h-44 w-full rounded-2xl" />
      </div>

      <div className="rounded-3xl bg-white p-4 ring-1 ring-border">
        <Skeleton className="h-4 w-36" />
        <div className="mt-4 grid gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="grid gap-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
