const base = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/candidate/auth`

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${base}${path}`, { ...options, credentials: 'include' })
  } catch {
    throw new Error('Không thể kết nối máy chủ. Vui lòng thử lại.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const fallback = {
      400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.',
      401: 'Email, số điện thoại hoặc mật khẩu không đúng.',
      403: 'Tài khoản không có quyền truy cập.',
      409: 'Email hoặc số điện thoại đã được đăng ký.',
      429: 'Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.',
    }
    const error = new Error(response.status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.' : data?.detail || fallback[response.status] || 'Yêu cầu không thành công.')
    error.status = response.status
    error.fields = Object.fromEntries(Object.entries(data?.errors || {}).map(([key, value]) => {
      const name = key.charAt(0).toLowerCase() + key.slice(1)
      return [name === 'emailOrPhone' ? 'identity' : name, Array.isArray(value) ? value.join(' ') : value]
    }))
    throw error
  }
  return data
}

async function post(path, body) {
  const csrf = await request('/csrf')
  if (!csrf?.token || !csrf?.headerName) throw new Error('Không lấy được mã xác thực yêu cầu. Vui lòng thử lại.')
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
    body: JSON.stringify(body),
  })
}

export const candidateAuth = {
  me: () => request('/me'),
  login: (values) => post('/login', values),
  register: (values) => post('/register', values),
  logout: () => post('/logout', {}),
}
