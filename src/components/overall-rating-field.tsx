"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function OverallRatingField({ value, error }: { value?: number; error?: string }) {
  const [selected, setSelected] = useState(value ?? 0);
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || selected;

  return (
    <fieldset className="min-w-0 sm:col-span-2">
      <legend className="mb-2 text-sm font-medium">Overall Rating <span className="text-red-600" aria-hidden>*</span></legend>
      <div className="flex w-fit gap-0.5" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative size-11">
            <Star className="pointer-events-none absolute top-1 left-1 size-9 text-[#777]" strokeWidth={1.5} aria-hidden />
            <span className="pointer-events-none absolute top-1 left-1 h-9 overflow-hidden" style={{ width: `${Math.min(1, Math.max(0, displayed - star + 1)) * 36}px` }} aria-hidden>
              <Star className="size-9 fill-accent text-[#946500]" strokeWidth={1.5} />
            </span>
            {[star - 0.5, star].map((rating, half) => (
              <label
                key={rating}
                title={`${rating} out of 5`}
                onMouseEnter={() => setHovered(rating)}
                className={`absolute inset-y-0 w-1/2 cursor-pointer ${half === 0 ? "left-0" : "right-0"}`}
              >
                <input
                  type="radio"
                  name="overallRating"
                  value={rating}
                  checked={selected === rating}
                  onChange={() => { setSelected(rating); setHovered(0); }}
                  onFocus={() => setHovered(0)}
                  required
                  aria-label={`${rating} out of 5`}
                  aria-describedby={`overallRating-scale${error ? " overallRating-error" : ""}`}
                  data-invalid={Boolean(error)}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span className="pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-black" aria-hidden />
              </label>
            ))}
          </div>
        ))}
      </div>
      <p id="overallRating-scale" className="mt-1 flex flex-wrap gap-x-4 pl-1 text-xs leading-4 text-text-muted">
        <span>0.5 - Very poor</span><span>5 - Excellent</span>
        <span className="min-w-10 font-semibold text-black" aria-live="polite">{selected ? `${selected} / 5` : ""}</span>
      </p>
      {error && <p id="overallRating-error" className="mt-1 text-xs text-error">{error}</p>}
    </fieldset>
  );
}
