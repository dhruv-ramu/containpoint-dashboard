"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-serif text-xl font-semibold text-[var(--foreground)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--muted)] max-w-md">
        This part of the dashboard hit an error. You can try again or return to the app home.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/app">App home</a>
        </Button>
      </div>
    </div>
  );
}
