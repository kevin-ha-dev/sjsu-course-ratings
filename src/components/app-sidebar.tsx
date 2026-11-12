"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Pin,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { usePinnedCourses } from "@/components/pinned-courses";

const title = "SJSU Course Ratings";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Course offerings", icon: BookOpen },
  { href: "/professors", label: "Professors", icon: Users },
  { href: "/community", label: "Community", icon: Users },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia("(max-width: 639px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isCompactViewport() {
  return window.matchMedia("(max-width: 639px)").matches;
}

export function AppSidebar() {
  const pathname = usePathname();
  const compactViewport = useSyncExternalStore(subscribeToViewport, isCompactViewport, () => false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const collapsed = compactViewport ? !mobileExpanded : desktopCollapsed;
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const { courses: pinnedCourses, ready: pinsReady } = usePinnedCourses();

  return (
    <>
    {compactViewport && mobileExpanded && (
      <>
        <div className="w-16 shrink-0" aria-hidden />
        <button type="button" aria-label="Close navigation" onClick={() => setMobileExpanded(false)} className="fixed inset-0 z-30 bg-black/40" />
      </>
    )}
    <aside
      onKeyDown={(event) => { if (event.key === "Escape") setMobileExpanded(false); }}
      className={`flex shrink-0 flex-col border-r border-border bg-[#000000] transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      } ${compactViewport ? mobileExpanded ? "fixed inset-y-0 left-0 z-40" : "sticky top-0 h-dvh self-start" : ""}`}
    >
      <div className="flex items-center border-b border-[#555555] px-3 py-5">
        {collapsed ? (
          <span
            className="flex size-9 w-full items-center justify-center text-xs font-semibold text-white"
            title={title}
          >
            CS
          </span>
        ) : (
          <div className="flex h-9 w-full items-center gap-2 text-sm font-medium text-text-primary">
            <span className="min-w-0 text-white truncate font-bold">{"SJSU "}</span>
            <span className="min-w-0 text-white truncate">{"Course Ratings"}</span>
            <ChevronDown className="size-4 shrink-0 text-white" aria-hidden />
          </div>
        )}
      </div>
      <nav
        aria-label="Primary"
        className={`flex flex-1 flex-col gap-1 py-4 text-sm ${
          collapsed ? "items-center px-2" : "px-3"
        }`}
      >
        {links.map((link) => {
          const current = isCurrent(pathname, link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileExpanded(false)}
              aria-current={current ? "page" : undefined}
              title={collapsed ? link.label : undefined}
              className={`flex items-center rounded-full font-medium text-white underline-offset-4 transition-colors hover:bg-white/10 hover:text-white ${
                collapsed ? "size-9 justify-center" : "gap-2 px-3 py-2"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {collapsed ? (
                <span className="sr-only">{link.label}</span>
              ) : (
                link.label
              )}
            </Link>
          );
        })}
        {collapsed ? null : (
          <div className="mt-8 flex min-h-0 flex-1 flex-col">
            <button
              type="button"
              aria-expanded={pinnedOpen}
              aria-controls="pinned-courses"
              onClick={() => setPinnedOpen((value) => !value)}
              className="flex w-full items-center justify-between px-3 text-xs font-medium tracking-[0.18em] text-text-muted uppercase"
            >
              Pinned
              <ChevronRight
                className={`size-3.5 transition-transform duration-200 ${
                  pinnedOpen ? "rotate-90" : ""
                }`}
                aria-hidden
              />
            </button>
            {pinnedOpen && pinsReady && pinnedCourses.length === 0 ? (
              <p className="mt-1 flex items-center gap-2 px-3 py-2 text-sm text-text-muted">
                <Pin className="size-4 shrink-0" aria-hidden />
                Nothing pinned
              </p>
            ) : null}
            {pinnedOpen && pinnedCourses.length > 0 ? (
              <ul
                id="pinned-courses"
                className="mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
              >
                {pinnedCourses.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`/courses/${course.id}`}
                      onClick={() => setMobileExpanded(false)}
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-white hover:bg-white/10"
                    >
                      <Pin className="size-4 shrink-0 fill-current" aria-hidden />
                      <span className="truncate">{course.code}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </nav>
      <div
        className={`mt-auto flex justify-end px-3 pt-3 ${
          collapsed ? "pb-16" : "pb-3"
        }`}
      >
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => compactViewport ? setMobileExpanded((value) => !value) : setDesktopCollapsed((value) => !value)}
          className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text-primary"
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <ChevronLeft className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
