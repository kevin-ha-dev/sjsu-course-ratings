import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Course offerings" },
  { href: "/professors", label: "Professors" },
];

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <p className="text-sm font-medium tracking-wide text-brand">
          SJSU Course Ratings
        </p>
        <nav className="mt-3 flex flex-wrap gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-text-primary underline-offset-4 hover:text-brand hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
