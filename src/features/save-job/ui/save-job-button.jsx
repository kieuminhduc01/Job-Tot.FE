import { Bookmark } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useSavedJobs } from '../model/saved-jobs-context'

export function SaveJobButton({ jobId, title }) {
  const { savedIds, toggleSaved } = useSavedJobs()
  const saved = savedIds.includes(jobId)
  return <Button variant="ghost" size="icon" aria-pressed={saved} aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${title}`} onClick={() => toggleSaved(jobId)}><Bookmark className={saved ? 'fill-emerald-600 text-emerald-600' : 'text-muted-foreground'} /></Button>
}
