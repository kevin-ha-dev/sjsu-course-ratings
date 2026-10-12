import { Star } from "lucide-react";

export function StarRating({ value, large = false }: { value: number | null; large?: boolean }) {
  const rating = Math.min(5, Math.max(0, value ?? 0));
  const size = large ? "size-6" : "size-4";

  return (
    <span
      role="img"
      aria-label={value === null ? "Not rated" : `${Number(rating.toFixed(1))} out of 5 stars`}
      className="inline-flex shrink-0 gap-1 align-middle"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className={`relative block ${size}`} aria-hidden>
          <Star className={`${size} text-[#777]`} strokeWidth={1.5} />
          <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.min(1, Math.max(0, rating - index)) * 100}%` }}>
            <Star className={`${size} fill-accent text-[#946500]`} strokeWidth={1.5} />
          </span>
        </span>
      ))}
    </span>
  );
}
