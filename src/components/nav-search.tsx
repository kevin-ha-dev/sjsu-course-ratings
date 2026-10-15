"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BackButton } from "@/components/back-button";
import { lowerDivision, upperDivision, type CatalogCourse } from "@/lib/course-catalog";

const courses: CatalogCourse[] = [...lowerDivision, ...upperDivision];

function courseId(code: string) {
  return code.toLowerCase().replace(/\s+/g, "-");
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function NavSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const trimmed = query.trim();

  const results = useMemo(() => {
    const needle = normalize(trimmed);
    if (!needle) return [];
    return courses.filter(
      (course) =>
        normalize(course.code).includes(needle) ||
        normalize(course.title).includes(needle),
    );
  }, [trimmed]);

  return (
    <form
      role="search"
      className="relative ml-11 w-[28rem] max-w-[calc(100%-2.75rem)]"
      onSubmit={(event) => event.preventDefault()}
    >
      <BackButton />
      <div className="relative w-full">
        <label htmlFor="nav-search" className="sr-only">
          Search courses
        </label>
        <input
          id="nav-search"
          type="search"
          role="combobox"
          aria-expanded={open && trimmed.length > 0}
          aria-controls="nav-search-results"
          aria-autocomplete="list"
          placeholder="Search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="h-9 w-full rounded-full border border-border bg-surface px-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {open && trimmed ? (
          <ul
            id="nav-search-results"
            role="listbox"
            className="absolute top-[calc(100%+0.5rem)] z-20 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-text-muted">No matching courses</li>
            ) : (
              results.map((course) => (
                <li key={course.code} role="option">
                  <Link
                    href={`/courses/${courseId(course.code)}`}
                    onClick={() => {
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex items-baseline gap-3 px-4 py-2.5 text-sm hover:bg-surface-muted"
                  >
                    <span className="shrink-0 font-medium tracking-[0.04em] text-text-primary">
                      {course.code}
                    </span>
                    <span className="min-w-0 truncate text-text-secondary">{course.title}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </form>
  );
}
