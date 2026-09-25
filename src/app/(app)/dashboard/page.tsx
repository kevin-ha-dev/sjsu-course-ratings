"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

type ClassOffering = {
  id: string;
  code: string;
  title: string;
};

const pinnedClasses: ClassOffering[] = [
  { id: "cs-146", code: "CS 146", title: "Data Structures and Algorithms" },
  { id: "cs-149", code: "CS 149", title: "Operating Systems" },
  { id: "cmpe-131", code: "CMPE 131", title: "Software Engineering I" },
  { id: "math-42", code: "MATH 42", title: "Discrete Mathematics" },
];

const popularClasses: ClassOffering[] = [
  { id: "cs-146", code: "CS 146", title: "Data Structures and Algorithms" },
  { id: "cmpe-131", code: "CMPE 131", title: "Software Engineering I" },
  { id: "cs-151", code: "CS 151", title: "Object-Oriented Design" },
  { id: "cmpe-102", code: "CMPE 102", title: "Assembly Language Programming" },
  { id: "cs-149", code: "CS 149", title: "Operating Systems" },
  { id: "cs-46b", code: "CS 46B", title: "Introduction to Data Structures" },
  { id: "math-42", code: "MATH 42", title: "Discrete Mathematics" },
  { id: "engl-1b", code: "ENGL 1B", title: "Argument and Analysis" },
];

function ClassCell({
  item,
  className,
}: {
  item: ClassOffering;
  className: string;
}) {
  return (
    <li className={className}>
      <Link
        href={`/courses/${item.id}`}
        className="flex min-h-32 flex-col justify-between px-6 py-4 hover:bg-surface"
      >
        <span className="text-xs font-medium tracking-[0.14em] text-text-muted uppercase">
          {item.code}
        </span>
        <span className="max-w-[16rem] text-sm font-medium text-text-primary">
          {item.title}
        </span>
      </Link>
    </li>
  );
}

async function getDashboardUser() {
  const { data } = await createClient().auth.getSession();
  return data.session?.user ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const supabase = createClient();
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

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-text-secondary">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <section aria-labelledby="pinned-classes">
        <h2
          id="pinned-classes"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-secondary uppercase"
        >
          Pinned
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {pinnedClasses.map((item) => (
            <ClassCell
              key={item.id}
              item={item}
              className="border-border sm:max-lg:[&:not(:nth-child(2n))]:border-r lg:[&:not(:nth-child(4n))]:border-r"
            />
          ))}
        </ul>
      </section>
      <section aria-labelledby="popular-classes" className="mt-8 flex-1">
        <h2
          id="popular-classes"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
        >
          Popular
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {popularClasses.map((item) => (
            <ClassCell
              key={item.id}
              item={item}
              className="border-border border-b last:border-b-0 sm:max-lg:[&:nth-last-child(-n+2)]:border-b-0 sm:max-lg:[&:not(:nth-child(2n))]:border-r lg:[&:nth-last-child(-n+4)]:border-b-0 lg:[&:not(:nth-child(4n))]:border-r"
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
