import Link from "next/link";

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ professorId: string }>;
}) {
  const { professorId } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium text-brand">Professor</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
        {professorId}
      </h1>
      <p className="mt-4 text-text-secondary">
        Placeholder for courses this professor teaches. Switch to a course page
        to see other professors for that offering.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        <li>
          <Link
            href="/courses/cs-146"
            className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            CS 146 — Data Structures and Algorithms (placeholder)
          </Link>
        </li>
      </ul>
      <Link
        href="/professors"
        className="mt-8 text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        Back to professors
      </Link>
    </main>
  );
}
