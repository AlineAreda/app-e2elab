'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { translateError } from '@/lib/error-messages'

function LoginForm() {
  const [identifier, setIdentifier] = useState('') // CPF ou email
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingUser, setCheckingUser] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/exams'

  // Verificar se o identificador é CPF ou email
  const isCPF = (value: string) => {
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/
    const numbersOnly = value.replace(/\D/g, '')
    return numbersOnly.length === 11 && cpfRegex.test(value) || numbersOnly.length === 11
  }

  const normalizeCPF = (cpf: string) => {
    return cpf.replace(/\D/g, '')
  }

  const checkUserExists = async (identifier: string) => {
    try {
      // Se for CPF, buscar no perfil usando RPC
      if (isCPF(identifier)) {
        const normalizedCPF = normalizeCPF(identifier)
        const { data: emailData, error } = await supabase
          .rpc('get_user_email_by_cpf', { cpf_param: normalizedCPF })

        if (error || !emailData) {
          return null
        }

        return emailData
      } else {
        // Se for email, verificar se existe tentando fazer login
        // Nota: Esta é uma verificação básica, pode não ser 100% precisa
        return identifier
      }
    } catch (error) {
      return null
    }
  }

  const handleIdentifierBlur = async () => {
    if (!identifier) return

    setCheckingUser(true)
    try {
      const email = await checkUserExists(identifier)
      if (!email) {
        // Usuário não existe, redirecionar para cadastro
        const params = new URLSearchParams({
          identifier: identifier,
          redirectTo: redirectTo
        })
        router.push(`/signup?${params.toString()}`)
      }
    } catch (error) {
      // Ignorar erro, deixar tentar login
    } finally {
      setCheckingUser(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let email = identifier

      // Se for CPF, buscar email do perfil usando RPC
      if (isCPF(identifier)) {
        const normalizedCPF = normalizeCPF(identifier)
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_user_email_by_cpf', { cpf_param: normalizedCPF })

        if (emailError || !emailData) {
          throw new Error('CPF não encontrado. Faça seu cadastro primeiro.')
        }

        email = emailData
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push(redirectTo)
    } catch (error: any) {
      setError(translateError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">E2ELAB</CardTitle>
          <CardDescription>
            Entre com CPF ou e-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="identifier">CPF ou E-mail</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="000.000.000-00 ou seu@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={handleIdentifierBlur}
                required
                disabled={checkingUser}
              />
              {checkingUser && (
                <p className="text-xs text-muted-foreground">Verificando...</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || checkingUser}
              className="w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({ redirectTo })
                  router.push(`/signup?${params.toString()}`)
                }}
                className="text-primary hover:underline"
              >
                Cadastre-se
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
