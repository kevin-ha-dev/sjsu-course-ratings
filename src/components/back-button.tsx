"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const rootPages = new Set(["/dashboard", "/courses"]);

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (rootPages.has(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="absolute top-1/2 right-[calc(100%+0.5rem)] flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted hover:text-brand"
    >
      <ArrowLeft className="size-4" aria-hidden />
    </button>
  );
}
