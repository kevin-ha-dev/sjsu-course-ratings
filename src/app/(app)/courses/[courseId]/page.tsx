import Link from "next/link";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium text-brand">Course</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
        {courseId}
      </h1>
      <p className="mt-4 text-text-secondary">
        Placeholder for professors who teach this course. Switch to a professor
        page to see their other courses.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        <li>
          <Link
            href="/professors/jane-smith"
            className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            Jane Smith (placeholder)
          </Link>
        </li>
      </ul>
      <Link
        href="/courses"
        className="mt-8 text-sm font-medium text-brand underline-offset-4 hover:underline"
      >
        Back to course offerings
      </Link>
    </main>
  );
}
