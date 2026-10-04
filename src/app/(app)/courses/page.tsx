import Link from "next/link";

import { PinCourseButton } from "@/components/pinned-courses";

export type CatalogCourse = {
  code: string;
  title: string;
};

export const lowerDivision: CatalogCourse[] = [
  { code: "CS 22A", title: "Python Programming for Non-Majors" },
  { code: "CS 22B", title: "Python Programming for Non-Majors II" },
  { code: "CS 46A", title: "Introduction to Programming" },
  { code: "CS 46AW", title: "Introduction to Programming Workshop" },
  { code: "CS 46B", title: "Introduction to Data Structures" },
  { code: "CS 47", title: "Introduction to Computer Systems" },
  { code: "CS 48", title: "Data Structures and Algorithms in Python" },
  { code: "CS 49C", title: "Programming in C" },
  { code: "CS 49J", title: "Programming in Java" },
  { code: "CS 85A", title: "Special Topics" },
];

export const upperDivision: CatalogCourse[] = [
  { code: "CS 100W", title: "Technical Writing" },
  { code: "CS 108", title: "Programming and Computing Workshop" },
  { code: "CS 116A", title: "Introduction to Computer Graphics" },
  { code: "CS 116B", title: "Computer Graphics Algorithms" },
  { code: "CS 122", title: "Advanced Programming with Python" },
  { code: "CS 123A", title: "Bioinformatics I" },
  { code: "CS 123B", title: "Bioinformatics II" },
  { code: "CS 131", title: "Processing Big Data" },
  { code: "CS 133", title: "Introduction to Computer Game Design" },
  { code: "CS 134", title: "Computer Game Design and Programming" },
  { code: "CS 136", title: "Introduction to Data Science" },
  { code: "CS 143C", title: "Numerical Analysis and Scientific Computing" },
  { code: "CS 143M", title: "Numerical Analysis and Scientific Computing" },
  { code: "CS 144", title: "Advanced C++ Programming" },
  { code: "CS 146", title: "Data Structures and Algorithms" },
  { code: "CS 147", title: "Computer Architecture" },
  { code: "CS 149", title: "Operating Systems" },
  { code: "CS 151", title: "Object-Oriented Design" },
  { code: "CS 152", title: "Programming Language Paradigms" },
  { code: "CS 153", title: "Concepts of Compiler Design" },
  { code: "CS 154", title: "Formal Languages and Computability" },
  { code: "CS 155", title: "Introduction to the Design and Analysis of Algorithms" },
  { code: "CS 156", title: "Introduction to Artificial Intelligence" },
  { code: "CS 157A", title: "Introduction to Database Management Systems" },
  { code: "CS 157B", title: "Database Management Systems II" },
  { code: "CS 157C", title: "NoSQL Database Systems" },
  { code: "CS 158A", title: "Computer Networks" },
  { code: "CS 158B", title: "Network Management" },
  { code: "CS 159", title: "Introduction to Parallel Processing" },
  { code: "CS 160", title: "Software Engineering" },
  { code: "CS 161", title: "Software Project" },
  { code: "CS 163", title: "Data Visualization" },
  { code: "CS 166", title: "Information Security" },
  { code: "CS 168", title: "Blockchain and Cryptocurrency" },
  { code: "CS 171", title: "Introduction to Machine Learning" },
  { code: "CS 174", title: "Server-Side Web Programming" },
  { code: "CS 175", title: "Mobile Device Development" },
  { code: "CS 176", title: "Topics in Machine Learning" },
  { code: "CS 185C", title: "Special Topics in Computer Science" },
];

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
