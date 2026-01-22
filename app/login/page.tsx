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
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/exams'
  const signupSuccess = searchParams.get('signup') === 'success'
  const emailConfirmationRequired = searchParams.get('emailConfirmation') === 'required'
  const prefillIdentifier = searchParams.get('identifier') || ''

  // Verificar se o identificador é CPF ou email
  // DECISÃO: CPF só é considerado quando NÃO parecer email e tiver 11 dígitos numéricos
  const isCPF = (value: string) => {
    // Primeiro verificar se parece email (tem @ e domínio)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(value.trim())) {
      return false
    }
    
    // Se não é email, verificar se tem exatamente 11 dígitos numéricos
    const numbersOnly = value.replace(/\D/g, '')
    if (numbersOnly.length !== 11) {
      return false
    }
    
    // Verificar se o formato está correto (pode ter formatação ou não)
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/
    return cpfRegex.test(value.trim()) || numbersOnly.length === 11
  }

  const normalizeCPF = (cpf: string) => {
    return cpf.replace(/\D/g, '')
  }

  useEffect(() => {
    if (prefillIdentifier) {
      setIdentifier(prefillIdentifier)
    }
  }, [prefillIdentifier])

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

        // DECISÃO: Se RPC retornar null (CPF não encontrado), redirecionar para signup
        // Isso evita falsos negativos e permite cadastro direto
        if (emailError || !emailData) {
          const params = new URLSearchParams({
            identifier: identifier,
            redirectTo: redirectTo
          })
          router.push(`/signup?${params.toString()}`)
          return
        }

        email = emailData
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // DECISÃO: Usar translateError apenas para erros reais de login
        // Mensagens de erro de validação devem ser amigáveis
        throw authError
      }

      router.push(redirectTo)
    } catch (error: any) {
      // DECISÃO: translateError apenas para erros de autenticação do Supabase
      // Outros erros devem ter mensagens amigáveis já definidas
      const errorMessage = error?.code || error?.message 
        ? translateError(error)
        : 'Erro ao fazer login. Tente novamente.'
      
      setError(errorMessage)
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
                required
              />
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
            {signupSuccess && emailConfirmationRequired && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
                <p className="font-medium">Confirme seu e-mail para fazer login</p>
                <p className="mt-1 text-xs">Enviamos um e-mail de confirmação. Verifique sua caixa de entrada e clique no link para confirmar sua conta antes de fazer login.</p>
              </div>
            )}
            {signupSuccess && !emailConfirmationRequired && (
              <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                Conta criada com sucesso! Faça login para continuar.
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
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

