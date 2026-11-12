export type ReviewValues = {
  overallRating: number;
  difficulty: number;
  workload: number;
  careerRelevance: number | null;
  attendanceMandatory: boolean | null;
  gradeLeniency: number | null;
  professor: string;
  comment: string;
};

export type CourseReview = ReviewValues & {
  id: string;
  authorId: string;
  createdAt: string;
  editedAt: string | null;
};

export type DashboardReview = {
  id: string;
  createdAt: string;
  editedAt: string | null;
  courseId: string;
  code: string;
  title: string;
  professor: string;
  overall: number;
  difficulty: number;
  workload: number;
  comment: string;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  professors: string[];
};

export const courses: Course[] = [
  {
    id: "cs-160",
    code: "CS 160",
    title: "Software Engineering",
    professors: ["Dominic Abucejo", "Jane Smith"],
  },
  ...[
    ["cs-146", "CS 146", "Data Structures and Algorithms"],
    ["cs-149", "CS 149", "Operating Systems"],
    ["cs-151", "CS 151", "Object-Oriented Design"],
    ["cs-46b", "CS 46B", "Introduction to Data Structures"],
  ].map(([id, code, title]) => ({
    id,
    code,
    title,
    professors: ["Jane Smith"],
  })),
];
