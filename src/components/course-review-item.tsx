"use client";

import { Check, ChevronDown, Pencil, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { StarRating } from "@/components/star-rating";
import type { CourseReview } from "@/lib/course-review-data";

const ratingTags = {
  difficulty: ["Very Easy", "Somewhat Easy", "Average Difficulty", "Somewhat Hard", "Very Hard"],
  workload: ["Light Workload", "Somewhat Light Workload", "Average Workload", "Somewhat Heavy Workload", "Heavy Workload"],
  careerRelevance: ["Not Career Relevant", "Slightly Career Relevant", "Somewhat Career Relevant", "Highly Career Relevant", "Helped Me Land a Job"],
  gradeLeniency: ["Harsh Grader", "Slightly Harsh Grader", "Average Grader", "Slightly Easy Grader", "Easy A"],
};
const reviewDateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });

function formatReviewDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : reviewDateFormat.format(date);
}

export function CourseReviewItem({ review, onEdit }: { review: CourseReview; onEdit?: () => void }) {
  const textId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reviewDate = formatReviewDate(review.createdAt);
  const editedDate = formatReviewDate(review.editedAt);
  const tags: string[] = [
    ratingTags.difficulty[review.difficulty - 1] ?? "Difficulty not rated",
    ratingTags.workload[review.workload - 1] ?? "Workload not rated",
  ];
  if (review.careerRelevance != null) tags.push(ratingTags.careerRelevance[review.careerRelevance - 1] ?? "Career relevancy not rated");
  if (review.gradeLeniency != null) tags.push(ratingTags.gradeLeniency[review.gradeLeniency - 1] ?? "Grade leniency not rated");

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;

    // scrollHeight measures the full text even while the preview is clamped.
    const observer = new ResizeObserver(() => {
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
      const overflows = text.scrollHeight > lineHeight * 3 + 1;
      setHasOverflow(overflows);
      if (!overflows) setExpanded(false);
    });
    observer.observe(text);
    return () => observer.disconnect();
  }, [review.comment]);

  return (
    <li className="border-b border-border py-6 sm:pb-4 even:-mx-3 even:rounded even:border-transparent even:bg-surface-muted even:px-3">
      <div className="flex min-h-8 flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold">
            <UserRound className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{review.professor}</span>
          </span>
          {reviewDate && <time dateTime={review.createdAt} className="text-right text-xs text-text-muted">{reviewDate}</time>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{review.overallRating.toFixed(1)}</span>
          <StarRating value={review.overallRating} />
        </div>
      </div>
      <ul aria-label="Review attributes" className="mt-4 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => <li key={tag} className="rounded bg-border px-2 py-1 text-xs leading-4">{tag}</li>)}
        {typeof review.attendanceMandatory === "boolean" && (
          <li className="ml-1 inline-flex items-center gap-1 text-xs text-text-muted" title={review.attendanceMandatory ? "Mandatory attendance" : "Optional attendance"}>
            Attendance<span className="sr-only"> {review.attendanceMandatory ? "mandatory" : "optional"}</span>
            {review.attendanceMandatory ? <Check className="size-3.5 text-green-700" aria-hidden /> : <X className="size-3.5 text-red-600" aria-hidden />}
          </li>
        )}
      </ul>
      {review.comment && <p ref={textRef} id={textId} className={`mt-4 whitespace-pre-wrap break-words text-sm leading-6 ${expanded ? "" : "line-clamp-3"}`}>{review.comment}</p>}
      {review.comment && hasOverflow && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {expanded ? "Show less" : "Read full review"}
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
        </button>
      )}
      {(editedDate || onEdit) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {editedDate && <p className="text-xs text-text-muted">(Edited <time dateTime={review.editedAt}>{editedDate}</time>)</p>}
          {onEdit && (
            <button type="button" onClick={onEdit} aria-label="Edit your review" title="Edit your review" className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded px-2 text-xs text-text-muted hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2">
              Edit <Pencil className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
