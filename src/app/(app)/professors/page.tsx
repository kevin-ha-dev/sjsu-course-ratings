"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronRight, Search } from "lucide-react";

type Professor = {
  id: string;
  name: string;
  courses: string[];
  rating: number | null;
  reviewCount: number;
};

type ProfessorRow = {
  id: number;
  name: string;
  course_offerings: {
    courses:
      | { department: string; course_number: string }
      | { department: string; course_number: string }[]
      | null;
    reviews: { overall_rating: number | string }[];
  }[];
};

export default function ProfessorsPage() {
  const [search, setSearch] = useState("");
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfessors() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("professors")
          .select(`
            id,
            name,
            course_offerings (
              courses ( department, course_number ),
              reviews ( overall_rating )
            )
          `)
          .order("name");

        if (error) throw error;

        const rows = (data ?? []) as unknown as ProfessorRow[];

        const loaded = rows.map((professor): Professor => {
          const courseCodes = new Set<string>();
          const ratings: number[] = [];

          for (const offering of professor.course_offerings ?? []) {
            const course = Array.isArray(offering.courses)
              ? offering.courses[0]
              : offering.courses;

            if (course) {
              courseCodes.add(
                `${course.department} ${course.course_number}`
              );
            }

            for (const review of offering.reviews ?? []) {
              const rating = Number(review.overall_rating);

              if (
                Number.isFinite(rating) &&
                rating >= 0.5 &&
                rating <= 5
              ) {
                ratings.push(rating);
              }
            }
          }

          return {
            id: String(professor.id),
            name: professor.name,
            courses: [...courseCodes].sort(),
            reviewCount: ratings.length,
            rating: ratings.length
              ? ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              : null,
          };
        });

        if (!cancelled) setProfessors(loaded);
      } catch {
        if (!cancelled) {
          setError("Could not load professors. Please refresh to try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfessors();

    return () => {
      cancelled = true;
    };
  }, []);

  const query = search.trim().toLowerCase();

  const filtered = professors.filter((professor) =>
    [professor.name, ...professor.courses].some((value) =>
      value.toLowerCase().includes(query)
    )
  );

  return (
    <main className="flex-1 bg-white px-6 py-8 text-text-primary sm:px-10 lg:px-12">
      <header className="mb-8">
        <p className="mb-1 text-sm text-text-muted">
          SJSU Course Ratings
        </p>
        <h1 className="text-[30px] font-semibold">
          Professor information
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Explore professors, courses taught, and student reviews.
        </p>
      </header>

      <section aria-labelledby="professors-heading">
        <label
          htmlFor="professor-search"
          className="mb-2 block text-sm font-medium"
        >
          Find a professor
        </label>

        <div className="relative mb-6 max-w-lg">
          <Search
            className="absolute left-3 top-3 size-4 text-text-muted"
            aria-hidden
          />
          <input
            id="professor-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or course"
            className="min-h-10 w-full rounded-md border border-border py-2 pl-10 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>

        <div className="mb-3 flex items-baseline gap-2">
          <h2
            id="professors-heading"
            className="text-lg font-semibold"
          >
            Professors
          </h2>
          <span role="status" className="text-sm text-text-muted">
            {loading ? "Loading..." : error ? "Unavailable" : (
              <>
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </>
            )}
          </span>
        </div>
{loading && (
  <p role="status" className="py-6 text-sm text-text-muted">
    Loading professors...
  </p>
)}

{error && (
  <p role="alert" className="py-6 text-sm text-error">
    {error}
  </p>
)}
        <ul className="border-t border-border">
          {filtered.map((professor) => (
            <li
              key={professor.id}
              className="border-b border-border"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <h3 className="font-semibold">
                    <Link
                      href={`/professors/${professor.id}`}
                      className="rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      {professor.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">
                    {professor.courses.length > 0
                      ? professor.courses.join(" · ")
                      : "No courses listed"}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="font-semibold">
                    {professor.rating === null
                      ? "Not rated"
                      : `${professor.rating.toFixed(1)} / 5`}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {professor.reviewCount} reviews
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!loading && !error && filtered.length === 0 && (
          <p className="py-10 text-sm text-text-muted">
            No professors match your search. Try another name or course.
          </p>
        )}
      </section>

      <Link
        href="/courses"
        className="mt-6 inline-flex items-center gap-1 text-sm underline underline-offset-4"
      >
        Browse course offerings
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </main>
  );
}