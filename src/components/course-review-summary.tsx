"use client";

import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { CourseReview } from "@/lib/course-review-data";

export function CourseReviewSummary({ reviews }: { reviews: CourseReview[] }) {
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const includedReviews = reviews.slice(0, 50);

  useEffect(() => () => controller.current?.abort(), []);

  async function generate() {
    if (controller.current || !includedReviews.length) return;
    const requestController = new AbortController();
    controller.current = requestController;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reviews/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestController.signal,
        body: JSON.stringify({
          reviews: includedReviews.map(({ comment, overallRating, difficulty, workload, careerRelevance, gradeLeniency, attendanceMandatory }) => ({
            comment, overallRating, difficulty, workload, careerRelevance, gradeLeniency, attendanceMandatory,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not generate a summary. Please try again.");
      if (typeof result.summary !== "string" || !result.summary.trim()) throw new Error("No summary was returned. Please try again.");
      if (!requestController.signal.aborted) setSummary(result.summary);
    } catch (error) {
      if (!requestController.signal.aborted) setError(error instanceof Error ? error.message : "Could not generate a summary. Please try again.");
    } finally {
      if (!requestController.signal.aborted) {
        setLoading(false);
        controller.current = null;
      }
    }
  }

  return (
    <section aria-labelledby="review-summary-title" className="mt-7 border-l-2 border-accent py-3 pl-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-[#946500]" aria-hidden />
          <h2 id="review-summary-title" className="text-sm font-semibold">AI review summary</h2>
        </div>
        {reviews.length > 0 && !summary && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex min-h-9 w-44 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> : error ? <RotateCcw className="size-3.5" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
            {loading ? "Generating..." : error ? "Try again" : "Generate summary"}
          </button>
        )}
      </div>
      <div role="status" aria-live="polite" aria-busy={loading}>
        <p className="mt-2 text-sm leading-6 break-words text-text-muted">
          {!reviews.length ? "No reviews to summarize yet." : loading ? "Preparing a summary..." : summary || "No summary generated yet."}
        </p>
        {summary && (
          <p className="mt-2 text-xs text-text-muted">
            Based on {includedReviews.length}{reviews.length > includedReviews.length ? ` of ${reviews.length}` : ""} {includedReviews.length === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </section>
  );
}
