import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/widgets/site-header";
import { SavedJobsProvider } from "@/features/save-job";

export function RootLayout() {
  return (
    <SavedJobsProvider>
      <SiteHeader />
      <Outlet />
      <footer className="mx-auto max-w-6xl border-t px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} TalentHub · Khởi đầu cho hành trình nghề
        nghiệp của bạn.
      </footer>
    </SavedJobsProvider>
  );
}
