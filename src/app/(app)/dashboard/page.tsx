"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { CourseReviewDialog } from "@/components/course-review-dialog";
import type { CourseReview, DashboardReview, ReviewValues } from "@/lib/course-review-data";
import { formatReviewTimestamp } from "@/lib/review-time";
import { createClient } from "@/lib/supabase/client";

const reviewColumns =
  "sm:grid-cols-[9rem_10rem_6.5rem_8rem_7.5rem_minmax(12rem,1fr)_auto] sm:items-center sm:gap-x-6";

async function getDashboardUser() {
  const { data } = await createClient().auth.getSession();
  return data.session?.user ?? null;
}

function toCourseReview(review: DashboardReview, authorId: string): CourseReview {
  return {
    id: review.id,
    authorId,
    createdAt: review.createdAt,
    editedAt: review.editedAt,
    overallRating: review.overall,
    difficulty: review.difficulty,
    workload: review.workload,
    careerRelevance: review.careerRelevance,
    gradeLeniency: review.gradeLeniency,
    attendanceMandatory: review.attendanceMandatory,
    professor: review.professor,
    comment: review.comment,
  };
}

function applySaved(current: DashboardReview, saved: CourseReview): DashboardReview {
  return {
    ...current,
    editedAt: saved.editedAt,
    professor: saved.professor,
    overall: saved.overallRating,
    difficulty: saved.difficulty,
    workload: saved.workload,
    careerRelevance: saved.careerRelevance,
    gradeLeniency: saved.gradeLeniency,
    attendanceMandatory: saved.attendanceMandatory,
    comment: saved.comment,
  };
}

async function professorsForCourse(code: string) {
  const match = code.trim().toUpperCase().match(/^([A-Z]+)\s+([A-Z0-9]+)$/);
  if (!match) return [];

  const { data, error } = await createClient()
    .from("course_offerings")
    .select("professors!inner(name), courses!inner(department, course_number)")
    .ilike("courses.department", match[1])
    .ilike("courses.course_number", match[2]);

  if (error) return [];

  const names = new Set<string>();
  for (const row of data ?? []) {
    const professor = Array.isArray(row.professors) ? row.professors[0] : row.professors;
    if (typeof professor?.name === "string" && professor.name.trim()) {
      names.add(professor.name.trim());
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<DashboardReview[] | null>(null);
  const [editing, setEditing] = useState<DashboardReview | null>(null);
  const [professors, setProfessors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const editingId = useRef<string | null>(null);

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

  function openEdit(review: DashboardReview) {
    editingId.current = review.id;
    setNotice("");
    setEditing(review);
    setProfessors(review.professor ? [review.professor] : []);
    void professorsForCourse(review.code).then((names) => {
      if (editingId.current !== review.id || !names.length) return;
      setProfessors(names);
    });
  }

  function closeEdit() {
    editingId.current = null;
    setEditing(null);
  }

  async function saveReview(values: ReviewValues) {
    if (!editing) return;

    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sign in to submit a review.");

    const response = await fetch("/api/reviews", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...values,
        courseCode: editing.code,
        courseTitle: editing.title,
        id: Number(editing.id),
      }),
    });
    const body = await response.json().catch(() => null) as { error?: string; review?: CourseReview } | null;
    if (!response.ok || !body?.review) {
      throw new Error(body?.error ?? "Could not save your review.");
    }

    const saved = body.review;
    setReviews((current) => current?.map((item) => item.id === editing.id ? applySaved(item, saved) : item) ?? current);
    closeEdit();
    setNotice("Review updated.");
  }

  async function deleteReview() {
    if (!editing) return;

    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sign in to delete a review.");

    const response = await fetch("/api/reviews", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: Number(editing.id) }),
    });
    const body = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      throw new Error(body?.error ?? "Could not delete your review.");
    }

    const deletedId = editing.id;
    setReviews((current) => current?.filter((item) => item.id !== deletedId) ?? current);
    closeEdit();
    setNotice("Review deleted.");
  }

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-text-secondary">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 pt-8 pb-12">
      <h1 id="your-reviews" className="text-2xl font-semibold tracking-tight text-text-primary">
        Your Reviews
      </h1>
      {notice ? (
        <p role="status" className="mt-3 text-sm text-text-muted">{notice}</p>
      ) : null}
      <section aria-labelledby="your-reviews" className="mt-8">
        {reviews && reviews.length > 0 ? (
          <div
            className={`${reviewColumns} hidden border-b border-border pb-3 text-xs font-medium tracking-[0.14em] text-text-muted uppercase sm:grid`}
          >
            <div>Course</div>
            <div>Professor</div>
            <div>Overall</div>
            <div>Difficulty</div>
            <div>Workload</div>
            <div>Comment</div>
            <div className="sr-only">Actions</div>
          </div>
        ) : null}
        {reviews === null ? (
          <p className="py-8 text-sm text-text-muted">Loading your reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-sm text-text-muted">You haven&apos;t written a review yet.</p>
        ) : (
          <ul>
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border">
                <div className={`${reviewColumns} grid grid-cols-1 gap-y-1 py-4`}>
                  <span className="text-sm text-text-primary">
                    <Link href={`/courses/${review.courseId}`} className="hover:underline">
                      {review.code}
                    </Link>
                    <time dateTime={review.createdAt} className="mt-1 block max-w-[8.5rem] text-xs leading-4 text-text-muted">
                      Posted {formatReviewTimestamp(review.createdAt)}
                    </time>
                    {review.editedAt && review.editedAt !== review.createdAt ? (
                      <time dateTime={review.editedAt} className="mt-1 block max-w-[8.5rem] text-xs leading-4 text-text-muted">
                        Edited {formatReviewTimestamp(review.editedAt)}
                      </time>
                    ) : null}
                  </span>
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted sm:hidden">Professor </span>
                    {review.professor}
                  </span>
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted sm:hidden">Overall </span>
                    {review.overall}
                  </span>
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted sm:hidden">Difficulty </span>
                    {review.difficulty}
                  </span>
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted sm:hidden">Workload </span>
                    {review.workload}
                  </span>
                  <span className="text-sm text-text-primary">
                    <span className="text-text-muted sm:hidden">Comment </span>
                    {review.comment}
                  </span>
                  <span className="mt-2 sm:mt-0 sm:justify-self-end">
                    <button
                      type="button"
                      onClick={() => openEdit(review)}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Edit
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {editing && user ? (
        <CourseReviewDialog
          review={toCourseReview(editing, user.id)}
          courseLabel={editing.title ? `${editing.code} / ${editing.title}` : editing.code}
          professors={professors}
          onSave={saveReview}
          onDelete={deleteReview}
          onDismiss={closeEdit}
        />
      ) : null}
    </main>
  );
}
