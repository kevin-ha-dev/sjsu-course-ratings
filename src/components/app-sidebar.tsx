"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const majors = [
  "Computer Science",
  "Computer Engineering",
  "Software Engineering",
  "Electrical Engineering",
  "Business Administration",
];

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Course offerings", icon: BookOpen },
  { href: "/professors", label: "Professors", icon: GraduationCap },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const [major, setMajor] = useState(majors[0]);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center border-b border-border px-3 py-4">
        {collapsed ? (
          <span
            className="flex size-9 w-full items-center justify-center text-xs font-semibold text-brand"
            title={major}
          >
            {major
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        ) : (
          <>
            <label htmlFor="major" className="sr-only">
              Major
            </label>
            <select
              id="major"
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-muted px-3 text-sm font-medium text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {majors.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
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
              aria-current={current ? "page" : undefined}
              title={collapsed ? link.label : undefined}
              className={`rounded-md font-medium underline-offset-4 hover:bg-surface-muted hover:text-brand ${
                collapsed
                  ? "flex size-9 items-center justify-center"
                  : "px-3 py-2"
              } ${
                current
                  ? "bg-surface-muted text-brand"
                  : "text-text-primary"
              }`}
            >
              {collapsed ? (
                <>
                  <Icon className="size-4" aria-hidden />
                  <span className="sr-only">{link.label}</span>
                </>
              ) : (
                link.label
              )}
            </Link>
          );
        })}
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
          onClick={() => setCollapsed((value) => !value)}
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
  );
}
