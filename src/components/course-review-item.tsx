"use client";

import { ChevronDown, Pencil, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { StarRating } from "@/components/star-rating";
import type { CourseReview } from "@/lib/course-review-data";

export function CourseReviewItem({ review, onEdit }: { review: CourseReview; onEdit?: () => void }) {
  const textId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scores: [string, string][] = [
    ["Difficulty", `${review.difficulty} / 5`],
    ["Workload", Number.isFinite(review.workload) ? `${review.workload} / 5` : "Not rated"],
  ];
  if (review.careerRelevance != null) scores.push(["Career relevancy", `${review.careerRelevance} / 5`]);
  if (review.gradeLeniency != null) scores.push(["Grade leniency", `${review.gradeLeniency} / 5`]);
  if (typeof review.attendanceMandatory === "boolean") scores.push(["Attendance", review.attendanceMandatory ? "Mandatory" : "Optional"]);
  const scoreColumns = ["sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4", "sm:grid-cols-5"][scores.length - 2];

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
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="font-semibold">{review.overallRating.toFixed(1)}</span>
          <StarRating value={review.overallRating} />
        </div>
        <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-text-muted">
            <UserRound className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{review.professor}</span>
          </span>
          {onEdit && (
            <span className="inline-flex shrink-0 items-center gap-3">
              <span className="text-xs text-text-muted">Your review</span>
              <button type="button" onClick={onEdit} aria-label="Edit your review" title="Edit your review" className="flex size-8 shrink-0 items-center justify-center rounded text-text-muted hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2">
                <Pencil className="size-4" aria-hidden />
              </button>
            </span>
          )}
        </div>
      </div>
      <dl className={`mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm ${scoreColumns}`}>
        {scores.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-1">{value}</dd>
          </div>
        ))}
      </dl>
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
    </li>
  );
}
