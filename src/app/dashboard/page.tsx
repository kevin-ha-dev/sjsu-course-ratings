"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import supabase from "@/lib/supabase/client";

async function getDashboardUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        return;
      }

      if (event === "INITIAL_SESSION") {
        const currentUser = await getDashboardUser();
        if (cancelled) return;

        if (currentUser) {
          setUser(currentUser);
          setLoading(false);
          return;
        }

        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-text-secondary">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-brand">
        San Jose State University
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
        Dashboard
      </h1>
      <p className="mt-4 text-text-secondary">
        You are signed in
        {user?.email ? ` as ${user.email}` : ""}. Course ratings will show up
        here.
      </p>
    </main>
  );
}
