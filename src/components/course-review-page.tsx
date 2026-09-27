"use client";

import { ArrowRight, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CourseReviewDialog } from "@/components/course-review-dialog";
import { courses, DEMO_USER_ID, type Course, type CourseReview, type ReviewValues } from "@/lib/course-review-data";

export function CourseReviewPage({ course }: { course: Course }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(course.reviews);
  const [dialog, setDialog] = useState<{ review: CourseReview | null } | null>(null);
  const [query, setQuery] = useState(course.code);
  const [searchError, setSearchError] = useState("");
  const [notice, setNotice] = useState("");
  const count = reviews.length;
  const average = count ? (reviews.reduce((sum, review) => sum + review.overallRating, 0) / count).toFixed(1) : null;
  const difficulty = count ? Math.round(reviews.reduce((sum, review) => sum + review.difficulty, 0) / count / 5 * 100) : null;

  function searchCourses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase().replace(/[-\s]+/g, " ");
    if (!normalized) {
      setSearchError("Enter a course name or number.");
      return;
    }
    const exact = courses.find((item) => item.code.toLowerCase() === normalized || item.title.toLowerCase() === normalized);
    const matches = courses.filter((item) => `${item.code} ${item.title}`.toLowerCase().includes(normalized));
    const match = exact ?? (matches.length === 1 ? matches[0] : null);
    if (match) {
      setSearchError("");
      router.push(`/courses/${match.id}`);
    } else {
      setSearchError(matches.length ? "Choose a course from the list." : "No matching courses.");
    }
  }

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
    <div className="min-h-dvh bg-[#fafafa] font-[Arial,Helvetica,sans-serif] text-black">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 bg-[#191919] px-3.5 py-2 text-white md:min-h-14 md:grid-cols-[300px_minmax(0,640px)_1fr] lg:grid-cols-[326px_minmax(0,640px)_1fr]">
        <Link href="/courses" className="min-w-0 text-xl leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-[26px]">
          <span className="font-bold">SJSU</span> Course Ratings
        </Link>
        <form role="search" onSubmit={searchCourses} className="relative col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <label htmlFor="course-search" className="sr-only">Search courses</label>
          <div className="flex h-10 items-center rounded-full bg-[#fafafa] text-black focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white">
            <button type="submit" aria-label="Search courses" title="Search courses" className="flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-black">
              <Search size={25} strokeWidth={3} aria-hidden />
            </button>
            <input id="course-search" type="search" list="sample-courses" value={query} onChange={(event) => { setQuery(event.target.value); setSearchError(""); }} placeholder="Search courses" aria-invalid={Boolean(searchError)} aria-describedby={searchError ? "course-search-error" : undefined} className="min-w-0 flex-1 rounded-r-full bg-transparent pr-4 text-xl text-[#536d76] outline-none placeholder:text-[#71858c]" />
            <datalist id="sample-courses">{courses.map((item) => <option key={item.id} value={item.code}>{item.title}</option>)}</datalist>
          </div>
          {searchError && <p id="course-search-error" role="alert" className="absolute top-full z-10 mt-2 w-full rounded border border-border bg-white px-3 py-2 text-sm text-error shadow-sm">{searchError}</p>}
        </form>
        <Link href="/login" className="col-start-2 row-start-1 justify-self-end whitespace-nowrap text-lg underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 md:col-start-3 sm:text-[26px]">Log In</Link>
      </header>

      <main className="px-4 pt-7 pb-12 sm:px-[26px] sm:pt-8">
        <h1 className="break-words text-[30px] leading-tight font-normal sm:text-[44px]">{course.code} - {course.title}</h1>
        <div aria-label="Course rating summary" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg sm:text-[22px]">
          <span>{average ?? "Not rated"}{average && <span className="text-[#808080]"> / 5</span>}</span>
          <span>({count} {count === 1 ? "Rating" : "Ratings"})</span>
          <span aria-hidden>|</span>
          <span>{difficulty === null ? "Difficulty not rated" : `${difficulty}% Difficulty`}</span>
        </div>
        <section aria-labelledby="reviews-title" className="mt-4 max-w-[1008px]">
          <div className="mb-3 flex min-h-10 flex-wrap items-center gap-x-5 gap-y-2">
            <h2 id="reviews-title" className="text-[26px] font-normal">Reviews</h2>
            <button type="button" onClick={() => setDialog({ review: null })} className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-lg text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black">
              Rate <ArrowRight size={18} aria-hidden />
            </button>
            <p role="status" className="text-sm text-[#555]">{notice}</p>
          </div>
          {reviews.length ? (
            <ul aria-label="Course reviews">
              {reviews.map((review) => (
                <li key={review.id} className="relative min-h-[122px] px-5 py-5 odd:bg-[#d9d9d9] even:bg-[#f3f1f1] sm:px-10 lg:px-[76px]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#444]"><span className="font-semibold text-black">{review.overallRating}/5</span><span className="mx-2" aria-hidden>&middot;</span>{review.professor}{review.authorId === DEMO_USER_ID && <span className="ml-3 text-xs">Your review</span>}</p>
                    {review.authorId === DEMO_USER_ID && (
                      <button type="button" onClick={() => setDialog({ review })} aria-label="Edit your review" title="Edit your review" className="flex size-8 shrink-0 items-center justify-center rounded hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"><Pencil size={16} aria-hidden /></button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-base leading-6">{review.comment}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-[#555]">
                    <span>Difficulty {review.difficulty}/5</span><span>Career relevancy {review.careerRelevance}/5</span><span>Grade leniency {review.gradeLeniency}/5</span><span>Attendance {review.attendanceMandatory ? "mandatory" : "optional"}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : <p className="bg-[#d9d9d9] px-6 py-12 text-[#555]">No reviews yet.</p>}
        </section>
      </main>
      {dialog && <CourseReviewDialog review={dialog.review} professors={course.professors} onSave={saveReview} onDismiss={() => setDialog(null)} />}
    </div>
  );
}
