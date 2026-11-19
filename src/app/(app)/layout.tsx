import { AppSidebar } from "@/components/app-sidebar";
import { NavSearch } from "@/components/nav-search";
import { PinnedCoursesProvider } from "@/components/pinned-courses";
import { ProfileMenu } from "@/components/profile-menu";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <PinnedCoursesProvider>
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="flex items-center gap-4 border-b border-border bg-[#fafafa] px-6 py-5">
            <NavSearch />
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
