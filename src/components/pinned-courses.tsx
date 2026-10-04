"use client";

import { Pin } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "pinned-courses";

export type PinnedCourse = {
  id: string;
  code: string;
  title: string;
};

type PinnedCoursesContextValue = {
  courses: PinnedCourse[];
  isPinned: (id: string) => boolean;
  toggle: (course: PinnedCourse) => void;
};

const PinnedCoursesContext = createContext<PinnedCoursesContextValue | null>(
  null,
);

function readPinnedCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is PinnedCourse =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "code" in item &&
        "title" in item &&
        typeof item.id === "string" &&
        typeof item.code === "string" &&
        typeof item.title === "string",
    );
  } catch {
    return [];
  }
}

export function PinnedCoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<PinnedCourse[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCourses(readPinnedCourses());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses, ready]);

  function isPinned(id: string) {
    return courses.some((course) => course.id === id);
  }

  function toggle(course: PinnedCourse) {
    setCourses((current) =>
      current.some((item) => item.id === course.id)
        ? current.filter((item) => item.id !== course.id)
        : [...current, course],
    );
  }

  return (
    <PinnedCoursesContext.Provider value={{ courses, isPinned, toggle }}>
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
