import { Link, useSearchParams } from 'react-router-dom'
import { UserRound, BriefcaseBusiness } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { CredentialsForm } from './credentials-form'
import { SocialAuthButtons } from './social-auth-buttons'

export function AuthPanel({ mode }) {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') === 'employer' ? 'employer' : 'candidate'
  return <Card className={`auth-panel ${mode}-panel`}><Tabs value={role} onValueChange={(value) => setParams(value === 'employer' ? { role: value } : {}, { replace: true })}>
    <TabsList className="auth-role-tabs" aria-label="Loại tài khoản"><TabsTrigger value="candidate"><UserRound />Ứng viên tìm việc</TabsTrigger><TabsTrigger value="employer"><BriefcaseBusiness />Nhà tuyển dụng</TabsTrigger></TabsList>
    <div className="auth-mode-row"><nav aria-label="Hình thức xác thực"><Link to={`/login${role === 'employer' ? '?role=employer' : ''}`} aria-current={mode === 'login' ? 'page' : undefined}>Đăng nhập</Link><Link to={`/register${role === 'employer' ? '?role=employer' : ''}`} aria-current={mode === 'register' ? 'page' : undefined}>Đăng ký mới</Link></nav><span className="auth-free">● Miễn phí 100%</span></div>
    <SocialAuthButtons /><div className="auth-divider"><span>Hoặc đăng ký bằng Email / Số điện thoại</span></div>
    {['candidate', 'employer'].map((value) => <TabsContent key={value} value={value}><CredentialsForm key={`${mode}-${value}`} mode={mode} role={value} /></TabsContent>)}
  </Tabs></Card>
}
