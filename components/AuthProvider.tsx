'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Páginas públicas que não requerem autenticação
    const publicPages = ['/login', '/signup', '/', '/privacy', '/terms']
    
    let mounted = true
    let initialLoad = true
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      initialLoad = false

      // Redirect to login if not authenticated and not on public page
      if (!session && !publicPages.includes(pathname)) {
        setTimeout(() => {
          if (mounted) router.push('/login')
        }, 100)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      // Skip redirect on initial load
      if (initialLoad) {
        initialLoad = false
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Redirect to login if not authenticated and not on public page
      if (!session && !publicPages.includes(pathname)) {
        setTimeout(() => {
          if (mounted) router.push('/login')
        }, 100)
      } else if (session && (pathname === '/login' || pathname === '/signup')) {
        setTimeout(() => {
          if (mounted) router.push('/exams')
        }, 100)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

