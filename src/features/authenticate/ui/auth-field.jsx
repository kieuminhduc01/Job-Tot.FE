import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'

export function AuthField({ name, label, icon: Icon, password = false, error, trailing, ...props }) {
  const [visible, setVisible] = useState(false)
  return <div className="auth-field"><div className="field-label-row"><Label htmlFor={name}>{label} <span>*</span></Label>{trailing}</div><div className="auth-input-wrap"><Icon className="field-icon" aria-hidden="true" /><Input id={name} name={name} type={password && !visible ? 'password' : 'text'} className="auth-input" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} />{password && <Button type="button" variant="ghost" size="icon" className="password-toggle" aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button>}</div>{error && <p className="field-error" id={`${name}-error`}>{error}</p>}</div>
}
