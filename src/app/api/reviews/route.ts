import { NextResponse } from "next/server";

import type { CourseReview, DashboardReview } from "@/lib/course-review-data";
import { accessTokenFrom, createClient } from "@/lib/supabase/server";

const MAX_BODY_CHARS = 16_384;
const reviewSelect = `
  id,
  user_id,
  overall_rating,
  difficulty_rating,
  workload_rating,
  career_relevance,
  grade_leniency,
  attendance_mandatory,
  comment,
  course_offerings!inner ( professors!inner ( name ) )
`;

type CourseRecord = {
  department: string;
  course_number: string;
  title: string;
};

type OfferingRecord = {
  professors: { name: string } | { name: string }[];
  courses?: CourseRecord | CourseRecord[];
};

type ReviewRecord = {
  id: number;
  user_id: string;
  overall_rating: number | string;
  difficulty_rating: number;
  workload_rating: number;
  career_relevance: number | null;
  grade_leniency: number | null;
  attendance_mandatory: boolean | null;
  comment: string | null;
  course_offerings: OfferingRecord | OfferingRecord[];
};

class ReviewError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCourseCode(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.trim().toUpperCase().match(/^([A-Z]+)\s+([A-Z0-9]+)$/);
  if (!match) return null;
  return { department: match[1], courseNumber: match[2] };
}

function rating(value: unknown, optional = false, overall = false) {
  if (optional && value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < (overall ? 0.5 : 1) || value > 5 || !Number.isInteger(value * (overall ? 2 : 1))) {
    throw new ReviewError(overall ? "Choose a rating from 0.5 to 5 stars." : "Choose a rating from 1 to 5.", 400);
  }
  return value;
}

function parseReview(body: unknown) {
  if (!record(body)) throw new ReviewError("The review request is not valid JSON.", 400);

  const course = parseCourseCode(body.courseCode);
  if (!course) throw new ReviewError("Provide a course code such as CS 146.", 400);

  const professor = typeof body.professor === "string" ? body.professor.trim() : "";
  if (!professor || professor.length > 200) throw new ReviewError("Choose a professor.", 400);

  const comment = typeof body.comment === "string" ? body.comment.trim() : null;
  if (comment === null || comment.length > 4000) throw new ReviewError("Keep your review to 4,000 characters or fewer.", 400);
  if (body.attendanceMandatory != null && typeof body.attendanceMandatory !== "boolean") {
    throw new ReviewError("Choose Yes or No for attendance.", 400);
  }

  const courseTitle = typeof body.courseTitle === "string" ? body.courseTitle.trim().slice(0, 200) : "";

  return {
    course,
    courseTitle,
    professor,
    overallRating: rating(body.overallRating, false, true),
    difficulty: rating(body.difficulty),
    workload: rating(body.workload),
    careerRelevance: rating(body.careerRelevance, true),
    gradeLeniency: rating(body.gradeLeniency, true),
    attendanceMandatory: body.attendanceMandatory ?? null,
    comment,
  };
}

function offeringOf(row: ReviewRecord) {
  return Array.isArray(row.course_offerings) ? row.course_offerings[0] : row.course_offerings;
}

function professorName(row: ReviewRecord) {
  const professor = offeringOf(row)?.professors;
  const record = Array.isArray(professor) ? professor[0] : professor;
  return record?.name ?? "";
}

function courseOf(row: ReviewRecord) {
  const course = offeringOf(row)?.courses;
  const record = Array.isArray(course) ? course[0] : course;
  const code = `${record?.department ?? ""} ${record?.course_number ?? ""}`.trim();
  return {
    courseId: code.toLowerCase().replace(/\s+/g, "-"),
    code,
    title: record?.title ?? "",
  };
}

function toDashboardReview(row: ReviewRecord): DashboardReview {
  return {
    id: String(row.id),
    ...courseOf(row),
    professor: professorName(row),
    overall: Number(row.overall_rating),
    difficulty: row.difficulty_rating,
    workload: row.workload_rating,
    comment: row.comment ?? "",
  };
}

function toReview(row: ReviewRecord): CourseReview {
  return {
    id: String(row.id),
    authorId: row.user_id,
    overallRating: Number(row.overall_rating),
    difficulty: row.difficulty_rating,
    workload: row.workload_rating,
    careerRelevance: row.career_relevance,
    gradeLeniency: row.grade_leniency,
    attendanceMandatory: row.attendance_mandatory,
    professor: professorName(row),
    comment: row.comment ?? "",
  };
}

function databaseMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "You already reviewed this class with that professor.";
  if (error.code === "23514") return "One or more ratings are outside the allowed range.";
  if (error.code === "23503" && error.message?.includes("reviews_user_id_fkey")) {
    return "Your account isn't set up to post reviews yet.";
  }
  if (error.code === "23503") return "That course offering is no longer available.";
  return "Could not save your review.";
}

async function readBody(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) throw new ReviewError("Review is too large.", 413);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ReviewError("The review request is not valid JSON.", 400);
  }
}

