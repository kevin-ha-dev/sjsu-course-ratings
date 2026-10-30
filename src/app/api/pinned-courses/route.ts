import { NextResponse } from "next/server";

import { lowerDivision, upperDivision } from "@/lib/course-catalog";
import { accessTokenFrom, createClient } from "@/lib/supabase/server";

const catalogTitles = new Map(
  [...lowerDivision, ...upperDivision].map((course) => [course.code, course.title]),
);

const MAX_BODY_CHARS = 2048;

type CourseRecord = {
  id: number;
  department: string;
  course_number: string;
  title: string;
};

type PinRecord = {
  courses: CourseRecord | CourseRecord[];
};

class PinError extends Error {
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
  const normalized = value.trim().toUpperCase().replace(/-/g, " ").replace(/\s+/g, " ");
  const match = normalized.match(/^([A-Z]+)\s+([A-Z0-9]+)$/);
  if (!match) return null;
  return { department: match[1], courseNumber: match[2] };
}

function toPinnedCourse(course: CourseRecord) {
  const code = `${course.department} ${course.course_number}`;
  return {
    id: code.toLowerCase().replace(/\s+/g, "-"),
    code,
    title: catalogTitles.get(code) ?? course.title,
  };
}

function courseOf(row: PinRecord) {
  return Array.isArray(row.courses) ? row.courses[0] : row.courses;
}

async function readBody(request: Request) {
  const text = await request.text();
  if (!text) return null;
  if (text.length > MAX_BODY_CHARS) throw new PinError("Pin request is too large.", 413);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PinError("The pin request is not valid JSON.", 400);
  }
}

function codeFrom(request: Request, body: unknown) {
  const query = new URL(request.url).searchParams.get("code");
  if (query) return query;
  if (!record(body)) return null;
  if (typeof body.code === "string") return body.code;
  if (typeof body.id === "string") return body.id;
  return null;
}

async function signedInClient(request: Request) {
  const accessToken = accessTokenFrom(request);
  if (!accessToken) throw new PinError("Sign in to pin a course.", 401);

  const supabase = createClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new PinError("Sign in to pin a course.", 401);
  return { supabase, userId: data.user.id };
}

async function findCourse(
  supabase: ReturnType<typeof createClient>,
  code: { department: string; courseNumber: string },
) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, department, course_number, title")
    .ilike("department", code.department)
    .ilike("course_number", code.courseNumber)
    .maybeSingle();

  if (error) throw new PinError("Could not find that course.", 500);
  if (!data || typeof data.id !== "number") throw new PinError("That course was not found.", 404);
  return data as CourseRecord;
}

function databaseMessage(error: { code?: string }) {
  if (error.code === "23503") return "Your account isn't set up to pin courses yet.";
  return "Could not pin that course.";
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof PinError ? error.message : fallback;
  const status = error instanceof PinError ? error.status : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await signedInClient(request);
    const { data, error } = await supabase
      .from("pinned_courses")
      .select("created_at, courses!inner(id, department, course_number, title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw new PinError("Could not load pinned courses.", 500);

    const courses = ((data ?? []) as PinRecord[])
      .map(courseOf)
      .filter((course): course is CourseRecord => Boolean(course?.id))
      .map(toPinnedCourse);

    return NextResponse.json({ courses });
  } catch (error) {
    return errorResponse(error, "Could not load pinned courses.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    const code = parseCourseCode(codeFrom(request, body));
    if (!code) throw new PinError("Provide a course code such as CS 146.", 400);

    const { supabase, userId } = await signedInClient(request);
    const course = await findCourse(supabase, code);
    const { error } = await supabase.from("pinned_courses").insert({
      user_id: userId,
      course_id: course.id,
    });

    if (error && error.code !== "23505") {
      throw new PinError(databaseMessage(error), 500);
    }

    return NextResponse.json({ course: toPinnedCourse(course) }, { status: error ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, "Could not pin that course.");
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readBody(request);
    const code = parseCourseCode(codeFrom(request, body));
    if (!code) throw new PinError("Provide a course code such as CS 146.", 400);

    const { supabase, userId } = await signedInClient(request);
    const course = await findCourse(supabase, code);
    const { error } = await supabase
      .from("pinned_courses")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", course.id);

    if (error) throw new PinError("Could not unpin that course.", 500);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not unpin that course.");
  }
}
