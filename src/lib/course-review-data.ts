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
};

export type DashboardReview = {
  id: string;
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
  reviews: CourseReview[];
};

export const DEMO_USER_ID = "demo-student";

// Local fixtures for the UI draft. Reviews reset when the page is reloaded.
export const courses: Course[] = [
  {
    id: "cs-160",
    code: "CS 160",
    title: "Software Engineering",
    professors: ["Dominic Abucejo", "Jane Smith"],
    reviews: [
      {
        id: "cs-160-1",
        authorId: "student-1",
        overallRating: 5,
        difficulty: 3,
        workload: 3,
        careerRelevance: 5,
        attendanceMandatory: true,
        gradeLeniency: 4,
        professor: "Dominic Abucejo",
        comment:
          "The team project made the concepts click. Start early and keep up with your milestones; the workload is manageable when the team communicates.",
      },
      {
        id: "cs-160-2",
        authorId: DEMO_USER_ID,
        overallRating: 4,
        difficulty: 4,
        workload: 4,
        careerRelevance: 5,
        attendanceMandatory: true,
        gradeLeniency: 3,
        professor: "Dominic Abucejo",
        comment:
          "A useful introduction to building software with a team. The project takes time, but the experience with planning and code reviews is worth it.",
      },
      {
        id: "cs-160-3",
        authorId: "student-2",
        overallRating: 4,
        difficulty: 2,
        workload: 2,
        careerRelevance: 4,
        attendanceMandatory: false,
        gradeLeniency: 4,
        professor: "Jane Smith",
        comment:
          "Clear expectations and practical assignments. Pick a project your group is interested in and leave enough time for testing.",
      },
    ],
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
    reviews: [],
  })),
];
