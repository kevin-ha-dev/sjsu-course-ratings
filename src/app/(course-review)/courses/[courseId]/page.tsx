import { notFound } from "next/navigation";

import { CourseReviewPage } from "@/components/course-review-page";
import { courses } from "@/lib/course-review-data";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = courses.find((item) => item.id === courseId);
  if (!course) notFound();

  return <CourseReviewPage key={course.id} course={course} />;
}
