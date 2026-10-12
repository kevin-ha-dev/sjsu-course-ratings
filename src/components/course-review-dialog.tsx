"use client";

import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { CourseReview, ReviewValues } from "@/lib/course-review-data";
import { OverallRatingField } from "@/components/overall-rating-field";

const ratingFields = [
  { name: "overallRating", label: "Overall Rating", low: "Very poor", high: "Excellent", required: true },
  { name: "difficulty", label: "Class Difficulty", low: "Very easy", high: "Very difficult", required: true },
  { name: "workload", label: "Workload", low: "Minimal work", high: "Very time-consuming; lots of work", required: true },
  { name: "careerRelevance", label: "Career Relevancy", low: "Not relevant for career", high: "Helped me land a job", required: false },
  { name: "gradeLeniency", label: "Grade Leniency", low: "Harsh grader", high: "Easy A", required: false },
] as const;

function RatingField({
  field,
  value,
  error,
}: {
  field: (typeof ratingFields)[number];
  value?: number | null;
  error?: string;
}) {
  const [selected, setSelected] = useState(value ?? null);

  if (field.name === "overallRating") {
    return <OverallRatingField value={value ?? undefined} error={error} />;
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">{field.label}{field.required ? <span className="text-red-600" aria-hidden> *</span> : <span className="ml-1 text-xs font-normal text-text-muted" aria-hidden>Optional</span>}</legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className="relative flex size-8 cursor-pointer items-center justify-center" title={`${rating} out of 5`}>
            <input
              type="radio"
              name={field.name}
              value={rating}
              checked={selected === rating}
              onChange={() => setSelected(rating)}
              required={field.required}
              aria-label={`${rating} out of 5`}
              data-invalid={Boolean(error)}
              aria-describedby={`${field.name}-scale${error ? ` ${field.name}-error` : ""}`}
              className="peer absolute inset-0 size-full cursor-pointer opacity-0"
            />
            <span aria-hidden className="pointer-events-none flex size-full items-center justify-center rounded border border-border text-xs peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-hover:border-text-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-black">{rating}</span>
          </label>
        ))}
        {!field.required && (
          <button type="button" onClick={() => setSelected(null)} disabled={selected === null} aria-label={`Clear ${field.label}`} title={`Clear ${field.label}`} className="flex size-8 items-center justify-center rounded text-text-muted hover:bg-surface-muted focus-visible:outline-2 disabled:invisible">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <p id={`${field.name}-scale`} className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-text-muted">
        <span>1 - {field.low}</span><span>5 - {field.high}</span>
      </p>
      {error && <p id={`${field.name}-error`} className="mt-1 text-xs text-error">{error}</p>}
    </fieldset>
  );
}

