import "./page-breadcrumb.css";
import { Link } from "react-router-dom";
import { ChevronRight, House } from "lucide-react";

export function PageBreadcrumb({ current, children }) {
  return <div className="profile-breadcrumb">
    <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-[13px] text-auth-text-secondary">
      <Link to="/jobs" className="inline-flex items-center gap-1.5"><House className="size-3.5" />Trang chủ</Link>
      <ChevronRight className="size-3.5" /><strong aria-current="page" className="font-semibold text-auth-ink">{current}</strong>
    </nav>
    {children}
  </div>;
}
