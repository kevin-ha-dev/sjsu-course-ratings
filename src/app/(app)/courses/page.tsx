import Link from "next/link";

const placeholderCourses = [
  { id: "cs-146", name: "CS 146 — Data Structures and Algorithms" },
  { id: "cs-149", name: "CS 149 — Operating Systems" },
  { id: "cmpe-131", name: "CMPE 131 — Software Engineering I" },
];

export default function CourseOfferingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
        Course offerings
      </h1>
      <p className="mt-4 text-text-secondary">
        Placeholder list of courses. Open one to see professors who teach it.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {placeholderCourses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              {course.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
