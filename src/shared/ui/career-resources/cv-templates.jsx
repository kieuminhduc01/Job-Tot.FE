import { FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import "./cv-templates.css";

const templates = ["Hiện đại", "Chuyên nghiệp", "Tiên phong", "Tối giản", "Sáng tạo", "C-Senior"];

export function CvTemplates() {
  return <section className="cv-templates">
    <div className="cv-templates-heading"><div><p><FileText />MẪU CV CHUYÊN NGHIỆP • CHỈNH SỬA TRỰC TUYẾN</p><h2>Kho mẫu CV và công cụ chuyên nghiệp</h2><span>Chọn phong cách phù hợp và thể hiện dấu ấn nghề nghiệp của bạn.</span></div><Link to="/cv-templates" className="cv-templates-primary"><Sparkles />Tạo CV Online miễn phí</Link></div>
    <div className="cv-templates-grid">{templates.map((name, i) => <Link to="/cv-templates" key={name} className="cv-template-card"><div className={`cv-template-preview cv-template-style-${i}`} aria-hidden="true"><div className="cv-template-header"><i /><span /><span /></div><div className="cv-template-columns"><div>{Array.from({ length: 7 }, (_, j) => <i key={j} />)}</div><div>{Array.from({ length: 12 }, (_, j) => <i key={j} />)}</div></div></div><strong>{name}</strong><span>{["Phù hợp quản lý", "Ngành nghề rộng", "IT & Kỹ thuật", "Tài chính – Kế toán", "Design & Marketing", "Giám đốc điều hành"][i]}</span></Link>)}</div>
  </section>;
}
