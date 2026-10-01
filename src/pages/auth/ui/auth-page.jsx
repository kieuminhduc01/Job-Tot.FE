import { AuthHeader } from '@/widgets/auth-header'
import { AuthIntroduction } from '@/widgets/auth-introduction'
import { CareerTools } from '@/widgets/career-tools'
import { AuthFooter } from '@/widgets/auth-footer'
import { AuthPanel } from '@/features/authenticate'
import './auth-page.css'

export function AuthPage({ mode = 'register' }) {
  return <div className="auth-page"><title>{mode === 'register' ? 'Đăng ký' : 'Đăng nhập'} | Job Tốt</title><AuthHeader /><main className="auth-main"><div className="auth-hero-grid"><AuthIntroduction /><AuthPanel mode={mode} /></div><CareerTools /></main><AuthFooter /></div>
}
