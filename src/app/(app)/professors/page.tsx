import Link from "next/link";

const placeholderProfessors = [
  { id: "jane-smith", name: "Jane Smith" },
  { id: "john-lee", name: "John Lee" },
  { id: "maria-garcia", name: "Maria Garcia" },
];

export default function ProfessorsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
        Professors
      </h1>
      <p className="mt-4 text-text-secondary">
        Placeholder list of professors. Open one to see courses they teach.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {placeholderProfessors.map((professor) => (
          <li key={professor.id}>
            <Link
              href={`/professors/${professor.id}`}
              className="block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              {professor.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
