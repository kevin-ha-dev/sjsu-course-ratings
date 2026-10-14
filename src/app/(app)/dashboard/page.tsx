"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { Pin } from "lucide-react";
import Link from "next/link";

import { usePinnedCourses, type PinnedCourse } from "@/components/pinned-courses";
import type { DashboardReview } from "@/lib/course-review-data";
import { createClient } from "@/lib/supabase/client";

const reviewColumns =
  "sm:grid-cols-[8rem_11rem_5.5rem_7.5rem_7rem_minmax(0,1fr)] sm:items-baseline sm:gap-y-0";

function ClassCell({
  item,
  className,
}: {
  item: PinnedCourse;
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
  const { courses: pinnedCourses, ready: pinsReady } = usePinnedCourses();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<DashboardReview[] | null>(null);

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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    createClient().auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) setReviews([]);
        return;
      }

      const response = await fetch("/api/reviews?mine=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => null) as { reviews?: DashboardReview[] } | null;
      if (!cancelled) setReviews(response.ok && Array.isArray(body?.reviews) ? body.reviews : []);
    }).catch(() => {
      if (!cancelled) setReviews([]);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

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
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
        >
          Your pinned classes
        </h2>
        {!pinsReady ? (
          <p className="px-6 py-8 text-sm text-text-muted">Loading pinned classes...</p>
        ) : pinnedCourses.length === 0 ? (
          <p className="flex items-center gap-2 px-6 py-8 text-sm text-text-muted">
            <Pin className="size-4 shrink-0" aria-hidden />
            Nothing pinned.{" "}
            <Link href="/courses" className="text-text-primary hover:text-brand">
              Pin a course
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {pinnedCourses.map((item) => (
              <ClassCell
                key={item.id}
                item={item}
                className="border-border border-b last:border-b-0 sm:max-lg:[&:nth-last-child(-n+2)]:border-b-0 sm:max-lg:[&:not(:nth-child(2n))]:border-r lg:[&:nth-last-child(-n+4)]:border-b-0 lg:[&:not(:nth-child(4n))]:border-r"
              />
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="your-reviews" className="mt-8">
        <h2
          id="your-reviews"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
        >
          Your reviews
        </h2>
        {reviews && reviews.length > 0 ? (
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
        ) : null}
        {reviews === null ? (
          <p className="px-6 py-8 text-sm text-text-muted">Loading your reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="px-6 py-8 text-sm text-text-muted">You haven&apos;t written a review yet.</p>
        ) : (
          <ul>
            {reviews.map((review) => (
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
        )}
      </section>
    </main>
  );
}
