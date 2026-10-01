import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateAuth } from '../api/candidate-auth'
import { useCandidateSession } from '../model/session-context'
import { ArrowRight, ContactRound, AtSign, LockKeyhole, CircleUserRound, Mail } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { AuthField } from './auth-field'
import { ForgotPasswordDialog } from './forgot-password-dialog'
import { validateAuth } from '../model/validation'

export function CredentialsForm({ mode, role }) {
  const register = mode === 'register'
  const [values, setValues] = useState({ fullName: '', identity: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [remember, setRemember] = useState(false)
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const navigate = useNavigate()
  const { signIn } = useCandidateSession()
  function field(name) {
    return { value: values[name], error: errors[name], onChange: (event) => { setValues({ ...values, [name]: event.target.value }); setErrors({ ...errors, [name]: undefined }); setMessage('') } }
  }
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    setMessage('')
    const nextErrors = validateAuth(values, mode)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.getElementById(Object.keys(nextErrors)[0])?.focus(); return }
    if (role !== 'candidate') {
      setMessage('Chức năng tài khoản nhà tuyển dụng chưa được hỗ trợ.')
      return
    }
    submitting.current = true
    setPending(true)
    try {
      const body = { emailOrPhone: values.identity.trim(), password: values.password }
      const session = register
        ? await candidateAuth.register({ ...body, fullName: values.fullName.trim(), confirmPassword: values.confirmPassword })
        : await candidateAuth.login({ ...body, rememberMe: remember })
      signIn(session.account)
      navigate('/jobs', { replace: true })
    } catch (failure) {
      setErrors(failure.fields || {})
      setMessage(failure.message)
    } finally {
      submitting.current = false
      setPending(false)
    }
  }
  return <form noValidate onSubmit={submit} className={`credentials-form ${register ? 'register-form' : 'login-form'}`}>
    {register && <AuthField name="fullName" label="Họ và tên" icon={ContactRound} autoComplete="name" placeholder="Nguyễn Văn A" {...field('fullName')} />}
    <AuthField name="identity" label={register ? 'Email hoặc số điện thoại' : 'Email hoặc Số điện thoại'} icon={register ? AtSign : Mail} autoComplete="username" placeholder={register ? 'email@example.com hoặc 0912xxx' : 'ungvien@jobtot.vn'} {...field('identity')} />
    <div className={register ? 'password-fields' : ''}>
      <AuthField name="password" label="Mật khẩu" icon={LockKeyhole} password autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'} trailing={!register && <ForgotPasswordDialog />} {...field('password')} />
      {register && <AuthField name="confirmPassword" label="Xác nhận mật khẩu" icon={CircleUserRound} password autoComplete="new-password" placeholder="Nhập lại mật khẩu" {...field('confirmPassword')} />}
    </div>
    {!register && <div className="remember-login"><Checkbox id="remember" checked={remember} onCheckedChange={setRemember} /><Label htmlFor="remember">Ghi nhớ đăng nhập trên thiết bị này</Label></div>}
    <Button type="submit" disabled={pending} className="orange-button auth-submit">{pending ? 'Đang xử lý…' : register ? 'Đăng ký tài khoản miễn phí' : 'Đăng nhập ngay'}<ArrowRight /></Button>
    {message && <p role="status" className="auth-form-message">{message}</p>}
  </form>
}
