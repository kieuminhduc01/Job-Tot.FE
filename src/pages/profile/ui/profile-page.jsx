import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { BriefcaseBusiness, FileText, Mail, Phone, MapPin, Calendar, User, Pencil, Plus, Award, GraduationCap, FolderKanban, CheckCircle2, SlidersHorizontal, Upload, Download, Eye, Trash2 } from "lucide-react";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { AuthHeader } from "@/widgets/auth-header";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerTools } from "@/widgets/career-tools";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { useCandidateSession } from "@/features/authenticate";
import { profileApi, downloadCv } from "../api/profile";
import "./profile.css";

const sections = [
  ["experiences", "Kinh nghiệm làm việc", "Thêm kinh nghiệm", BriefcaseBusiness],
  ["skills", "Kỹ năng & Đánh giá năng lực", "Thêm kỹ năng", Award],
  ["education", "Học vấn & Đào tạo", "Thêm học vấn", GraduationCap],
  ["certificates", "Chứng chỉ quốc tế", "Thêm chứng chỉ", Award],
  ["projects", "Dự án cá nhân & Portfolio", "Thêm dự án", FolderKanban],
];
const entryFields = [["title", "Tiêu đề", "text"], ["organization", "Tổ chức / Vai trò", "text"], ["period", "Thời gian", "text"], ["description", "Mô tả (mỗi ý một dòng)", "textarea"], ["tags", "Công nghệ (phân cách bằng dấu phẩy)", "text"]];
const personalFields = [["fullName", "Họ và tên", "text"], ["headline", "Chức danh", "text"], ["location", "Địa chỉ", "text"], ["birthDate", "Ngày sinh", "date"], ["gender", "Giới tính", "text"]];
const preferenceFields = [["expectedSalaryMin", "Lương tối thiểu (VND/tháng)", "number"], ["expectedSalaryMax", "Lương tối đa (VND/tháng)", "number"], ["desiredPosition", "Cấp bậc mong muốn", "text"], ["workType", "Hình thức làm việc", "text"], ["desiredLocation", "Địa điểm ưu tiên", "text"]];

export function ProfilePage() {
  const { account, loading } = useCandidateSession();
  if (loading) return <p role="status">Đang kiểm tra đăng nhập…</p>;
  if (!account) return <Navigate to="/login" replace />;
  return <AuthenticatedProfilePage />;
}

