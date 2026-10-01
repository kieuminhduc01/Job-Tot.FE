import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'
import { BrandLogo } from '@/shared/ui/brand-logo'
import { ServiceNotice } from '@/shared/ui/service-notice'

const candidateLinks = ['Tạo CV chuyên nghiệp AI', 'Công cụ tính lương Gross - Net', 'Cẩm nang & Lộ trình nghề nghiệp', 'Báo cáo thị trường tuyển dụng 2026']
const employerLinks = ['Đăng tin tuyển dụng', 'Tìm hồ sơ ứng viên chuẩn AI', 'Giải pháp Employer Branding', 'Bảng giá dịch vụ tuyển dụng', 'Quy chế xác thực doanh nghiệp']

export function AuthFooter() {
  return <footer className="auth-footer"><div className="auth-footer-inner"><div className="footer-columns"><section className="footer-company"><BrandLogo footer /><p>Công ty Cổ phần Job Tốt Toàn Cầu – Nền tảng tuyển dụng thông minh tích hợp trí tuệ nhân tạo (AI) giúp tối ưu hóa hành trình phát triển sự nghiệp của người lao động Việt Nam.</p><address><span><MapPin />Tầng 12, Tòa nhà Sông Đà, Đường Phạm Hùng, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà Nội</span><a href="tel:0962107888"><Phone />Hotline 24/7: <strong>0962.107.888</strong></a><a href="mailto:hotro@jobtot.vn"><Mail />Email: <strong>hotro@jobtot.vn</strong></a></address></section><section><h2>Dành cho Ứng viên</h2><Link to="/jobs">Tìm việc làm mới nhất</Link>{candidateLinks.map((label) => <ServiceNotice key={label} title={label}><button>{label}</button></ServiceNotice>)}</section><section><h2>Dành cho Nhà tuyển dụng</h2>{employerLinks.map((label) => <ServiceNotice key={label} title={label}><button>{label}</button></ServiceNotice>)}</section></div><div className="footer-copyright">© 2026 Job Tốt Toàn Cầu</div></div></footer>
}
