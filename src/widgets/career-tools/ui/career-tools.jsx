import { Calculator, ReceiptText, Shield, ChartNoAxesCombined, ArrowRight } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { ServiceNotice } from '@/shared/ui/service-notice'
import { Button } from '@/shared/ui/button'

const tools = [
  { icon: Calculator, title: 'Tính lương Gross - Net', description: <>Công cụ quy đổi lương Gross sang Net<br />và ngược lại chuẩn xác theo quy định mới nhất.</> },
  { icon: ReceiptText, title: 'Tính thuế thu nhập cá nhân', description: 'Tính chi tiết mức thuế TNCN phải nộp kèm các khoản giảm trừ gia cảnh.' },
  { icon: Shield, title: 'Tính bảo hiểm xã hội một lần', description: 'Dự tính số tiền BHXH một lần có thể nhận dựa trên thời gian và mức đóng.' },
  { icon: ChartNoAxesCombined, title: 'Tính bảo hiểm thất nghiệp', description: <>Tra cứu điều kiện và mức hưởng trợ cấp<br />thất nghiệp hàng tháng chính xác.</> },
]

function CareerToolCard({ tool }) {
  const Icon = tool.icon
  return <Card className="career-tool-card"><div className="tool-card-top"><span className="benefit-icon orange"><Icon aria-hidden="true" /></span><span className="tool-free">Miễn phí</span></div><div className="tool-card-body"><h3>{tool.title}</h3><p>{tool.description}</p></div><ServiceNotice title={tool.title}><Button variant="ghost" className="tool-action">Dùng ngay<ArrowRight /></Button></ServiceNotice></Card>
}

export function CareerTools() {
  return <section className="career-tools" aria-labelledby="tools-heading"><div className="tools-heading"><div><span className="tools-eyebrow">HÀNH TRANG SỰ NGHIỆP</span><h2 id="tools-heading">Kho tiện ích hỗ trợ ứng viên chuẩn 2026</h2></div><p>Các công cụ miễn phí 100% giúp bạn chủ động đo lường giá trị bản thân, tính toán thu nhập và hoạch định lộ trình.</p></div><div className="career-tools-grid">{tools.map((tool) => <CareerToolCard key={tool.title} tool={tool} />)}</div></section>
}
