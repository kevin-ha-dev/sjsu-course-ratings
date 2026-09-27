"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { CourseReview, ReviewValues } from "@/lib/course-review-data";

const ratingFields = [
  { name: "overallRating", label: "Overall Rating", low: "Very poor", high: "Excellent" },
  { name: "difficulty", label: "Class Difficulty", low: "Very easy", high: "Very difficult" },
  { name: "careerRelevance", label: "Career Relevancy", low: "Not relevant for career", high: "Helped me land a job" },
  { name: "gradeLeniency", label: "Grade Leniency", low: "Harsh grader", high: "Easy A" },
] as const;

function RatingField({
  field,
  value,
  error,
}: {
  field: (typeof ratingFields)[number];
  value?: number;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-xl leading-6 text-[#656565]">{field.label}</legend>
      <div className="flex w-fit gap-0.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className="flex size-7 cursor-pointer items-center justify-center" title={`${rating} out of 5`}>
            <input
              type="radio"
              name={field.name}
              value={rating}
              defaultChecked={value === rating}
              required
              aria-label={`${rating} out of 5`}
              data-invalid={Boolean(error)}
              aria-describedby={`${field.name}-scale${error ? ` ${field.name}-error` : ""}`}
              className="size-[19px] cursor-pointer appearance-none rounded-full border border-[#808080] bg-[#d9d9d9] checked:border-black checked:bg-black hover:border-black focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black"
            />
          </label>
        ))}
      </div>
      <p id={`${field.name}-scale`} className="flex flex-wrap gap-x-4 pl-1 text-[11px] leading-[14px] text-[#666]">
        <span>1 - {field.low}</span><span>5 - {field.high}</span>
      </p>
      {error && <p id={`${field.name}-error`} className="mt-1 text-xs text-error">{error}</p>}
    </fieldset>
  );
}

export function CourseReviewDialog({
  review,
  professors,
  onSave,
  onDismiss,
}: {
  review: CourseReview | null;
  professors: string[];
  onSave: (values: ReviewValues) => void;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const value = Number(data.get(field.name));
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        nextErrors[field.name] = "Choose a rating from 1 to 5.";
      }
    }
    const attendance = data.get("attendanceMandatory");
    const professor = String(data.get("professor") ?? "");
    const comment = String(data.get("comment") ?? "").trim();
    if (attendance !== "yes" && attendance !== "no") nextErrors.attendanceMandatory = "Choose Yes or No.";
    if (!professors.includes(professor)) nextErrors.professor = "Choose a professor.";
    if (!comment) nextErrors.comment = "Write a review before submitting.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({
      overallRating: Number(data.get("overallRating")),
      difficulty: Number(data.get("difficulty")),
      careerRelevance: Number(data.get("careerRelevance")),
      gradeLeniency: Number(data.get("gradeLeniency")),
      attendanceMandatory: attendance === "yes",
      professor,
      comment,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="review-dialog-title"
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[972px] overflow-y-auto border-0 bg-white p-5 text-text-primary backdrop:bg-black/70 sm:px-8 sm:py-6"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="review-dialog-title" className="text-2xl font-normal sm:text-[26px]">
          {review ? "Edit Course rating" : "Add Course rating"}
        </h2>
        <button type="button" onClick={onDismiss} aria-label="Close review form" title="Close review form" className="flex size-9 shrink-0 items-center justify-center rounded hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2">
          <X size={22} aria-hidden />
        </button>
      </div>
      <form ref={formRef} noValidate onSubmit={submitReview} className="flex max-w-[490px] flex-col gap-2.5">
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-error">Please complete the highlighted fields.</p>}
        {ratingFields.slice(0, 3).map((field) => <RatingField key={field.name} field={field} value={review?.[field.name]} error={errors[field.name]} />)}
        <fieldset>
          <legend className="text-xl leading-6 text-[#656565]">Attendance Mandatory</legend>
          <div className="flex gap-5">
            {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((option) => (
              <label key={option.value} className="flex min-h-7 cursor-pointer items-center gap-2 pl-1 text-sm text-[#656565]">
                <input type="radio" name="attendanceMandatory" value={option.value} defaultChecked={review ? review.attendanceMandatory === (option.value === "yes") : false} required data-invalid={Boolean(errors.attendanceMandatory)} aria-describedby={errors.attendanceMandatory ? "attendance-error" : undefined} className="size-[19px] appearance-none rounded-full border border-[#808080] bg-[#d9d9d9] checked:border-black checked:bg-black hover:border-black focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black" />
                {option.label}
              </label>
            ))}
          </div>
          {errors.attendanceMandatory && <p id="attendance-error" className="mt-1 text-xs text-error">{errors.attendanceMandatory}</p>}
        </fieldset>
        <RatingField field={ratingFields[3]} value={review?.gradeLeniency} error={errors.gradeLeniency} />
        <div>
          <label htmlFor="review-professor" className="mb-1 block text-xl leading-6 text-[#656565]">Professor</label>
          <select id="review-professor" name="professor" defaultValue={review?.professor ?? ""} required aria-invalid={Boolean(errors.professor)} aria-describedby={errors.professor ? "professor-error" : undefined} className="h-9 w-full rounded-full border-0 bg-[#d9d9d9] px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2">
            <option value="" disabled>Select a professor</option>
            {professors.map((professor) => <option key={professor}>{professor}</option>)}
          </select>
          {errors.professor && <p id="professor-error" className="mt-1 text-xs text-error">{errors.professor}</p>}
        </div>
        <div>
          <label htmlFor="review-comment" className="mb-1 block text-xl leading-6 text-[#656565]">Write a Review</label>
          <textarea id="review-comment" name="comment" defaultValue={review?.comment ?? ""} required rows={3} aria-invalid={Boolean(errors.comment)} aria-describedby={errors.comment ? "comment-error" : undefined} className="block min-h-24 w-full resize-y rounded-[22px] border-0 bg-[#d9d9d9] p-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2" />
          {errors.comment && <p id="comment-error" className="mt-1 text-xs text-error">{errors.comment}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-sm text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black">
            {review ? "Save Changes" : "Submit Review"}
          </button>
          <button type="button" onClick={onDismiss} className="px-3 py-2.5 text-sm underline-offset-4 hover:underline focus-visible:outline-2">Cancel</button>
        </div>
      </form>
    </dialog>
  );
}