function AuthenticatedProfilePage() {
  const { account, loading: sessionLoading } = useCandidateSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  useEffect(() => {
    let active = true;
    if (account) profileApi.get().then(value => { if (active) setData(value); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [account]);
  const preview = !account;
  const profile = data?.profile;
  async function persist(next) {
    setBusy(true); setError(""); setNotice("");
    try { setData(await profileApi.save(next)); setNotice("Đã lưu hồ sơ thành công."); return true; }
    catch (failure) { setError(failure.message); return false; }
    finally { setBusy(false); }
  }
  function edit(section, index = null) {
    if (preview) { setNotice("Đăng nhập để tạo và chỉnh sửa hồ sơ của bạn."); return; }
    const values = section === "personal" || section === "preferences" || section === "summary" ? { ...profile } : index === null ? { title: "", organization: "", period: "", description: "", tags: "" } : { ...profile[section][index] };
    setEditor({ section, index, values });
  }
  async function submit(event) {
    event.preventDefault();
    const { section, index, values } = editor;
    let next = { ...profile };
    if (["personal", "preferences", "summary"].includes(section)) next = { ...next, ...values };
    else { next[section] = [...next[section]]; if (index === null) next[section].push(values); else next[section][index] = values; }
    if (await persist(next)) setEditor(null);
  }
  async function upload(event) {
    const file = event.target.files[0]; event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf")) { setError("Chọn tệp PDF tối đa 5 MB."); return; }
    setBusy(true); setError("");
    try { await profileApi.upload(file); setData(await profileApi.get()); setNotice("Đã tải CV lên thành công."); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  const fields = editor?.section === "personal" ? personalFields : editor?.section === "preferences" ? preferenceFields : editor?.section === "summary" ? [["summary", "Giới thiệu bản thân", "textarea"]] : entryFields;
  return <div className="candidate-profile font-roboto"><title>Hồ sơ cá nhân | Job Tốt</title><AuthHeader userName={profile?.fullName || account?.fullName} /><main className="profile-container"><PageBreadcrumb current="Hồ sơ cá nhân"><span className="talent-banner">🔥 Hơn 2.500.000+ ứng viên tài CV và trúng tuyển tại FPT, Viettel, Vingroup, Big4</span></PageBreadcrumb>
    {preview && !sessionLoading && <div className="profile-message">Đây là hồ sơ mẫu theo thiết kế. <Link to="/login">Đăng nhập</Link> để quản lý hồ sơ cá nhân của bạn.</div>}
    {notice && <div role="status" className="profile-message">{notice}{preview && <> <Link to="/login">Đăng nhập →</Link></>}</div>}
    {error && <div role="alert" className="profile-error">{error}{account && !data && <button onClick={() => { setError(""); profileApi.get().then(setData).catch(e => setError(e.message)); }}>Thử lại</button>}</div>}
    {sessionLoading || (!preview && !profile && !error) ? <p role="status">Đang tải hồ sơ…</p> : profile && <>
    <section className="profile-hero"><div className="profile-identity"><div className="profile-avatar">{preview ? <img src="/images/candidate-avatar.png" alt="Ảnh đại diện ứng viên" /> : <span>{profile.fullName.slice(0, 1)}</span>}<CheckCircle2 /></div><div><div className="identity-name"><h1>{profile.fullName}</h1><button aria-label="Chỉnh sửa thông tin cá nhân" onClick={() => edit("personal")}><Pencil /></button></div><h2>{profile.headline || "Thêm chức danh của bạn"}</h2><p><Mail />{preview ? "nam.nguyen.devops@gmail.com" : data.email || "Chưa có email"}<Phone />{preview ? "0988.234.567" : data.phone || "Chưa có số điện thoại"}</p><p><MapPin />{profile.location || "Chưa cập nhật địa chỉ"}<Calendar />{profile.birthDate ? new Date(`${profile.birthDate}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"}<User />{profile.gender}</p></div></div><div className="profile-status"><h3>TRẠNG THÁI TÌM VIỆC</h3><div>{[["looking", "Tìm việc"], ["considering", "Cân nhắc"], ["paused", "Tạm khóa"]].map(([value, label]) => <button key={value} disabled={busy} aria-pressed={profile.readyStatus === value} className={profile.readyStatus === value ? "selected" : ""} onClick={() => preview ? edit("personal") : persist({ ...profile, readyStatus: value })}><i className={value} />{label}</button>)}</div></div></section>
    <div className="profile-columns"><div className="profile-sections"><section className="profile-card"><div className="section-heading"><h2><span className="section-icon orange"><BriefcaseBusiness /></span>Giới thiệu bản thân</h2><button aria-label="Chỉnh sửa giới thiệu" onClick={() => edit("summary")}><Pencil /></button></div><p className="summary-text">{profile.summary || "Giới thiệu kinh nghiệm, điểm mạnh và mục tiêu nghề nghiệp của bạn."}</p></section>
      {sections.map(([key, title, add, Icon]) => <section className="profile-card" key={key}><div className="section-heading"><h2><span className={`section-icon ${key === "certificates" ? "green" : key === "skills" ? "purple" : "blue"}`}><Icon /></span>{title}</h2><button className="add-button" onClick={() => edit(key)}><Plus />{add}</button></div><div className={key === "certificates" ? "certificate-grid" : "entry-list"}>{profile[key].length === 0 && <p className="empty-section">Chưa có thông tin. Thêm để hoàn thiện hồ sơ của bạn.</p>}{profile[key].map((entry, index) => <article className={`profile-entry ${key}`} key={index}>{key === "skills" ? <CheckCircle2 className="skill-check" /> : key === "certificates" ? <span className="certificate-icon"><Award /></span> : null}<div className="entry-top"><h3>{entry.title}</h3>{key !== "certificates" && <span className="entry-period">{entry.period}</span>}<button aria-label={`Chỉnh sửa ${entry.title}`} onClick={() => edit(key, index)}><Pencil /></button></div>{entry.organization && <p className="entry-organization">{entry.organization}</p>}{key === "certificates" && <p className="certificate-period">Hiệu lực: {entry.period}</p>}{entry.description && (key === "experiences" ? <ul>{entry.description.split("\n").filter(Boolean).map((line, i) => <li key={i}><CheckCircle2 />{line}</li>)}</ul> : <p className="entry-description">{entry.description}</p>)}{entry.tags && <div className="entry-tags">{entry.tags.split(",").filter(x => x.trim()).map((tag, i) => <span key={i}>{tag.trim()}</span>)}</div>}</article>)}</div></section>)}
    </div><aside className="profile-sidebar"><section className="profile-card"><div className="section-heading"><h2><FileText className="orange-text" />CV đính kèm chính</h2><span className="green-label">{data?.cvs?.length || preview ? "Đang kích hoạt" : "Chưa có CV"}</span></div>{preview ? <div className="cv-document"><span>PDF</span><div><strong>CV_Tien_Phong_DevOps_2026.pdf</strong><p>Tạo từ Job Tốt CV Studio</p></div></div> : data.cvs.map(cv => <div className="cv-document" key={cv.id}><FileText /><div><strong>{cv.title}</strong><p>{cv.isDefault ? "CV chính" : "CV bổ sung"}</p><button type="button" onClick={() => downloadCv(cv).catch(failure => setError(failure.message))}><Download />Tải xuống</button></div></div>)}<p className="cv-hint">{preview ? "✧ Điểm ATS: 96/100 (Xuất sắc)" : "PDF tối đa 5 MB • Chỉ bạn có quyền tải CV"}</p>{preview ? <button className="wide-button" onClick={() => edit("personal")}><Upload />Tải lên mẫu CV khác</button> : <label className="wide-button upload-label"><Upload />{busy ? "Đang xử lý…" : "Tải lên CV PDF"}<input disabled={busy} type="file" accept="application/pdf,.pdf" onChange={upload} /></label>}</section>
    <section className="profile-card"><div className="section-heading"><h2><SlidersHorizontal className="orange-text" />Tiêu chí tìm việc</h2><button className="orange-text" onClick={() => edit("preferences")}>Chỉnh sửa</button></div><dl className="preference-list">{[["Mức lương mong muốn", profile.expectedSalaryMin || profile.expectedSalaryMax ? `${(profile.expectedSalaryMin || 0) / 1000000} – ${(profile.expectedSalaryMax || 0) / 1000000} triệu (Gross)` : "Chưa cập nhật"], ["Cấp bậc mong muốn", profile.desiredPosition], ["Hình thức làm việc", profile.workType], ["Địa điểm ưu tiên", profile.desiredLocation]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Chưa cập nhật"}</dd></div>)}</dl><button className="wide-button" onClick={() => edit("preferences")}>Cập nhật tiêu chí</button></section>
    <section className="profile-card"><div className="section-heading"><h2><Eye className="orange-text" />Lượt xem & Lời mời</h2><span className="muted">7 ngày qua</span></div><div className="profile-stats"><div><span>Lượt xem hồ sơ</span><strong>{preview ? "48" : "—"}</strong></div><div><span>Mời phỏng vấn</span><strong>{preview ? "5" : "—"}</strong></div></div><p className="visitors-heading">DOANH NGHIỆP ĐÃ XEM GẦN ĐÂY</p>{preview ? ["Panasonic R&D Center", "Shopee Vietnam", "VPBank Digital Banking"].map((name, i) => <div className="profile-visitor" key={name}><span>{["PAN", "SHO", "VPB"][i]}</span><strong>{name}<small>Hoạt động gần đây</small></strong></div>) : <p className="muted">Chưa có dữ liệu thống kê lượt xem.</p>}</section></aside></div>
    </>}
    <section className="profile-editorial"><div><span className="orange-text">♧ KIẾN THỨC THỰC CHIẾN TỪ CHUYÊN GIA</span><h2>Cẩm nang & Báo cáo thị trường tuyển dụng 2026</h2></div><div className="editorial-grid">{[["Báo cáo", "Báo cáo thị trường lương và xu hướng tuyển dụng nhân sự toàn quốc", "Thông tin thị trường giúp bạn định hướng hành trình nghề nghiệp."], ["Tuyển dụng", "Top câu hỏi phỏng vấn hóc búa và bí quyết trả lời xuất sắc", "Chuẩn bị kiến thức và tự tin chinh phục nhà tuyển dụng."], ["Viết CV", "Cách viết CV xin việc thu hút nhà tuyển dụng và vượt qua bộ lọc", "Cùng xây dựng một hồ sơ rõ ràng, thể hiện giá trị của bạn."], ["Sự nghiệp", "Lộ trình chuyển đổi nghề nghiệp sang ngành Công nghệ thông tin", "Khám phá những bước đầu tiên trên hành trình sự nghiệp."]].map(([category, title, description], i) => <article key={title}><div className={`editorial-art art-${i}`}><FileText /><span>{category}</span></div><div><small>{category} · 2026</small><h3>{title}</h3><p>{description}</p><ServiceNotice title={title}><button className="orange-text">Xem chi tiết →</button></ServiceNotice></div></article>)}</div></section><CareerTools /></main><AuthFooter />
    <Dialog open={!!editor} onOpenChange={open => { if (!open && !busy) setEditor(null); }}><DialogContent className="profile-dialog"><DialogTitle>{editor?.index === null ? "Cập nhật hồ sơ" : "Chỉnh sửa thông tin"}</DialogTitle><DialogDescription>Bổ sung thông tin để nhà tuyển dụng hiểu rõ hơn về bạn.</DialogDescription>{editor && <form onSubmit={submit}>{fields.filter(([key]) => editor.section !== "skills" || key === "title").map(([key, label, type]) => <label key={key}>{label}{type === "textarea" ? <textarea rows={6} maxLength={10000} value={editor.values[key] || ""} onChange={e => setEditor({ ...editor, values: { ...editor.values, [key]: e.target.value } })} /> : <input type={type} required={key === "title" || key === "fullName"} maxLength={key === "tags" ? 1000 : 200} min={type === "number" ? 0 : undefined} max={type === "number" ? 1000000000 : type === "date" ? new Date().toISOString().slice(0, 10) : undefined} value={editor.values[key] ?? ""} onChange={e => setEditor({ ...editor, values: { ...editor.values, [key]: type === "number" ? e.target.value === "" ? null : Number(e.target.value) : e.target.value } })} />}</label>)}{error && <p role="alert" className="profile-error">{error}</p>}<div className="editor-actions">{editor.index !== null && !["personal", "preferences", "summary"].includes(editor.section) && <button className="delete-button" type="button" disabled={busy} onClick={async () => { if (await persist({ ...profile, [editor.section]: profile[editor.section].filter((_, i) => i !== editor.index) })) setEditor(null); }}><Trash2 />Xóa mục</button>}<button type="button" disabled={busy} onClick={() => setEditor(null)}>Hủy</button><button className="primary" disabled={busy}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button></div></form>}</DialogContent></Dialog>
  </div>;
}