export function CourseReviewDialog({
  review,
  courseLabel,
  professors,
  onSave,
  onDismiss,
}: {
  review: CourseReview | null;
  courseLabel: string;
  professors: string[];
  onSave: (values: ReviewValues) => void;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attendanceSelection, setAttendanceSelection] = useState<boolean | null>(review?.attendanceMandatory ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length) {
      formRef.current?.querySelector<HTMLElement>('[data-invalid="true"], [aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Record<string, string> = {};
    for (const field of ratingFields) {
      const answer = data.get(field.name);
      if (answer === null && !field.required) continue;
      const value = Number(answer);
      const isOverall = field.name === "overallRating";
      if (!Number.isInteger(value * (isOverall ? 2 : 1)) || value < (isOverall ? 0.5 : 1) || value > 5) {
        nextErrors[field.name] = isOverall ? "Choose a rating from 0.5 to 5 stars." : "Choose a rating from 1 to 5.";
      }
    }
    const attendance = data.get("attendanceMandatory");
    const professor = String(data.get("professor") ?? "");
    const comment = String(data.get("comment") ?? "").trim();
    if (attendance !== null && attendance !== "yes" && attendance !== "no") nextErrors.attendanceMandatory = "Choose Yes or No.";
    if (!professors.includes(professor)) nextErrors.professor = "Choose a professor.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      overallRating: Number(data.get("overallRating")),
      difficulty: Number(data.get("difficulty")),
      workload: Number(data.get("workload")),
      careerRelevance: data.has("careerRelevance") ? Number(data.get("careerRelevance")) : null,
      gradeLeniency: data.has("gradeLeniency") ? Number(data.get("gradeLeniency")) : null,
      attendanceMandatory: attendance === null ? null : attendance === "yes",
      professor,
      comment,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="review-dialog-title"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[560px] overflow-y-auto rounded-lg border border-border bg-white p-5 text-text-primary shadow-xl backdrop:bg-black/45 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="review-dialog-title" className="min-w-0 text-xl font-semibold">
          {review ? "Edit Course Review" : "Add Course Review"}
        </h2>
        <button type="button" onClick={onDismiss} aria-label="Close review form" title="Close review form" className="flex size-9 shrink-0 items-center justify-center rounded hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2">
          <X size={18} aria-hidden />
        </button>
      </div>
      <p className="mt-1 mb-6 text-xs leading-5 text-text-muted">{courseLabel}</p>
      <form ref={formRef} noValidate onSubmit={submitReview} className="grid w-full grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-error sm:col-span-2">Please complete the highlighted fields.</p>}
        {ratingFields.slice(0, 3).map((field) => <RatingField key={field.name} field={field} value={review?.[field.name]} error={errors[field.name]} />)}
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="review-professor" className="mb-2 block text-sm font-medium">Professor <span className="text-red-600" aria-hidden>*</span></label>
          <select id="review-professor" name="professor" defaultValue={review?.professor ?? ""} required aria-invalid={Boolean(errors.professor)} aria-describedby={errors.professor ? "professor-error" : undefined} className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm">
            <option value="" disabled>Select a professor</option>
            {professors.map((professor) => <option key={professor}>{professor}</option>)}
          </select>
          {errors.professor && <p id="professor-error" className="mt-1 text-xs text-error">{errors.professor}</p>}
        </div>
        {ratingFields.slice(3).map((field) => <RatingField key={field.name} field={field} value={review?.[field.name]} error={errors[field.name]} />)}
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">Attendance Mandatory <span className="ml-1 text-xs font-normal text-text-muted" aria-hidden>Optional</span></legend>
          <div className="flex items-center gap-2">
            {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((option) => (
              <label key={option.value} className="relative flex min-h-9 min-w-16 cursor-pointer items-center justify-center text-sm">
                <input type="radio" name="attendanceMandatory" value={option.value} checked={attendanceSelection === (option.value === "yes")} onChange={() => setAttendanceSelection(option.value === "yes")} data-invalid={Boolean(errors.attendanceMandatory)} aria-describedby={errors.attendanceMandatory ? "attendance-error" : undefined} className="peer absolute inset-0 size-full cursor-pointer opacity-0" />
                <span className="pointer-events-none flex min-h-9 w-full items-center justify-center rounded-md border border-border px-4 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-hover:border-text-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-black">{option.label}</span>
              </label>
            ))}
            <button type="button" onClick={() => setAttendanceSelection(null)} disabled={attendanceSelection === null} aria-label="Clear attendance" title="Clear attendance" className="flex size-8 items-center justify-center rounded text-text-muted hover:bg-surface-muted focus-visible:outline-2 disabled:invisible">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          {errors.attendanceMandatory && <p id="attendance-error" className="mt-1 text-xs text-error">{errors.attendanceMandatory}</p>}
        </fieldset>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="review-comment" className="mb-2 block text-sm font-medium">Write a Review <span className="ml-1 text-xs font-normal text-text-muted" aria-hidden>Optional</span></label>
          <textarea id="review-comment" name="comment" defaultValue={review?.comment ?? ""} rows={3} className="block min-h-24 w-full resize-y rounded-md border border-border bg-white p-3 text-base leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4 sm:col-span-2">
          <button type="button" onClick={onDismiss} className="px-3 py-2.5 text-sm text-text-muted underline-offset-4 hover:underline focus-visible:outline-2">Cancel</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black">
            {review ? "Save Changes" : "Submit Review"}
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </form>
    </dialog>
  );
}
