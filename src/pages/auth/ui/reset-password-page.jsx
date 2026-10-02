import { useState } from 'react'
import { Link } from 'react-router-dom'
import { candidateAuth, useCandidateSession } from '@/features/authenticate'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

export function ResetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)
  const { signIn } = useCandidateSession()
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    if (password !== confirmation) { setMessage('Mật khẩu xác nhận không khớp.'); return }
    setPending(true)
    setMessage('')
    try {
      await candidateAuth.resetPassword({ token, password, confirmPassword: confirmation })
      signIn(null)
      window.history.replaceState(null, '', window.location.pathname)
      setComplete(true)
      setPassword('')
      setConfirmation('')
    } catch (failure) {
      setMessage(Object.values(failure.fields || {}).join(' ') || failure.message)
    } finally { setPending(false) }
  }
  return <main className="mx-auto max-w-md px-6 py-16">
    <title>Đặt lại mật khẩu | Job Tốt</title>
    <h1 className="mb-4 text-2xl font-bold">Đặt lại mật khẩu</h1>
    {complete ? <p role="status">Mật khẩu đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.</p>
      : !token ? <p role="alert">Liên kết khôi phục không hợp lệ. Vui lòng gửi yêu cầu mới từ trang đăng nhập.</p>
        : <form className="grid gap-4" onSubmit={submit}>
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} />
          <Label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</Label>
          <Input id="confirm-new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
          <Button type="submit" disabled={pending}>{pending ? 'Đang xử lý…' : 'Cập nhật mật khẩu'}</Button>
          {message && <p role="alert">{message}</p>}
        </form>}
    <Link to="/login" className="mt-6 inline-block text-orange-600 underline">Quay lại đăng nhập</Link>
  </main>
}
