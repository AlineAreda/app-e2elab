'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

/**
 * Verifica se o caminho é uma página pública (não requer autenticação)
 * DECISÃO: Função clara e extensível para adicionar novas páginas públicas
 */
function isPublicPath(path: string): boolean {
  return (
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms')
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // DECISÃO: Ref para pathname evita closure stale dentro do callback onAuthStateChange
  // Atualizado sempre que pathname muda, mas acessível dentro do callback assíncrono
  const pathnameRef = useRef(pathname)
  
  // DECISÃO: Ref para controle de inicialização evita múltiplos redirects durante carga inicial
  // Só permite redirects após getSession() ter sido chamado e estado inicial definido
  const didInitRef = useRef(false)

  // Atualizar pathnameRef sempre que pathname mudar
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    let mounted = true
    
    // DECISÃO: getSession() é chamado uma vez para definir estado inicial
    // Após isso, didInitRef=true permite que onAuthStateChange faça redirects
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      // Atualizar estado inicial
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Marcar inicialização como completa
      didInitRef.current = true

      // DECISÃO: Após inicialização, verificar se precisa redirecionar
      // Se não autenticado e não está em página pública -> /login
      if (!session && !isPublicPath(pathnameRef.current)) {
        router.push('/login')
      }
      // Se autenticado e está em /login ou /signup -> /exams
      else if (session && (pathnameRef.current === '/login' || pathnameRef.current === '/signup')) {
        router.push('/exams')
      }
    })

    // DECISÃO: onAuthStateChange escuta mudanças de autenticação após carga inicial
    // Usa pathnameRef.current para evitar closure stale
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      // DECISÃO: Se ainda não inicializou, apenas atualizar estado sem redirects
      // Isso evita redirects durante a carga inicial antes de getSession() completar
      if (!didInitRef.current) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      
      // Atualizar estado de autenticação
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // DECISÃO: Redirecionamentos após inicialização completa
      // Usa pathnameRef.current para garantir valor atualizado do pathname
      const currentPath = pathnameRef.current
      
      // Se não autenticado e não está em página pública -> /login
      if (!session && !isPublicPath(currentPath)) {
        router.push('/login')
      }
      // Se autenticado e está em /login ou /signup -> /exams
      else if (session && (currentPath === '/login' || currentPath === '/signup')) {
        router.push('/exams')
      }
      // DECISÃO: Não redirecionar em outros casos para evitar loops
      // Usuário autenticado em página pública pode permanecer lá
      // Usuário não autenticado em página pública pode permanecer lá
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router]) // DECISÃO: pathname removido das dependências - usa ref ao invés disso

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
