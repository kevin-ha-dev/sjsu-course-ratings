"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CourseDetails } from "@/components/course-details";
import { CourseReviewDialog } from "@/components/course-review-dialog";
import { CourseReviewItem } from "@/components/course-review-item";
import { CourseReviewSummary } from "@/components/course-review-summary";
import { StarRating } from "@/components/star-rating";
import type { Course, CourseReview, ReviewValues } from "@/lib/course-review-data";
import { createClient } from "@/lib/supabase/client";

export function CourseReviewPage({ course }: { course: Course }) {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [dialog, setDialog] = useState<{ review: CourseReview | null } | null>(null);
  const [notice, setNotice] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const mutationVersion = useRef(0);
  const count = reviews.length;
  const average = count ? (reviews.reduce((sum, review) => sum + review.overallRating, 0) / count).toFixed(1) : null;
  const difficulty = count ? Math.round(reviews.reduce((sum, review) => sum + review.difficulty, 0) / count / 5 * 100) : null;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const version = mutationVersion.current;

    createClient().auth.getSession().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data.session?.user.id ?? null);
    }).catch(() => {
      if (!cancelled) setCurrentUserId(null);
    });

    fetch(`/api/reviews?course=${encodeURIComponent(course.code)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load reviews.");
        return response.json() as Promise<{ reviews?: CourseReview[] }>;
      })
      .then((body) => {
        if (!Array.isArray(body.reviews)) throw new Error("Could not load reviews.");
        if (!cancelled && mutationVersion.current === version) setReviews(body.reviews);
      })
      .catch(() => {
        if (!cancelled) setReviewsError("Could not load reviews.");
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [course.code, reloadKey]);

  function retryReviews() {
    setLoadingReviews(true);
    setReviewsError("");
    setReloadKey((key) => key + 1);
  }

  async function saveReview(values: ReviewValues) {
    const existing = dialog?.review;
    const savedReview = existing !== null && existing !== undefined;

    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sign in to submit a review.");

    const response = await fetch("/api/reviews", {
      method: savedReview ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...values,
        courseCode: course.code,
        courseTitle: course.title,
        ...(savedReview && existing ? { id: Number(existing.id) } : {}),
      }),
    });
    const body = await response.json().catch(() => null) as { error?: string; review?: CourseReview } | null;
    if (!response.ok || !body?.review) {
      throw new Error(body?.error ?? "Could not save your review.");
    }

    const review = body.review;
    mutationVersion.current += 1;
    setReviews((current) => savedReview && existing
      ? current.map((item) => item.id === existing.id ? review : item)
      : [review, ...current]);
    retryReviews();
    setDialog(null);
    setNotice(savedReview ? "Review updated." : "Review added.");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white font-[Arial,Helvetica,sans-serif] text-text-primary [--border:#e2e4e6] [--brand:#202124] [--surface-muted:#f5f6f7] [--text-muted:#62676c]">
      <main className="w-full min-w-0 px-6 pt-6 pb-12 sm:px-10 sm:pt-8 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/courses" className="underline-offset-4 hover:text-text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">Courses</Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">{course.code}</span>
        </nav>
        <header>
          <p className="mb-1 text-sm font-medium text-text-muted">{course.code}</p>
          <h1 className="break-words text-[26px] leading-tight font-semibold sm:text-[30px]">
            {course.title}
          </h1>
          <div aria-label="Course rating summary" className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
            <span className="inline-flex items-center gap-2.5 text-text-primary">
              <span className="text-lg font-semibold">{average ?? "Not rated"}</span>
              <StarRating value={average === null ? null : Number(average)} />
            </span>
            <span>{count} {count === 1 ? "rating" : "ratings"}</span>
            <span>{difficulty === null ? "Difficulty not rated" : `${difficulty}% difficulty`}</span>
          </div>
        </header>
        <CourseReviewSummary key={JSON.stringify(reviews)} reviews={reviews} />
        <CourseDetails reviews={reviews} professors={course.professors} />
        <section aria-labelledby="reviews-title" className="mt-6">
          <div className="mb-2 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-2">
            <h2
              id="reviews-title"
              className="text-lg font-semibold"
            >
              Reviews
            </h2>
            <span className="text-sm text-text-muted">{count}</span>
            </div>
            <button
              type="button"
              onClick={() => setDialog({ review: null })}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black"
            >
              Write a review <ArrowRight className="size-4" aria-hidden />
            </button>
            {notice ? (
              <p role="status" className="basis-full text-sm text-text-muted">
                {notice}
              </p>
            ) : null}
          </div>
          {reviewsError && reviews.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
              <p role="alert" className="text-error">{reviewsError}</p>
              <button type="button" onClick={retryReviews} className="underline underline-offset-4">Try again</button>
            </div>
          )}
          {loadingReviews && !reviews.length ? (
            <p className="border-b border-border py-10 text-sm text-text-muted">Loading reviews...</p>
          ) : reviewsError && !reviews.length ? (
            <div className="border-b border-border py-10 text-sm">
              <p role="alert" className="text-error">{reviewsError}</p>
              <button type="button" onClick={retryReviews} className="mt-2 underline underline-offset-4">Try again</button>
            </div>
          ) : reviews.length ? (
            <ul aria-label="Course reviews">
              {reviews.map((review) => (
                <CourseReviewItem key={review.id} review={review} onEdit={review.authorId === currentUserId ? () => setDialog({ review }) : undefined} />
              ))}
            </ul>
          ) : (
            <p className="border-b border-border py-10 text-sm text-text-muted">No reviews yet.</p>
          )}
        </section>
      </main>
      {dialog ? (
        <CourseReviewDialog
          review={dialog.review}
          courseLabel={`${course.code} / ${course.title}`}
          professors={course.professors}
          onSave={saveReview}
          onDismiss={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
