"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function profileName(user: User) {
  const metadata = user.user_metadata;
  const name = metadata.full_name ?? metadata.name;
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return user.email ?? "Account";
}

function profileImage(user: User) {
  const metadata = user.user_metadata;
  const url = metadata.avatar_url ?? metadata.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

export function ProfileMenu() {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    const { error } = await createClient().auth.signOut();
    setSigningOut(false);
    if (error) {
      return;
    }
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  const image = user ? profileImage(user) : null;
  const name = user ? profileName(user) : null;

  return (
    <div ref={rootRef} className="relative flex shrink-0">
      <button
        type="button"
        aria-label="Open profile"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="size-9 overflow-hidden rounded-full border border-border bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
      >
        {image ? (
          // Google profile photos are remote URLs that are not configured for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Profile"
          className="absolute top-full right-4 z-20 w-56 rounded-lg border border-border bg-surface p-3 shadow-sm"
        >
          {user ? (
            <>
              <p className="truncate text-sm font-medium text-text-primary">
                {name}
              </p>
              {user.email ? (
                <p className="mt-0.5 truncate text-xs text-text-secondary">
                  {user.email}
                </p>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-surface-muted disabled:opacity-50"
              >
                <LogOut className="size-4" aria-hidden />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              Sign in
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
