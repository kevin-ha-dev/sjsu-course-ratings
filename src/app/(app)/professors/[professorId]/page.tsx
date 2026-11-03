import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseReviewItem } from "@/components/course-review-item";
import { StarRating } from "@/components/star-rating";
import type { CourseReview } from "@/lib/course-review-data";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  department: string;
  course_number: string;
};

type ReviewRow = {
  id: number;
  overall_rating: number | string;
  difficulty_rating: number;
  workload_rating: number;
  career_relevance: number | null;
  grade_leniency: number | null;
  attendance_mandatory: boolean | null;
  comment: string | null;
  created_at: string;
};

type OfferingRow = {
  courses: CourseRow | CourseRow[] | null;
  reviews: ReviewRow[];
};

type ProfileReview = CourseReview & {
  courseCode: string;
  courseHref: string | null;
  createdAt: string;
};

function courseInfo(course: CourseRow) {
  const code = `${course.department} ${course.course_number}`;

  return {
    code,
    href: `/courses/${code.toLowerCase().replace(/\s+/g, "-")}`,
  };
}

export default async function ProfessorProfilePage({
  params,
}: {
  params: Promise<{ professorId: string }>;
}) {
  const { professorId } = await params;

  if (!/^[1-9]\d*$/.test(professorId)) {
    notFound();
  }

  const supabase = createClient();

  const { data: professor, error: professorError } = await supabase
    .from("professors")
    .select("id, name")
    .eq("id", professorId)
    .maybeSingle();

  if (professorError) {
    throw new Error("Could not load this professor.");
  }

  if (!professor) {
    notFound();
  }

  const { data: offerings, error: offeringsError } = await supabase
    .from("course_offerings")
    .select(`
      courses ( department, course_number ),
      reviews (
        id,
        overall_rating,
        difficulty_rating,
        workload_rating,
        career_relevance,
        grade_leniency,
        attendance_mandatory,
        comment,
        created_at
      )
    `)
    .eq("professor_id", professorId);

  if (offeringsError) {
    throw new Error("Could not load this professor's courses and reviews.");
  }

  const courses = new Map<string, { code: string; href: string }>();
  const reviews: ProfileReview[] = [];

  for (const offering of (offerings ?? []) as unknown as OfferingRow[]) {
    const course = Array.isArray(offering.courses)
      ? offering.courses[0]
      : offering.courses;

    const info = course ? courseInfo(course) : null;

    if (info) {
      courses.set(info.code, info);
    }

    for (const row of offering.reviews ?? []) {
      reviews.push({
        id: String(row.id),
        authorId: "",
        professor: professor.name,
        overallRating: Number(row.overall_rating),
        difficulty: row.difficulty_rating,
        workload: row.workload_rating,
        careerRelevance: row.career_relevance,
        gradeLeniency: row.grade_leniency,
        attendanceMandatory: row.attendance_mandatory,
        comment: row.comment ?? "",
        courseCode: info?.code ?? "Course unavailable",
        courseHref: info?.href ?? null,
        createdAt: row.created_at,
      });
    }
  }

  reviews.sort(
    (left, right) =>
      Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );

  const courseList = [...courses.values()].sort((left, right) =>
    left.code.localeCompare(right.code, undefined, { numeric: true })
  );

  const validRatings = reviews
    .map((review) => review.overallRating)
    .filter(
      (rating) =>
        Number.isFinite(rating) && rating >= 0.5 && rating <= 5
    );

  const average = validRatings.length
    ? validRatings.reduce((sum, rating) => sum + rating, 0) /
      validRatings.length
    : null;

  const averageMetric = (
    field: "difficulty" | "workload" | "careerRelevance" | "gradeLeniency"
  ) => {
    const values = reviews
      .map((review) => review[field])
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value) &&
          value >= 1 &&
          value <= 5
      );

    return values.length
      ? `${(
          values.reduce((sum, value) => sum + value, 0) / values.length
        ).toFixed(1)} / 5`
      : "Not rated";
  };

  const metrics = [
    { label: "Difficulty", value: averageMetric("difficulty") },
    { label: "Workload", value: averageMetric("workload") },
    { label: "Career relevancy", value: averageMetric("careerRelevance") },
    { label: "Grade leniency", value: averageMetric("gradeLeniency") },
  ];

  return (
    <main className="flex-1 bg-white px-6 py-8 text-text-primary sm:px-10 lg:px-12">
      <Link
        href="/professors"
        className="text-sm text-text-muted underline underline-offset-4"
      >
        Back to professors
      </Link>

      <header className="mt-6">
        <p className="mb-1 text-sm text-text-muted">
          Professor information
        </p>

        <h1 className="break-words text-[30px] font-semibold">
          {professor.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-lg font-semibold">
            {average === null ? "Not rated" : average.toFixed(1)}
          </span>

          <StarRating value={average} />

          <span className="text-text-muted">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        <p className="mt-2 text-xs text-text-muted">
          Ratings reflect course reviews associated with this professor.
        </p>
      </header>

      <section
        aria-labelledby="rating-details-heading"
        className="mt-6 border-y border-border py-5"
      >
        <h2
          id="rating-details-heading"
          className="text-lg font-semibold"
        >
          Rating details
        </h2>

        <dl className="mt-4 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-text-muted">
                {metric.label}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="courses-heading"
        className="mt-6"
      >
        <h2 id="courses-heading" className="text-lg font-semibold">
          Courses taught
        </h2>

        {courseList.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {courseList.map((course) => (
              <li key={course.code}>
                <Link
                  href={course.href}
                  className="inline-block rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {course.code}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted">
            No courses listed.
          </p>
        )}
      </section>

      <section
        aria-labelledby="reviews-heading"
        className="mt-8"
      >
        <h2 id="reviews-heading" className="text-lg font-semibold">
          Student reviews
          <span className="ml-2 text-sm font-normal text-text-muted">
            {reviews.length}
          </span>
        </h2>

        {reviews.length > 0 ? (
          <ul aria-label="Professor reviews" className="mt-3">
            {reviews.map((review) => (
              <CourseReviewItem
                key={review.id}
                review={review}
                courseLabel={review.courseCode}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 border-b border-border py-6 text-sm text-text-muted">
            No reviews yet.
          </p>
        )}
      </section>
    </main>
  );
}