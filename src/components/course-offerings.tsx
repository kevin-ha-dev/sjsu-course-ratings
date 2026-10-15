"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { PinCourseButton } from "@/components/pinned-courses";

export type Offering = {
  code: string;
  title: string;
  number: number;
  suffix: string;
  department: string;
};

const catalogColumns =
  "grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] sm:grid-cols-[8.75rem_minmax(0,1fr)_2.5rem]";

const selectClassName =
  "h-9 appearance-none rounded-md border border-border bg-surface py-0 pr-8 pl-3 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function courseId(code: string) {
  return code.toLowerCase().replace(/\s+/g, "-");
}

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

function CourseCatalog({ courses }: { courses: Offering[] }) {
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

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </div>
  );
}

export function CourseOfferings({ courses }: { courses: Offering[] }) {
  const [level, setLevel] = useState("all");
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState("code");

  const departments = useMemo(
    () => [...new Set(courses.map((course) => course.department))].sort(),
    [courses],
  );

  const visible = useMemo(() => {
    const filtered = courses.filter((course) => {
      if (department !== "all" && course.department !== department) return false;
      if (level === "lower") return course.number < 100;
      if (level === "upper") return course.number >= 100 && course.number < 200;
      return true;
    });

    return [...filtered].sort((left, right) => {
      if (sort === "title") {
        const byTitle = left.title.localeCompare(right.title);
        if (byTitle !== 0) return byTitle;
      }
      if (left.department !== right.department) {
        return left.department.localeCompare(right.department);
      }
      if (left.number !== right.number) return left.number - right.number;
      return left.suffix.localeCompare(right.suffix);
    });
  }, [courses, department, level, sort]);

  const groups = [
    {
      id: "lower-division",
      label: "Lower-division CS courses",
      courses: visible.filter((course) => course.number < 100),
    },
    {
      id: "upper-division",
      label: "Upper-division CS courses",
      courses: visible.filter((course) => course.number >= 100 && course.number < 200),
    },
  ].filter((group) => group.courses.length > 0);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="border-b border-border px-6 py-8">
        <p className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase">
          Computer Science
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-text-primary">
          Course offerings
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <FilterSelect id="offering-level" label="Level" value={level} onChange={setLevel}>
            <option value="all">All levels</option>
            <option value="lower">Lower-division</option>
            <option value="upper">Upper-division</option>
          </FilterSelect>
          <FilterSelect
            id="offering-department"
            label="Department"
            value={department}
            onChange={setDepartment}
          >
            <option value="all">All departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="offering-sort" label="Sort" value={sort} onChange={setSort}>
            <option value="code">Sort by course code</option>
            <option value="title">Sort by course name</option>
          </FilterSelect>
        </div>
      </header>
      {groups.length === 0 ? (
        <p className="px-6 py-8 text-sm text-text-muted">No courses match these filters.</p>
      ) : (
        groups.map((group) => (
          <section key={group.id} aria-labelledby={group.id}>
            <h2
              id={group.id}
              className="border-b border-border px-6 py-4 text-xs font-medium tracking-[0.18em] text-text-secondary uppercase"
            >
              {group.label}
            </h2>
            <CourseCatalog courses={group.courses} />
          </section>
        ))
      )}
    </main>
  );
}
