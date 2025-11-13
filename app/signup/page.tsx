'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { translateError } from '@/lib/error-messages'

function SignUpForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/exams'
  const prefillIdentifier = searchParams.get('identifier') || ''

  // Preencher email ou CPF se vier da página de login
  useEffect(() => {
    if (prefillIdentifier) {
      const isCPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(prefillIdentifier) || /^\d{11}$/.test(prefillIdentifier)
      if (isCPF) {
        setFormData(prev => ({ ...prev, cpf: prefillIdentifier }))
      } else {
        setFormData(prev => ({ ...prev, email: prefillIdentifier }))
      }
    }
  }, [prefillIdentifier])

  const normalizeCPF = (cpf: string) => {
    return cpf.replace(/\D/g, '')
  }

  const formatCPF = (cpf: string) => {
    const numbers = normalizeCPF(cpf)
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const validateCPF = (cpf: string) => {
    const numbers = normalizeCPF(cpf)
    if (numbers.length !== 11) return false
    
    // Validação básica de CPF
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (digit !== parseInt(numbers.charAt(10))) return false
    
    return true
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value)
    } else if (field === 'phone') {
      value = formatPhone(value)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    const normalizedCPF = normalizeCPF(formData.cpf)
    if (!validateCPF(normalizedCPF)) {
      setError('CPF inválido')
      setLoading(false)
      return
    }

    try {
      // Criar usuário no Supabase Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            cpf: normalizedCPF,
            phone: formData.phone.replace(/\D/g, ''),
            birth_date: formData.birthDate
          }
        }
      })

      if (authError) {
        // Verificar se é erro de email já cadastrado
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.')
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta. Tente novamente.')
      }

      // Fazer login primeiro para ter o contexto de autenticação
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        // Se o login falhar imediatamente após signup, pode ser que precise confirmar email
        // Mas vamos tentar continuar mesmo assim
        console.warn('Login automático falhou após signup:', signInError)
      }

      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verificar se o perfil foi criado pelo trigger (agora com contexto de autenticação)
      let profileData = null
      let profileCheckError = null
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, cpf')
          .eq('id', authData.user.id)
          .single()
        
        if (data && !error) {
          profileData = data
          break
        }
        
        profileCheckError = error
        // Aguardar mais um pouco antes da próxima tentativa
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Se o perfil não foi criado pelo trigger, criar manualmente (agora com autenticação)
      if (!profileData) {
        // Tentar criar o perfil
        const { data: insertedProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.fullName,
            cpf: normalizedCPF,
            phone: formData.phone.replace(/\D/g, ''),
            birth_date: formData.birthDate
          })
          .select()
          .single()

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          
          // Se o erro for de CPF duplicado ou chave primária duplicada, 
          // significa que o trigger já criou (pode ter dados diferentes)
          if (profileError.message.includes('duplicate key') || 
              profileError.message.includes('already exists') ||
              profileError.code === '23505') {
            // Perfil já existe, verificar se conseguimos ler
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', authData.user.id)
              .single()
            
            if (existingProfile) {
              // Perfil existe, continuar normalmente
              console.log('Perfil já existe, continuando...')
            } else {
              throw new Error('Erro ao verificar perfil. Tente fazer login novamente.')
            }
          } else if (profileError.message.includes('row-level security')) {
            // Erro de RLS - o trigger deve ter criado mas não conseguimos ler
            // Aguardar mais um pouco e tentar ler novamente
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', authData.user.id)
              .single()
            
            if (!retryProfile) {
              throw new Error('Conta criada, mas houve um problema ao salvar seus dados. Entre em contato com o suporte.')
            }
          } else {
            // Outro erro - verificar se conseguimos ler o perfil mesmo assim
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', authData.user.id)
              .single()
            
            if (!existingProfile) {
              throw new Error('Conta criada, mas houve um problema ao salvar seus dados. Entre em contato com o suporte.')
            }
          }
        } else if (insertedProfile) {
          console.log('Perfil criado com sucesso:', insertedProfile)
        }
      }

      // Se ainda não fizemos login (caso tenha falhado antes), tentar novamente
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        const { error: signInErrorRetry } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (signInErrorRetry) {
          // Se o login falhar, mas a conta foi criada, redirecionar para login
          throw new Error('Conta criada com sucesso! Faça login para continuar.')
        }
      }

      router.push(redirectTo)
    } catch (error: any) {
      console.error('Erro completo no cadastro:', error)
      setError(translateError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro E2ELAB</CardTitle>
          <CardDescription>
            Preencha seus dados para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                minLength={6}
              />
            </div>

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
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({ redirectTo })
                  router.push(`/login?${params.toString()}`)
                }}
                className="text-primary hover:underline"
              >
                Faça login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

