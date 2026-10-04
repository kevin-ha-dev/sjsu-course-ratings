import { AppSidebar } from "@/components/app-sidebar";
import { BackButton } from "@/components/back-button";
import { PinnedCoursesProvider } from "@/components/pinned-courses";
import { ProfileMenu } from "@/components/profile-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PinnedCoursesProvider>
      <div className="flex min-h-full flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-border bg-[#fafafa] px-6 py-5">
            <form role="search" className="relative ml-11 w-[28rem] max-w-[calc(100%-2.75rem)]">
              <BackButton />
              <label htmlFor="nav-search" className="sr-only">
                Search
              </label>
              <input
                id="nav-search"
                type="search"
                placeholder="Search"
                className="h-9 w-full rounded-full border border-border bg-surface px-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </form>
            <div className="ml-auto">
              <ProfileMenu />
            </div>
          </header>
          {children}
        </div>
      </div>
    </PinnedCoursesProvider>
  );
}
