import { Link } from "react-router-dom";
import { FileText, Building, Wrench } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { Button } from "@/shared/ui/button";
import { JobsMenu } from "@/shared/ui/jobs-menu";
import { AccountActions } from "./account-actions";

export function AuthHeader({ userName, loading = false, authRole = "candidate", accountHref = "/profile", navigation, compactNavigation }) {
  return (
    <header className="h-[82px] border-b border-auth-text-footer-heading bg-white text-sm leading-normal text-auth-ink max-[700px]:h-[74px]">
      <div className="mx-auto flex h-full max-w-[1284px] items-center justify-between gap-[22px] px-[34px] max-[950px]:px-6 max-[700px]:gap-2 max-[700px]:px-4">
        <BrandLogo />
        <nav
          className={`mx-auto flex items-center gap-5 max-[1150px]:gap-4 max-[1150px]:hidden [&_a]:flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:whitespace-nowrap [&_a]:text-sm [&_a]:font-medium [&_a]:text-auth-muted [&_button]:flex [&_button]:items-center [&_button]:gap-[7px] [&_button]:text-base [&_svg]:size-[18px]`}
          aria-label="Điều hướng chính"
        >
          {navigation || <><JobsMenu />
          <Link to="/companies"><Building />Doanh nghiệp</Link>
            <Link to="/cv-templates" className="font-medium text-auth-muted">
              <FileText />
              Mẫu CV
            </Link>
          <Link to="/tools"><Wrench />Kho tiện ích</Link>
          </>}
        </nav>
        <div className={`hidden max-[1150px]:block`}>{compactNavigation || <JobsMenu compact />}</div>
        <nav
          className="flex items-center gap-5 min-[701px]:whitespace-nowrap text-base font-bold max-[950px]:ml-auto max-[700px]:gap-3.5 max-[700px]:text-xs max-[380px]:gap-2"
          aria-label="Tài khoản"
        >
          <Link
            className="flex items-center gap-[7px] text-auth-text-header max-[700px]:hidden [&_svg]:size-4"
            to={authRole === "employer" ? "/register" : "/register?role=employer"}
          >
            <Building />
            {authRole === "employer" ? "Dành cho ứng viên" : "Dành cho NTD"}
          </Link>
          <span className="h-5 w-px bg-auth-border max-[700px]:hidden" />
          {loading ? <span role="status" className="text-xs text-auth-muted">Đang kiểm tra đăng nhập…</span> : userName ? (
            <AccountActions role={authRole} userName={userName} accountHref={accountHref} />
          ) : (
            <>
              <Link to={authRole === "employer" ? "/login?role=employer" : "/login"}>Đăng nhập</Link>
              <Button
                asChild
                className="border-0 bg-auth-orange text-white hover:bg-auth-brand-hover h-10 rounded-xl px-[21px] font-bold shadow-[0_3px_6px_var(--color-auth-shadow-button)] max-[700px]:h-9 max-[700px]:px-[13px]"
              >
                <Link to={authRole === "employer" ? "/register?role=employer" : "/register"}>Đăng ký</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