async function signedInClient(request: Request) {
  const accessToken = accessTokenFrom(request);
  if (!accessToken) throw new ReviewError("Sign in to submit a review.", 401);

  const supabase = createClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new ReviewError("Sign in to submit a review.", 401);
  return { supabase, userId: data.user.id };
}

async function offeringId(supabase: ReturnType<typeof createClient>, course: { department: string; courseNumber: string }, professor: string) {
  const { data, error } = await supabase
    .from("course_offerings")
    .select("id, professors!inner(name), courses!inner(department, course_number)")
    .eq("professors.name", professor)
    .ilike("courses.department", course.department)
    .ilike("courses.course_number", course.courseNumber)
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw new ReviewError("Could not find that course offering.", 500);
  const id = data?.[0]?.id;
  if (typeof id !== "number") {
    throw new ReviewError(`No course offering was found for ${professor} in ${course.department} ${course.courseNumber}.`, 404);
  }
  return id;
}

function reviewColumns(values: ReturnType<typeof parseReview>, courseOfferingId: number) {
  return {
    course_offering_id: courseOfferingId,
    overall_rating: values.overallRating,
    difficulty_rating: values.difficulty,
    workload_rating: values.workload,
    career_relevance: values.careerRelevance,
    grade_leniency: values.gradeLeniency,
    attendance_mandatory: values.attendanceMandatory,
    comment: values.comment.length ? values.comment : null,
  };
}

const userReviewSelect = `
  id,
  user_id,
  overall_rating,
  difficulty_rating,
  workload_rating,
  comment,
  course_offerings!inner (
    professors!inner ( name ),
    courses!inner ( department, course_number, title )
  )
`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("mine") === "1") {
      const { supabase, userId } = await signedInClient(request);
      const { data, error } = await supabase
        .from("reviews")
        .select(userReviewSelect)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw new ReviewError("Could not load reviews.", 500);
      return NextResponse.json({ reviews: ((data ?? []) as ReviewRecord[]).map(toDashboardReview) });
    }

    const course = parseCourseCode(url.searchParams.get("course"));
    if (!course) throw new ReviewError("Provide a course code such as CS 146.", 400);

    const supabase = createClient();
    const { data: offerings, error } = await supabase
      .from("course_offerings")
      .select("id, courses!inner(department, course_number)")
      .ilike("courses.department", course.department)
      .ilike("courses.course_number", course.courseNumber);

    if (error) throw new ReviewError("Could not load reviews.", 500);
    const ids = (offerings ?? []).map((offering) => offering.id).filter((id): id is number => typeof id === "number");
    if (!ids.length) return NextResponse.json({ reviews: [] });

    const { data, error: reviewError } = await supabase
      .from("reviews")
      .select(reviewSelect)
      .in("course_offering_id", ids)
      .order("created_at", { ascending: false });

    if (reviewError) throw new ReviewError("Could not load reviews.", 500);
    return NextResponse.json({ reviews: ((data ?? []) as ReviewRecord[]).map(toReview) });
  } catch (error) {
    const message = error instanceof ReviewError ? error.message : "Could not load reviews.";
    const status = error instanceof ReviewError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const values = parseReview(await readBody(request));
    const { supabase } = await signedInClient(request);
    const { data: reviewId, error } = await supabase.rpc("create_review", {
      p_department: values.course.department,
      p_course_number: values.course.courseNumber,
      p_title: values.courseTitle,
      p_professor: values.professor,
      p_overall: values.overallRating,
      p_difficulty: values.difficulty,
      p_workload: values.workload,
      p_career: values.careerRelevance,
      p_leniency: values.gradeLeniency,
      p_attendance: values.attendanceMandatory,
      p_comment: values.comment,
    });

    if (error || typeof reviewId !== "number") {
      throw new ReviewError(error ? databaseMessage(error) : "Could not save your review.", error?.code === "23505" ? 409 : 500);
    }

    const { data, error: readError } = await supabase.from("reviews").select(reviewSelect).eq("id", reviewId).single();
    if (readError || !data) throw new ReviewError("Could not save your review.", 500);
    return NextResponse.json({ review: toReview(data as ReviewRecord) }, { status: 201 });
  } catch (error) {
    const message = error instanceof ReviewError ? error.message : "Could not save your review.";
    const status = error instanceof ReviewError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readBody(request);
    const values = parseReview(body);
    const id = record(body) ? body.id : null;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) throw new ReviewError("Choose a review to update.", 400);

    const { supabase } = await signedInClient(request);
    const courseOfferingId = await offeringId(supabase, values.course, values.professor);
    const { data, error } = await supabase
      .from("reviews")
      .update(reviewColumns(values, courseOfferingId))
      .eq("id", id)
      .select(reviewSelect)
      .maybeSingle();

    if (error) throw new ReviewError(databaseMessage(error), error.code === "23505" ? 409 : 500);
    if (!data) throw new ReviewError("Review not found.", 404);
    return NextResponse.json({ review: toReview(data as ReviewRecord) });
  } catch (error) {
    const message = error instanceof ReviewError ? error.message : "Could not save your review.";
    const status = error instanceof ReviewError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
