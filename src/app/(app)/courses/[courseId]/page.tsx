import { notFound } from "next/navigation";

import { CourseReviewPage } from "@/components/course-review-page";
import { courses, type Course } from "@/lib/course-review-data";
import { lowerDivision, upperDivision } from "../page";

function courseFromCatalog(courseId: string): Course | null {
  const listed = [...lowerDivision, ...upperDivision].find(
    (item) => item.code.toLowerCase().replace(/\s+/g, "-") === courseId,
  );
  if (!listed) return null;

  return {
    id: courseId,
    code: listed.code,
    title: listed.title,
    professors: ["Jane Smith"],
    reviews: [],
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = courses.find((item) => item.id === courseId) ?? courseFromCatalog(courseId);
  if (!course) notFound();

  return <CourseReviewPage key={course.id} course={course} />;
}
