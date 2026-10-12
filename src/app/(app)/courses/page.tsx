import Link from "next/link";

import { PinCourseButton } from "@/components/pinned-courses";
import { lowerDivision, upperDivision, type CatalogCourse } from "@/lib/course-catalog";

function courseId(code: string) {
  return code.toLowerCase().replace(/\s+/g, "-");
}

const catalogColumns =
  "grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] sm:grid-cols-[8.75rem_minmax(0,1fr)_2.5rem]";

function CatalogHeading() {
  return (
    <div
      className={`${catalogColumns} text-xs font-medium tracking-[0.18em] text-text-muted uppercase`}
    >
      <div className="border-r border-border px-4 py-3 sm:px-6">Course</div>
      <div className="px-4 py-3 sm:px-6">Subject</div>
      <div className="border-l border-border" aria-hidden />
    </div>
  );
}

function CourseCatalog({ courses }: { courses: CatalogCourse[] }) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
        <CatalogHeading />
        <div className="hidden border-l border-border lg:block">
          <CatalogHeading />
        </div>
      </div>
      <ul className="grid grid-cols-1 lg:grid-cols-2">
        {courses.map((course) => (
          <li
            key={course.code}
            className={`${catalogColumns} border-b border-border lg:odd:border-r lg:last:border-r-0`}
          >
            <Link
              href={`/courses/${courseId(course.code)}`}
              className="col-span-2 grid grid-cols-subgrid hover:bg-surface"
            >
              <span className="border-r border-border px-4 py-3.5 text-sm font-medium tracking-[0.04em] text-text-primary sm:px-6">
                {course.code}
              </span>
              <span className="min-w-0 px-4 py-3.5 text-sm text-text-primary sm:px-6">
                {course.title}
              </span>
            </Link>
            <PinCourseButton
              course={{
                id: courseId(course.code),
                code: course.code,
                title: course.title,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CourseOfferingsPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="border-b border-border px-6 py-8">
        <p className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase">
          Computer Science
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-text-primary">
          Course offerings
        </h1>
      </header>
      <section aria-labelledby="lower-division">
        <h2
          id="lower-division"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-secondary uppercase"
        >
          Lower-division CS courses
        </h2>
        <CourseCatalog courses={lowerDivision} />
      </section>
      <section aria-labelledby="upper-division">
        <h2
          id="upper-division"
          className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-secondary uppercase"
        >
          Upper-division CS courses
        </h2>
        <CourseCatalog courses={upperDivision} />
      </section>
    </main>
  );
}
