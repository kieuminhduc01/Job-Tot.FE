import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Check } from 'lucide-react'

export function BrandLogo({ footer = false }) {
  return <Link to="/register" className={`brand-logo ${footer ? 'brand-logo-footer' : ''}`} aria-label="Job Tốt — Trang chủ">
    <span className="brand-symbol"><BriefcaseBusiness aria-hidden="true" /><Check aria-hidden="true" className="brand-check" /></span>
    <span><span className="brand-name">Job<span>Tốt</span>{!footer && <i />}</span>{!footer && <span className="brand-tagline">SỰ NGHIỆP VỮNG BỀN</span>}</span>
  </Link>
}
