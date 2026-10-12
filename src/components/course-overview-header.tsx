"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { lowerDivision, upperDivision } from "@/lib/course-catalog";
import { courses } from "@/lib/course-review-data";

const searchCourses = Array.from(
  new Map([...lowerDivision, ...upperDivision, ...courses].map((course) => [course.code, course])).values(),
);

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[-\s]+/g, " ");
}

export function CourseOverviewHeader({ courseCode }: { courseCode: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(courseCode);
  const [error, setError] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = normalize(query);
    if (!term) {
      setError("Enter a course name or number.");
      return;
    }

    const exact = searchCourses.filter((course) =>
      normalize(course.code).replaceAll(" ", "") === term.replaceAll(" ", "") || normalize(course.title) === term,
    );
    const matches = exact.length ? exact : searchCourses.filter((course) => normalize(`${course.code} ${course.title}`).includes(term));
    const match = matches.length === 1 ? matches[0] : null;

    if (!match) {
      setError(matches.length ? "Choose a course number from the suggestions." : "No matching courses. Try another name or number.");
      return;
    }

    setError("");
    setQuery(match.code);
    router.push(`/courses/${match.code.toLowerCase().replace(/\s+/g, "-")}`);
  }

  return (
    <header className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-8 gap-y-3 bg-brand px-5 py-3 text-white sm:px-8 md:grid-cols-[auto_minmax(0,360px)_1fr]">
      <Link href="/courses" className="min-w-0 text-base leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-lg">
        <span className="font-bold">SJSU</span> Course Ratings
      </Link>
      <form role="search" onSubmit={search} className="relative col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
        <label htmlFor="course-search" className="sr-only">Search courses</label>
        <div className="flex h-9 items-center rounded-md bg-white text-text-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white">
          <button type="submit" aria-label="Search courses" title="Search courses" className="flex size-9 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-black">
            <Search size={16} aria-hidden />
          </button>
          <input
            id="course-search"
            type="search"
            list="overview-courses"
            autoComplete="off"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setError(""); }}
            placeholder="Search courses"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "course-search-error" : undefined}
            className="min-w-0 flex-1 rounded-r-md bg-transparent pr-3 text-base outline-none placeholder:text-text-muted md:text-sm"
          />
          <datalist id="overview-courses">
            {searchCourses.map((course) => <option key={course.code} value={course.code}>{course.title}</option>)}
          </datalist>
        </div>
        {error && <p id="course-search-error" role="alert" className="absolute top-full z-10 mt-2 w-full rounded border border-border bg-white px-3 py-2 text-sm text-error shadow-sm">{error}</p>}
      </form>
      <Link href="/login" className="col-start-2 row-start-1 justify-self-end whitespace-nowrap text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 md:col-start-3">Log In</Link>
    </header>
  );
}
