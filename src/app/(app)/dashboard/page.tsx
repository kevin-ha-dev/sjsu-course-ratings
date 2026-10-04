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

const thisTermClasses: ClassOffering[] = [
  { id: "cs-146", code: "CS 146", title: "Data Structures and Algorithms" },
  { id: "cmpe-131", code: "CMPE 131", title: "Software Engineering I" },
  { id: "cs-151", code: "CS 151", title: "Object-Oriented Design" },
  { id: "cmpe-102", code: "CMPE 102", title: "Assembly Language Programming" },
  { id: "cs-149", code: "CS 149", title: "Operating Systems" },
  { id: "cs-46b", code: "CS 46B", title: "Introduction to Data Structures" },
  { id: "math-42", code: "MATH 42", title: "Discrete Mathematics" },
  { id: "engl-1b", code: "ENGL 1B", title: "Argument and Analysis" },
];

const yourReviews = [
  {
    id: "cs-146-review",
    courseId: "cs-146",
    code: "CS 146",
    title: "Data Structures and Algorithms",
    professor: "Jane Smith",
    overall: 4,
    difficulty: 3,
    workload: 4,
    comment: "Lectures were clear. The projects took most of the week.",
  },
  {
    id: "cs-149-review",
    courseId: "cs-149",
    code: "CS 149",
    title: "Operating Systems",
    professor: "John Lee",
    overall: 5,
    difficulty: 4,
    workload: 4,
    comment: "Hard exams, but the labs made the material stick.",
  },
  {
    id: "math-42-review",
    courseId: "math-42",
    code: "MATH 42",
    title: "Discrete Mathematics",
    professor: "Maria Garcia",
    overall: 3,
    difficulty: 4,
    workload: 3,
    comment: "Proofs moved quickly. Office hours were worth going to.",
  },
];

const reviewColumns =
  "sm:grid-cols-[8rem_11rem_5.5rem_7.5rem_7rem_minmax(0,1fr)] sm:items-baseline sm:gap-y-0";

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
      <section aria-labelledby="this-term">
        <h2
          id="this-term"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
        >
          This term
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {thisTermClasses.map((item) => (
            <ClassCell
              key={item.id}
              item={item}
              className="border-border border-b last:border-b-0 sm:max-lg:[&:nth-last-child(-n+2)]:border-b-0 sm:max-lg:[&:not(:nth-child(2n))]:border-r lg:[&:nth-last-child(-n+4)]:border-b-0 lg:[&:not(:nth-child(4n))]:border-r"
            />
          ))}
        </ul>
      </section>
      <section aria-labelledby="your-reviews" className="mt-8">
        <h2
          id="your-reviews"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
        >
          Your reviews
        </h2>
        <div
          className={`${reviewColumns} hidden border-b border-border text-xs font-medium tracking-[0.14em] text-text-muted uppercase sm:grid`}
        >
          <div className="px-4 py-3">Course</div>
          <div className="px-4 py-3">Professor</div>
          <div className="px-4 py-3">Overall</div>
          <div className="px-4 py-3">Difficulty</div>
          <div className="px-4 py-3">Workload</div>
          <div className="px-4 py-3">Comment</div>
        </div>
        <ul>
          {yourReviews.map((review) => (
            <li key={review.id} className="border-b border-border last:border-b-0">
              <Link
                href={`/courses/${review.courseId}`}
                className={`${reviewColumns} grid grid-cols-1 gap-y-1 px-6 py-4 hover:bg-surface sm:px-0 sm:py-0`}
              >
                <span className="text-sm font-medium tracking-[0.04em] text-text-primary sm:px-4 sm:py-4">
                  {review.code}
                </span>
                <span className="text-sm text-text-primary sm:px-4 sm:py-4">
                  {review.professor}
                </span>
                <span className="text-sm text-text-primary sm:px-4 sm:py-4">
                  <span className="text-text-muted sm:hidden">Overall </span>
                  {review.overall}
                </span>
                <span className="text-sm text-text-primary sm:px-4 sm:py-4">
                  <span className="text-text-muted sm:hidden">Difficulty </span>
                  {review.difficulty}
                </span>
                <span className="text-sm text-text-primary sm:px-4 sm:py-4">
                  <span className="text-text-muted sm:hidden">Workload </span>
                  {review.workload}
                </span>
                <span className="text-sm text-text-secondary sm:px-4 sm:py-4">
                  {review.comment}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
