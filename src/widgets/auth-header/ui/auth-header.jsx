import { Link } from "react-router-dom";
import { BriefcaseBusiness, FileText, Sparkles, Building } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { Button } from "@/shared/ui/button";
import { ServiceNotice } from "@/shared/ui/service-notice";

export function AuthHeader() {
  return (
    <header className="h-[82px] border-b border-[#f0f2f6] bg-white max-[700px]:h-[74px]">
      <div className="mx-auto flex h-full max-w-[1284px] items-center justify-between gap-[22px] px-[34px] max-[950px]:px-6 max-[700px]:gap-2 max-[700px]:px-4">
        <BrandLogo />
        <nav
          className="mx-auto flex items-center gap-8 max-[1150px]:gap-4 max-[950px]:hidden [&_a]:flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:text-[15px] [&_a]:font-medium [&_a]:text-auth-muted [&_button]:flex [&_button]:items-center [&_button]:gap-[7px] [&_button]:text-[15px] [&_svg]:size-[18px]"
          aria-label="Điều hướng chính"
        >
          <Link to="/jobs">
            <BriefcaseBusiness />
            Việc làm
          </Link>
          <ServiceNotice title="Mẫu CV">
            <button className="font-medium text-auth-muted">
              <FileText />
              Mẫu CV
            </button>
          </ServiceNotice>
          <ServiceNotice title="AI Job">
            <button className="rounded-[10px] bg-[#f6f2ff] px-3.5 py-2.5 font-bold text-[#8b55ff] [&_span]:rounded-[20px] [&_span]:bg-[#9056f4] [&_span]:px-1.5 [&_span]:py-[5px] [&_span]:text-[10px] [&_span]:font-medium [&_span]:text-white">
              <Sparkles />
              AI Job <span>MỚI</span>
            </button>
          </ServiceNotice>
        </nav>
        <nav
          className="flex items-center gap-8 text-[13px] font-bold max-[1150px]:gap-5 max-[950px]:ml-auto max-[700px]:gap-3.5 max-[700px]:text-xs max-[380px]:gap-2"
          aria-label="Tài khoản"
        >
          <Link
            className="flex items-center gap-[7px] text-[#56617a] max-[700px]:hidden [&_svg]:size-4"
            to="/register?role=employer"
          >
            <Building />
            Dành cho NTD
          </Link>
          <span className="h-5 w-px bg-auth-border max-[700px]:hidden" />
          <Link className="" to="/login">
            Đăng nhập
          </Link>
          <Button
            asChild
            className="border-0 bg-auth-orange text-white hover:bg-[#ed4710] h-10 rounded-xl px-[21px] font-bold shadow-[0_3px_6px_#ff571b20] max-[700px]:h-9 max-[700px]:px-[13px]"
          >
            <Link to="/register">Đăng ký</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
