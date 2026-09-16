import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hubPath, receivables } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div className="grid max-w-md gap-3">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          That client or page is not in Cubity&apos;s books.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href={hubPath}>Workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={receivables.clients}>Clients</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
