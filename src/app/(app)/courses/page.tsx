import { CourseOfferings, type Offering } from "@/components/course-offerings";
import { lowerDivision, upperDivision } from "@/lib/course-catalog";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  department: string;
  course_number: string;
  title: string;
};

function courseNumberValue(courseNumber: string) {
  const match = /^(\d+)(.*)$/.exec(courseNumber);
  return {
    number: match ? Number(match[1]) : Number.POSITIVE_INFINITY,
    suffix: match?.[2] ?? courseNumber,
  };
}

const catalogTitles = new Map(
  [...lowerDivision, ...upperDivision].map((course) => [course.code, course.title]),
);

const hiddenCourses = new Set(["ART 108", "CS 190", "CS 190I"]);

export default async function CourseOfferingsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("department, course_number, title");

  if (error) {
    throw new Error(error.message);
  }

  const courses: Offering[] = (data ?? [])
    .map((course: CourseRow) => {
      const code = `${course.department} ${course.course_number}`;
      const parsed = courseNumberValue(course.course_number);
      return {
        code,
        title: catalogTitles.get(code) ?? course.title,
        number: parsed.number,
        suffix: parsed.suffix,
        department: course.department,
      };
    })
    .sort((left, right) => {
      if (left.department !== right.department) {
        return left.department.localeCompare(right.department);
      }
      if (left.number !== right.number) {
        return left.number - right.number;
      }
      return left.suffix.localeCompare(right.suffix);
    })
    .filter((course) => !hiddenCourses.has(course.code));

  return <CourseOfferings courses={courses} />;
}
