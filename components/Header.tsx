'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Calendar, LogOut, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isLoginPage = pathname === '/login' || pathname === '/signup'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        <Link href={user ? "/exams" : "/"} className="flex items-center space-x-2 group py-2">
          <Image
            src="/logo.svg"
            alt="E2ELAB Logo"
            width={180}
            height={60}
            priority
            className="h-auto"
          />
        </Link>
        
        {!isLoginPage && user && (
          <>
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/exams">
                <Button 
                  variant={pathname === '/exams' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  Exames
                </Button>
              </Link>
              <Link href="/me/appointments">
                <Button 
                  variant={pathname === '/me/appointments' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Meus Agendamentos
                </Button>
              </Link>
              <Link href="/privacy">
                <Button 
                  variant={pathname === '/privacy' ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Privacidade
                </Button>
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </>
        )}

        {!isLoginPage && !user && (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/exams"
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <Button 
                variant={pathname === '/exams' ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                Exames
              </Button>
            </Link>
            <Link 
              href="/me/appointments"
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <Button 
                variant={pathname === '/me/appointments' ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                <Calendar className="h-4 w-4" />
                Meus Agendamentos
              </Button>
            </Link>
            <Link 
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <Button 
                variant={pathname === '/privacy' ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                <Shield className="h-4 w-4" />
                Política de Privacidade
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
