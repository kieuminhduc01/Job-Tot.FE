import { ChevronLeft } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { benefits } from '../model/content'

function CareerStats() {
  return <Card className="career-stats">{[['+79.818', 'Việc làm đang tuyển', 'orange'], ['+22.667', 'Doanh nghiệp uy tín', 'green'], ['+3.296', 'Tin mới trong 24h', 'purple']].map(([value, label, tone]) => <div key={label}><strong className={`text-${tone}`}>{value}</strong><span>{label}</span></div>)}</Card>
}

function BenefitCard({ item }) {
  const Icon = item.icon
  return <Card className="auth-benefit"><span className={`benefit-icon ${item.tone}`}><Icon aria-hidden="true" /></span><div><h2>{item.title} <span className={`benefit-badge ${item.tone}`}>{item.badge}</span></h2><p>{item.description}</p></div></Card>
}

function CandidateTestimonial() {
  return <Card className="candidate-testimonial"><div className="testimonial-author"><img src="/images/candidate-avatar.png" alt="Trần Minh Hoàng" /><div><strong>Trần Minh Hoàng</strong><p>Senior Software Engineer @ Panasonic R&D Center</p></div><span className="testimonial-stars" aria-label="5 trên 5 sao">★★★★★</span></div><blockquote>“Chỉ sau 3 ngày đăng ký Job Tốt và bật chế độ AI Matching, mình nhận được 4 lời mời phỏng vấn trực tiếp từ các Lead Recruiter với mức đãi ngộ tăng 35%. Tiết kiệm rất nhiều thời gian lọc tin rác!”</blockquote></Card>
}

export function AuthIntroduction() {
  return <section className="auth-introduction" aria-labelledby="auth-heading"><span className="intro-eyebrow"><ChevronLeft aria-hidden="true" />Job Search Engine hàng đầu</span><h1 id="auth-heading">Khởi đầu sự nghiệp mơ ước<br />cùng <span>Job Tốt</span></h1><p className="intro-description">Gia nhập cộng đồng hơn <strong>2.500.000+</strong> ứng viên và tiếp cận ngay <b>79.800+</b> việc làm chất lượng cao từ các tập đoàn công nghệ & doanh nghiệp hàng đầu.</p><CareerStats /><div className="auth-benefits">{benefits.map((item) => <BenefitCard key={item.title} item={item} />)}</div><CandidateTestimonial /></section>
}
