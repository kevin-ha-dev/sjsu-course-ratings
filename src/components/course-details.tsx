import { ChevronDown, Info } from "lucide-react";

import type { CourseReview } from "@/lib/course-review-data";

export function CourseDetails({ reviews, professors }: { reviews: CourseReview[]; professors: string[] }) {
  const count = reviews.length;
  const average = (field: "difficulty" | "workload" | "careerRelevance" | "gradeLeniency") => {
    const scores = reviews.map((review) => review[field]).filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5);
    return scores.length ? `${(scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)} / 5` : null;
  };
  const attendanceAnswers = reviews.filter((review) => typeof review.attendanceMandatory === "boolean");
  const attendance = attendanceAnswers.length ? `${Math.round(attendanceAnswers.filter((review) => review.attendanceMandatory).length / attendanceAnswers.length * 100)}% mandatory` : null;
  const metrics: [string, string | null][] = [
    ["Difficulty", average("difficulty") ?? "Not rated"],
    ["Workload", average("workload") ?? "Not rated"],
    ["Career relevancy", average("careerRelevance")],
    ["Grade leniency", average("gradeLeniency")],
    ["Attendance", attendance],
  ];

  return (
    <details open className="group mt-6 border-y border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
        Course details
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-6 pt-3 pb-6 sm:grid-cols-2 sm:gap-10">
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">Rating breakdown</h2>
            <div className="group/ratings relative">
              <button type="button" aria-label="How ratings are grouped" aria-describedby="rating-breakdown-explanation" className="flex size-6 items-center justify-center rounded text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2">
                <Info className="size-3.5" aria-hidden />
              </button>
              <span id="rating-breakdown-explanation" role="tooltip" className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-md border border-border bg-white p-3 text-xs leading-5 text-text-primary opacity-0 shadow-sm group-hover/ratings:visible group-hover/ratings:opacity-100 group-focus-within/ratings:visible group-focus-within/ratings:opacity-100">
                Half-star ratings round up for this chart only. For example, 4.5 counts as 5 stars.
              </span>
            </div>
          </div>
          {count ? (
            <ul aria-label="Rating distribution" className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const total = reviews.filter((review) => Math.round(review.overallRating) === rating).length;
                return (
                  <li key={rating} aria-label={`${rating} ${rating === 1 ? "star" : "stars"}: ${total} ${total === 1 ? "review" : "reviews"}`} className="flex items-center gap-3 text-xs text-[#555]">
                    <span className="w-14 shrink-0">{rating} {rating === 1 ? "star" : "stars"}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                      <span className="block h-full bg-accent" style={{ width: `${total / count * 100}%` }} />
                    </span>
                    <span className="w-5 text-right tabular-nums">{total}<span className="sr-only"> {total === 1 ? "review" : "reviews"}</span></span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-[#555]">No ratings yet.</p>}
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
          {metrics.filter(([, value]) => value !== null).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[#555]">{label}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
          <div className="col-span-2 min-w-0">
            <dt className="text-xs text-[#555]">Professors</dt>
            <dd className="mt-1 break-words">{professors.join(", ")}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
