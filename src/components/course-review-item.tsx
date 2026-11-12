"use client";

import { Check, ChevronDown, Pencil, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { StarRating } from "@/components/star-rating";
import type { CourseReview } from "@/lib/course-review-data";
import { formatReviewTimestamp } from "@/lib/review-time";

const ratingTags = {
  difficulty: ["Very Easy", "Somewhat Easy", "Average Difficulty", "Somewhat Hard", "Very Hard"],
  workload: ["Light Workload", "Somewhat Light Workload", "Average Workload", "Somewhat Heavy Workload", "Heavy Workload"],
  careerRelevance: ["Not Career Relevant", "Slightly Career Relevant", "Somewhat Career Relevant", "Highly Career Relevant", "Helped Me Land a Job"],
  gradeLeniency: ["Harsh Grader", "Slightly Harsh Grader", "Average Grader", "Slightly Easy Grader", "Easy A"],
};

export function CourseReviewItem({
  review,
  onEdit,
  courseLabel,
}: {
  review: CourseReview;
  onEdit?: () => void;
  courseLabel?: string;
}) {
  const textId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const reviewDate = formatReviewTimestamp(review.createdAt);
  const editedDate = formatReviewTimestamp(review.editedAt);
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
    <li className="border-b border-border py-6 even:-mx-3 even:rounded even:border-transparent even:bg-surface-muted even:px-3">
      {courseLabel && (
        <p className="mb-3 text-sm font-semibold">{courseLabel}</p>
      )}
      <div className="flex min-h-8 items-center justify-between gap-x-3">
        <div className="flex min-h-8 shrink-0 items-center gap-3 text-sm">
          <span className="font-semibold">{review.overallRating.toFixed(1)}</span>
          <StarRating value={review.overallRating} />
        </div>
        {reviewDate && <time dateTime={review.createdAt} className="relative top-1 min-w-0 break-words text-right text-xs text-text-muted">{reviewDate}</time>}
      </div>
      <div className="mt-2 flex items-start justify-between gap-x-3">
        <ul aria-label="Review attributes" className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {tags.map((tag) => <li key={tag} className="max-w-full break-words rounded bg-border px-2 py-1 text-xs leading-4">{tag}</li>)}
          {typeof review.attendanceMandatory === "boolean" && (
            <li className="ml-1 inline-flex items-center gap-1 text-xs text-text-muted" title={review.attendanceMandatory ? "Mandatory attendance" : "Optional attendance"}>
              Attendance<span className="sr-only"> {review.attendanceMandatory ? "mandatory" : "optional"}</span>
              {review.attendanceMandatory ? <Check className="size-3.5 text-green-700" aria-hidden /> : <X className="size-3.5 text-red-600" aria-hidden />}
            </li>
          )}
        </ul>
        <span className="inline-flex min-h-6 min-w-0 max-w-[40%] shrink-0 items-center gap-1.5 text-right text-xs text-text-muted">
          <UserRound className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{review.professor}</span>
        </span>
      </div>
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
          {editedDate && <p className="text-xs text-text-muted">Edited <time dateTime={review.editedAt ?? undefined}>{editedDate}</time></p>}
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
