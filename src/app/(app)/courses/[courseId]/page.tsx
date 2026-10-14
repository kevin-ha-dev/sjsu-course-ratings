import { notFound } from "next/navigation";

import { CourseReviewPage } from "@/components/course-review-page";
import { courses, type Course } from "@/lib/course-review-data";
import { lowerDivision, upperDivision } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

function courseFromCatalog(courseId: string): Course | null {
  const listed = [...lowerDivision, ...upperDivision].find(
    (item) => item.code.toLowerCase().replace(/\s+/g, "-") === courseId,
  );
  if (!listed) return null;

  return {
    id: courseId,
    code: listed.code,
    title: listed.title,
    professors: [],
    reviews: [],
  };
}

function courseCodeParts(code: string) {
  const match = code.trim().toUpperCase().match(/^([A-Z]+)\s+([A-Z0-9]+)$/);
  if (!match) return null;
  return { department: match[1], courseNumber: match[2] };
}

async function professorsForCourse(code: string) {
  const parts = courseCodeParts(code);
  if (!parts) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("course_offerings")
    .select("professors!inner(name), courses!inner(department, course_number)")
    .ilike("courses.department", parts.department)
    .ilike("courses.course_number", parts.courseNumber);

  if (error) {
    throw new Error(error.message);
  }

  const names = new Set<string>();
  for (const row of data ?? []) {
    const professor = Array.isArray(row.professors) ? row.professors[0] : row.professors;
    if (typeof professor?.name === "string" && professor.name.trim()) {
      names.add(professor.name.trim());
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = courses.find((item) => item.id === courseId) ?? courseFromCatalog(courseId);
  if (!course) notFound();

  const professors = await professorsForCourse(course.code);

  return <CourseReviewPage key={course.id} course={{ ...course, professors }} />;
}
