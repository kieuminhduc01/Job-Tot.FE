import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Flame, ShieldCheck, FileText, Sparkles, Building2, BookOpen } from "lucide-react";
import { ServiceNotice } from "@/shared/ui/service-notice";

const templates = ["Hiện đại", "Chuyên nghiệp", "Tiên phong", "Tối giản", "Sáng tạo", "C-Senior"];
const articles = [
  ["Báo cáo", "Bức tranh thị trường tuyển dụng và xu hướng nhân sự", "Hiểu nhu cầu của doanh nghiệp để lựa chọn bước đi phù hợp với sự nghiệp."],
  ["Phỏng vấn", "Tự tin chinh phục nhà tuyển dụng với hồ sơ khác biệt", "Chuẩn bị câu chuyện nghề nghiệp và thể hiện rõ giá trị của bạn."],
  ["Viết CV", "Cách viết CV thể hiện thành tích và kinh nghiệm thực tế", "Một hồ sơ rõ ràng giúp nhà tuyển dụng nhanh chóng hiểu thế mạnh của bạn."],
  ["Sự nghiệp", "Lộ trình chuyển đổi nghề nghiệp trong ngành công nghệ", "Khám phá những kỹ năng cần thiết cho chặng đường tiếp theo."],
];

export function CompanyResources() {
  return <section className="company-resources">
    <div className="company-employer-banner"><div><span><Flame />DÀNH RIÊNG CHO NHÀ TUYỂN DỤNG</span><h2>Bạn là Doanh nghiệp tuyển dụng? Tiếp cận ứng viên chất lượng cao</h2><p>Đăng tin tuyển dụng không giới hạn, kết nối nhân tài và xây dựng thương hiệu tuyển dụng chuyên nghiệp cùng Job Tốt.</p></div><div><Link className="company-primary" to="/register?role=employer"><Building2 />Đăng tin tuyển dụng miễn phí</Link><ServiceNotice title="Gói Doanh nghiệp VIP"><button className="company-light-button">Đăng ký Gói Doanh nghiệp VIP</button></ServiceNotice></div></div>
    <div className="company-safety"><ShieldCheck /><div><h2>Cam kết minh bạch & An toàn tuyệt đối tại Job Tốt <span><BadgeCheck />ĐÃ XÁC THỰC</span></h2><p>Kiểm tra thông tin doanh nghiệp, bảo vệ dữ liệu cá nhân và lựa chọn cơ hội việc làm phù hợp.</p><p>Không chuyển tiền cho nhà tuyển dụng để được nhận việc. Cần hỗ trợ? Liên hệ hotline 0962.107.888.</p></div><ServiceNotice title="Chính sách An toàn"><button className="company-text-button">Chính sách An toàn 24/7</button></ServiceNotice></div>
    <div className="company-section-heading"><div><p><FileText />HƠN 100 MẪU CV CHUẨN ATS QUỐC TẾ</p><h2>Kho mẫu CV và công cụ chuyên nghiệp</h2><span>Chọn phong cách phù hợp và thể hiện dấu ấn nghề nghiệp của bạn.</span></div><ServiceNotice title="Tạo CV Online"><button className="company-primary"><Sparkles />Tạo CV Online miễn phí</button></ServiceNotice></div>
    <div className="company-template-grid">{templates.map((name, i) => <ServiceNotice title={`Mẫu CV ${name}`} key={name}><button className="company-template"><div className={`company-cv-preview cv-style-${i}`} aria-hidden="true"><div className="cv-preview-header"><i /><span /><span /></div><div className="cv-preview-columns"><div>{Array.from({ length: 7 }, (_, j) => <i key={j} />)}</div><div>{Array.from({ length: 12 }, (_, j) => <i key={j} />)}</div></div></div><strong>{name}</strong><span>{["Phù hợp quản lý", "Ngành nghề rộng", "IT & Kỹ thuật", "Tài chính – Kế toán", "Design & Marketing", "Giám đốc điều hành"][i]}</span></button></ServiceNotice>)}</div>
    <div className="company-section-heading"><div><p><BookOpen />KIẾN THỨC THỰC CHIẾN TỪ CHUYÊN GIA</p><h2>Cẩm nang & Báo cáo thị trường tuyển dụng 2026</h2></div><ServiceNotice title="Cẩm nang nghề nghiệp"><button className="company-text-button">Xem tất cả bài viết <ArrowRight /></button></ServiceNotice></div>
    <div className="company-article-grid">{articles.map(([category, title, description], i) => <article key={title}><div className={`company-article-art article-art-${i}`} aria-hidden="true">{i % 2 ? <Building2 /> : <BookOpen />}<span>JOB TỐT / {category.toUpperCase()}</span></div><div><small>{category} · 2026</small><h3>{title}</h3><p>{description}</p><ServiceNotice title={title}><button className="company-text-button">Khám phá ngay <ArrowRight /></button></ServiceNotice></div></article>)}</div>
  </section>;
}
