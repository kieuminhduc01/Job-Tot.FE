import { createBrowserRouter, Navigate, Link } from 'react-router-dom'
import { JobsPage } from '@/pages/jobs'
import { RootLayout } from './root-layout'
import { AuthPage } from '@/pages/auth'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/register" replace /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/login', element: <AuthPage mode="login" /> },
  {
    element: <RootLayout />,
    children: [
      { path: 'jobs', element: <JobsPage /> },
      { path: 'saved-jobs', element: <JobsPage savedOnly /> },
      { path: '*', element: <main className="mx-auto max-w-6xl px-6 py-24"><h1 className="mb-4 text-3xl font-bold">Không tìm thấy trang</h1><Link className="underline" to="/jobs">Quay lại danh sách việc làm</Link></main> },
    ],
  },
])
