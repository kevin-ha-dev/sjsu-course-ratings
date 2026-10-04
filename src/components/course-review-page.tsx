"use client";

import { ArrowRight, Pencil } from "lucide-react";
import { useState } from "react";

import { CourseReviewDialog } from "@/components/course-review-dialog";
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
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="border-b border-border px-6 py-8">
        <p className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase">
          {course.code}
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-text-primary">
          {course.title}
        </h1>
        <p aria-label="Course rating summary" className="mt-3 text-sm text-text-secondary">
          {average ? `${average} / 5` : "Not rated"}
          <span className="mx-2 text-text-muted" aria-hidden>
            ·
          </span>
          {count} {count === 1 ? "rating" : "ratings"}
          <span className="mx-2 text-text-muted" aria-hidden>
            ·
          </span>
          {difficulty === null ? "Difficulty not rated" : `${difficulty}% difficulty`}
        </p>
      </header>
      <section aria-labelledby="reviews-title">
        <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-4">
          <h2
            id="reviews-title"
            className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
          >
            Reviews
          </h2>
          <button
            type="button"
            onClick={() => setDialog({ review: null })}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
          >
            Rate <ArrowRight className="size-4" aria-hidden />
          </button>
          {notice ? (
            <p role="status" className="text-sm text-text-secondary">
              {notice}
            </p>
          ) : null}
        </div>
        {reviews.length ? (
          <ul aria-label="Course reviews">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border px-6 py-5 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {review.overallRating}/5
                    </span>
                    <span className="mx-2" aria-hidden>
                      ·
                    </span>
                    {review.professor}
                    {review.authorId === DEMO_USER_ID ? (
                      <span className="ml-3 text-xs text-text-muted">Your review</span>
                    ) : null}
                  </p>
                  {review.authorId === DEMO_USER_ID ? (
                    <button
                      type="button"
                      onClick={() => setDialog({ review })}
                      aria-label="Edit your review"
                      title="Edit your review"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-primary">
                  {review.comment}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span>Difficulty {review.difficulty}/5</span>
                  <span>Career relevancy {review.careerRelevance}/5</span>
                  <span>Grade leniency {review.gradeLeniency}/5</span>
                  <span>
                    Attendance {review.attendanceMandatory ? "mandatory" : "optional"}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-4 text-sm text-text-secondary">No reviews yet.</p>
        )}
      </section>
      {dialog ? (
        <CourseReviewDialog
          review={dialog.review}
          professors={course.professors}
          onSave={saveReview}
          onDismiss={() => setDialog(null)}
        />
      ) : null}
    </main>
  );
}
