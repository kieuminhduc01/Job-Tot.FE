import { useEffect, useRef, useState } from 'react'
import { candidateAuth } from '../api/candidate-auth'
import { SessionContext } from './session-context'

export function SessionProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const version = useRef(0)
  useEffect(() => {
    let active = true
    const current = version.current
    candidateAuth.me().then((value) => {
      if (active && current === version.current) setAccount(value)
    }).catch((failure) => {
      if (active && current === version.current && failure.status !== 401) setError(failure.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  function signIn(value) {
    version.current += 1
    setAccount(value)
    setError('')
  }
  async function signOut() {
    try { await candidateAuth.logout() } catch (failure) {
      if (failure.status !== 401) throw failure
    }
    signIn(null)
  }
  return <SessionContext.Provider value={{ account, loading, error, signIn, signOut }}>{children}</SessionContext.Provider>
}
