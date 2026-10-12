"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CourseOverviewHeader } from "@/components/course-overview-header";
import { CourseDetails } from "@/components/course-details";
import { CourseReviewDialog } from "@/components/course-review-dialog";
import { CourseReviewItem } from "@/components/course-review-item";
import { CourseReviewSummary } from "@/components/course-review-summary";
import { StarRating } from "@/components/star-rating";
import { DEMO_USER_ID, type Course, type CourseReview, type ReviewValues } from "@/lib/course-review-data";

export function CourseReviewPage({ course }: { course: Course }) {
  const [reviews, setReviews] = useState(course.reviews);
  const [dialog, setDialog] = useState<{ review: CourseReview | null } | null>(null);
  const [notice, setNotice] = useState("");
  const count = reviews.length;
  const average = count ? (reviews.reduce((sum, review) => sum + review.overallRating, 0) / count).toFixed(1) : null;
  const difficulty = count ? Math.round(reviews.reduce((sum, review) => sum + review.difficulty, 0) / count / 5 * 100) : null;

  function saveReview(values: ReviewValues) {
    const existing = dialog?.review;
    if (existing) {
      setReviews((current) => current.map((review) => review.id === existing.id ? { ...review, ...values } : review));
    } else {
      setReviews((current) => [{ ...values, id: crypto.randomUUID(), authorId: DEMO_USER_ID }, ...current]);
    }
    setDialog(null);
    setNotice(existing ? "Review updated." : "Review added.");
  }

  return (
    <div className="min-h-dvh bg-white font-[Arial,Helvetica,sans-serif] text-text-primary [--border:#e2e4e6] [--brand:#202124] [--surface-muted:#f5f6f7] [--text-muted:#62676c]">
      <CourseOverviewHeader courseCode={course.code} />
      <main className="mx-auto w-full min-w-0 max-w-[1000px] px-5 pt-6 pb-12 sm:px-9 sm:pt-8">
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
          {reviews.length ? (
            <ul aria-label="Course reviews">
              {reviews.map((review) => (
                <CourseReviewItem key={review.id} review={review} onEdit={review.authorId === DEMO_USER_ID ? () => setDialog({ review }) : undefined} />
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
