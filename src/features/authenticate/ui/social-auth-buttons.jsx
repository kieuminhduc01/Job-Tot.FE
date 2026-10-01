import { Button } from '@/shared/ui/button'
import { ServiceNotice } from '@/shared/ui/service-notice'

export function SocialAuthButtons() {
  return <div className="social-auth-buttons">{['Google', 'LinkedIn', 'Facebook'].map((provider) => <ServiceNotice key={provider} title={`Đăng nhập với ${provider}`}><Button variant="outline" type="button" className="social-auth-button"><img src={`/images/${provider.toLowerCase()}.svg`} alt="" aria-hidden="true" />{provider}</Button></ServiceNotice>)}</div>
}
