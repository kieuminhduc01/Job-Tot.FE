import { Link } from 'react-router-dom'
import { BriefcaseBusiness, FileText, Sparkles, Building } from 'lucide-react'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { Button } from '@/shared/ui/button'
import { ServiceNotice } from '@/shared/ui/service-notice'

export function AuthHeader() {
  return <header className="auth-header"><div className="auth-header-inner">
    <BrandLogo />
    <nav className="auth-main-nav" aria-label="Điều hướng chính">
      <Link to="/jobs"><BriefcaseBusiness />Việc làm</Link>
      <ServiceNotice title="Mẫu CV"><button><FileText />Mẫu CV</button></ServiceNotice>
      <ServiceNotice title="AI Job"><button className="ai-nav"><Sparkles />AI Job <span>MỚI</span></button></ServiceNotice>
    </nav>
    <nav className="auth-account-nav" aria-label="Tài khoản">
      <Link className="employer-link" to="/register?role=employer"><Building />Dành cho NTD</Link><span className="nav-divider" />
      <Link className="login-link" to="/login">Đăng nhập</Link><Button asChild className="orange-button header-register"><Link to="/register">Đăng ký</Link></Button>
    </nav>
  </div></header>
}
