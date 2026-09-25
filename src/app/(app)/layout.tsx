import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
          <form role="search" className="flex min-w-0 flex-1 justify-start">
            <label htmlFor="nav-search" className="sr-only">
              Search
            </label>
            <input
              id="nav-search"
              type="search"
              placeholder="Search"
              className="h-9 w-full min-w-0 max-w-md rounded-full border border-border bg-surface-muted px-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </form>
          <span
            role="img"
            aria-label="Profile picture"
            className="size-9 shrink-0 rounded-full border border-border bg-surface-muted"
          />
        </header>
        {children}
      </div>
    </div>
  );
}
