import { useSearchParams } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness } from 'lucide-react'
import { jobs, filterJobs, JobCard } from '@/entities/job'
import { JobFilters } from '@/features/search-jobs'
import { SaveJobButton, useSavedJobs } from '@/features/save-job'
import { Badge } from '@/shared/ui/badge'

export function JobsPage({ savedOnly = false }) {
  const [params, setParams] = useSearchParams()
  const filters = { query: params.get('q') || '', location: params.get('location') || '', type: params.get('type') || '' }
  const { savedIds } = useSavedJobs()
  const items = filterJobs(savedOnly ? jobs.filter((job) => savedIds.includes(job.id)) : jobs, filters)
  function updateFilters(next) {
    const search = new URLSearchParams()
    if (next.query) search.set('q', next.query)
    if (next.location) search.set('location', next.location)
    if (next.type) search.set('type', next.type)
    setParams(search, { replace: true })
  }
  return <main className="mx-auto max-w-6xl px-6 pt-10 pb-16">
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-emerald-950 px-7 py-12 text-white md:px-12 md:py-16">
      <div aria-hidden="true" className="absolute -top-20 -right-16 size-80 rounded-full border-50 border-emerald-900/70" />
      <div className="relative max-w-2xl"><Badge className="mb-6 border-emerald-700 bg-emerald-900 text-emerald-100" variant="outline">BƯỚC TIẾP THEO TRONG SỰ NGHIỆP</Badge>
        <h1 className="text-3xl leading-tight font-semibold tracking-tight md:text-5xl">{savedOnly ? 'Cơ hội bạn đã lưu.' : <>Công việc phù hợp.<br /><span className="text-emerald-300">Tương lai rộng mở.</span></>}</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-emerald-100/80 md:text-base">{savedOnly ? 'Những vị trí bạn quan tâm, được lưu lại để dễ dàng xem sau.' : 'Khám phá cơ hội mới, kết nối với doanh nghiệp và tìm nơi bạn có thể phát triển mỗi ngày.'}</p>
        <div className="mt-7 flex items-center gap-2 text-sm text-emerald-200"><ArrowRight className="size-4" />{jobs.length} vị trí mẫu để khám phá</div>
      </div>
    </section>
    <JobFilters filters={filters} onChange={updateFilters} />
    <div className="mt-10 mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{savedOnly ? 'Việc làm đã lưu' : 'Cơ hội dành cho bạn'} <span className="ml-2 text-sm font-normal text-muted-foreground" role="status">({items.length} kết quả)</span></h2><span className="text-xs text-muted-foreground">Dữ liệu minh họa · Chưa kết nối backend</span></div>
    {items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map((job) => <JobCard key={job.id} job={job} action={<SaveJobButton jobId={job.id} title={job.title} />} />)}</div> : <div className="rounded-2xl border border-dashed px-6 py-16 text-center"><BriefcaseBusiness aria-hidden="true" className="mx-auto mb-4 size-9 text-muted-foreground" /><h2 className="font-semibold">{savedOnly ? 'Chưa có việc làm phù hợp trong danh sách đã lưu' : 'Chưa tìm thấy việc làm phù hợp'}</h2><p className="mt-2 text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc khám phá thêm các vị trí khác.</p></div>}
  </main>
}
