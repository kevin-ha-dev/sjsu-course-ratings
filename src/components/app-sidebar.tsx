"use client";

import {
  BookOpen,
  Braces,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Code,
  Cpu,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const majors: { label: string; icon: LucideIcon }[] = [
  { label: "Computer Science", icon: Code },
  { label: "Computer Engineering", icon: Cpu },
  { label: "Software Engineering", icon: Braces },
  { label: "Electrical Engineering", icon: CircuitBoard },
  { label: "Business Administration", icon: Briefcase },
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
  const [major, setMajor] = useState(majors[0].label);
  const MajorIcon = majors.find((option) => option.label === major)?.icon ?? Code;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border bg-[#fafafa] transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center border-b border-border px-3 py-5">
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
            <div className="relative w-full">
              <MajorIcon
                className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-text-primary"
                aria-hidden
              />
              <select
                id="major"
                value={major}
                onChange={(event) => setMajor(event.target.value)}
                className="h-9 w-full appearance-none bg-transparent py-2 pr-6 pl-6 text-sm font-medium text-text-primary outline-none"
              >
                {majors.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-text-primary"
                aria-hidden
              />
            </div>
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
              className={`flex items-center rounded-full font-medium underline-offset-4 transition-colors hover:bg-surface-muted hover:text-brand ${
                collapsed ? "size-9 justify-center" : "gap-2 px-3 py-2"
              } ${current ? "text-brand" : "text-text-primary"}`}
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
