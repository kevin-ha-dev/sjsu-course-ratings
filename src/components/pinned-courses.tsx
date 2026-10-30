"use client";

import { Pin } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

export type PinnedCourse = {
  id: string;
  code: string;
  title: string;
};

type PinnedCoursesContextValue = {
  courses: PinnedCourse[];
  ready: boolean;
  isPinned: (id: string) => boolean;
  toggle: (course: PinnedCourse) => void;
};

const PinnedCoursesContext = createContext<PinnedCoursesContextValue | null>(
  null,
);

function isPinnedCourse(value: unknown): value is PinnedCourse {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "code" in value &&
    "title" in value &&
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.title === "string"
  );
}

async function accessToken() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}

async function loadPins(token: string) {
  const response = await fetch("/api/pinned-courses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await response.json().catch(() => null)) as { courses?: unknown } | null;
  if (!response.ok || !Array.isArray(body?.courses)) return [];
  return body.courses.filter(isPinnedCourse);
}

export function PinnedCoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<PinnedCourse[]>([]);
  const [ready, setReady] = useState(false);
  const coursesRef = useRef(courses);
  const writes = useRef(Promise.resolve());
  coursesRef.current = courses;

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN" && event !== "SIGNED_OUT") {
        return;
      }

      const token = session?.access_token;
      if (!token) {
        coursesRef.current = [];
        setCourses([]);
        setReady(true);
        return;
      }

      void loadPins(token)
        .then((next) => {
          if (cancelled) return;
          coursesRef.current = next;
          setCourses(next);
          setReady(true);
        })
        .catch(() => {
          if (cancelled) return;
          coursesRef.current = [];
          setCourses([]);
          setReady(true);
        });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  function replaceCourses(next: PinnedCourse[]) {
    coursesRef.current = next;
    setCourses(next);
  }

  function isPinned(id: string) {
    return courses.some((course) => course.id === id);
  }

  function toggle(course: PinnedCourse) {
    const shouldPin = !coursesRef.current.some((item) => item.id === course.id);
    replaceCourses(
      shouldPin
        ? [...coursesRef.current, course]
        : coursesRef.current.filter((item) => item.id !== course.id),
    );

    writes.current = writes.current
      .then(async () => {
        try {
          const token = await accessToken();
          if (!token) {
            revert();
            return;
          }

          const response = await fetch("/api/pinned-courses", {
            method: shouldPin ? "POST" : "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: course.code }),
          });

          if (!response.ok) {
            revert();
            return;
          }

          if (!shouldPin) return;
          const body = (await response.json().catch(() => null)) as { course?: unknown } | null;
          const saved = body?.course;
          if (!isPinnedCourse(saved)) return;
          if (!coursesRef.current.some((item) => item.id === course.id)) return;
          replaceCourses(
            coursesRef.current.map((item) => (item.id === course.id ? saved : item)),
          );
        } catch {
          revert();
        }
      })
      .catch(() => {});

    function revert() {
      if (coursesRef.current.some((item) => item.id === course.id) !== shouldPin) return;
      replaceCourses(
        shouldPin
          ? coursesRef.current.filter((item) => item.id !== course.id)
          : [...coursesRef.current, course],
      );
    }
  }

  return (
    <PinnedCoursesContext.Provider value={{ courses, ready, isPinned, toggle }}>
      {children}
    </PinnedCoursesContext.Provider>
  );
}

export function usePinnedCourses() {
  const value = useContext(PinnedCoursesContext);
  if (!value) {
    throw new Error("usePinnedCourses must be used within PinnedCoursesProvider");
  }
  return value;
}

export function PinCourseButton({ course }: { course: PinnedCourse }) {
  const { isPinned, toggle } = usePinnedCourses();
  const pinned = isPinned(course.id);

  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${course.code}` : `Pin ${course.code}`}
      onClick={() => toggle(course)}
      className={`flex items-center justify-center border-l border-border ${
        pinned ? "text-brand" : "text-text-muted hover:text-text-primary"
      }`}
    >
      <Pin className={`size-4 ${pinned ? "fill-current" : ""}`} aria-hidden />
    </button>
  );
}
