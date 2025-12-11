'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const isSubmittingRef = useRef(false) // Proteção contra múltiplas submissões
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
    
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Se a senha mudou, revalidar a confirmação de senha
    if (field === 'password' && touched.confirmPassword) {
      setTimeout(() => {
        validateField('confirmPassword', newFormData.confirmPassword, newFormData)
      }, 0)
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field as keyof typeof formData], formData)
  }

  const validateField = (field: string, value: string, currentFormData = formData) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          errors.fullName = 'O campo de nome é obrigatório.'
        }
        break
      case 'cpf':
        if (!value.trim()) {
          errors.cpf = 'O campo de CPF é obrigatório.'
        } else {
          const normalizedCPF = normalizeCPF(value)
          if (!validateCPF(normalizedCPF)) {
            errors.cpf = 'CPF inválido.'
          }
        }
        break
      case 'email':
        if (!value.trim()) {
          errors.email = 'O campo de e-mail é obrigatório.'
        } else if (!validateEmail(value)) {
          errors.email = 'E-mail inválido. Verifique o formato do e-mail.'
        }
        break
      case 'phone':
        if (!value.trim()) {
          errors.phone = 'O campo de telefone é obrigatório.'
        }
        break
      case 'birthDate':
        if (!value.trim()) {
          errors.birthDate = 'O campo de data de nascimento é obrigatório.'
        }
        break
      case 'password':
        if (!value.trim()) {
          errors.password = 'O campo de senha é obrigatório.'
        } else if (value.length < 6) {
          errors.password = 'A senha deve ter pelo menos 6 caracteres.'
        }
        break
      case 'confirmPassword':
        if (!value.trim()) {
          errors.confirmPassword = 'Confirme sua senha.'
        } else if (value !== currentFormData.password) {
          errors.confirmPassword = 'As senhas não coincidem.'
        }
        break
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Proteção contra múltiplas submissões
    if (isSubmittingRef.current || loading) {
      return
    }
    
    isSubmittingRef.current = true
    setLoading(true)
    setError(null)

    // Marcar todos os campos como touched para mostrar erros
    const allFields = ['fullName', 'cpf', 'email', 'phone', 'birthDate', 'password', 'confirmPassword']
    setTouched(prev => {
      const newTouched = { ...prev }
      allFields.forEach(field => {
        newTouched[field] = true
      })
      return newTouched
    })

    // Validar todos os campos
    const fieldsToValidate = ['fullName', 'cpf', 'email', 'phone', 'birthDate', 'password', 'confirmPassword']
    const errors: Record<string, string> = {}

    fieldsToValidate.forEach(field => {
      const value = formData[field as keyof typeof formData]
      validateField(field, value, formData)
    })

    // Aguardar um pouco para que os erros sejam atualizados
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verificar se há erros após validação
    const hasErrors = Object.keys(fieldErrors).length > 0 || 
                     !formData.fullName.trim() ||
                     !formData.cpf.trim() ||
                     !formData.email.trim() ||
                     !formData.phone.trim() ||
                     !formData.birthDate.trim() ||
                     !formData.password.trim() ||
                     !formData.confirmPassword.trim() ||
                     formData.password !== formData.confirmPassword ||
                     formData.password.length < 6 ||
                     !validateEmail(formData.email) ||
                     !validateCPF(normalizeCPF(formData.cpf))

    if (hasErrors) {
      // Revalidar todos os campos para garantir que os erros estejam visíveis
      const finalErrors: Record<string, string> = {}
      
      if (!formData.fullName.trim()) {
        finalErrors.fullName = 'O campo de nome é obrigatório.'
      }
      if (!formData.cpf.trim()) {
        finalErrors.cpf = 'O campo de CPF é obrigatório.'
      } else if (!validateCPF(normalizeCPF(formData.cpf))) {
        finalErrors.cpf = 'CPF inválido.'
      }
      if (!formData.email.trim()) {
        finalErrors.email = 'O campo de e-mail é obrigatório.'
      } else if (!validateEmail(formData.email)) {
        finalErrors.email = 'E-mail inválido. Verifique o formato do e-mail.'
      }
      if (!formData.phone.trim()) {
        finalErrors.phone = 'O campo de telefone é obrigatório.'
      }
      if (!formData.birthDate.trim()) {
        finalErrors.birthDate = 'O campo de data de nascimento é obrigatório.'
      }
      if (!formData.password.trim()) {
        finalErrors.password = 'O campo de senha é obrigatório.'
      } else if (formData.password.length < 6) {
        finalErrors.password = 'A senha deve ter pelo menos 6 caracteres.'
      }
      if (!formData.confirmPassword.trim()) {
        finalErrors.confirmPassword = 'Confirme sua senha.'
      } else if (formData.password !== formData.confirmPassword) {
        finalErrors.confirmPassword = 'As senhas não coincidem.'
      }

      setFieldErrors(finalErrors)
      setLoading(false)
      isSubmittingRef.current = false
      return
    }

    try {
      // Limpar e normalizar email
      const cleanEmail = formData.email.trim().toLowerCase()
      
      // Criar usuário no Supabase Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
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
        // Verificar se é erro de rate limit - passar o erro completo para translateError tratar
        // O translateError vai extrair o código e a mensagem corretamente
        throw authError
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta. Tente novamente.')
      }

      // Fazer login primeiro para ter o contexto de autenticação
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: formData.password
      })

      if (signInError) {
        // Se o login falhar imediatamente após signup, pode ser que precise confirmar email
        // Mas vamos tentar continuar mesmo assim
        console.warn('Login automático falhou após signup:', signInError)
      }

      // Criar/atualizar perfil usando rota interna com chave service_role
      const profilePayload = {
        userId: authData.user.id,
        fullName: formData.fullName,
        cpf: normalizedCPF,
        phone: formData.phone.replace(/\D/g, ''),
        birthDate: formData.birthDate
      }

      const profileResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profilePayload)
      })

      let profileResult: { success?: boolean; error?: string } | null = null
      try {
        profileResult = await profileResponse.json()
      } catch {
        // Ignorar erro de parse e tratar abaixo como falha genérica
      }

      if (!profileResponse.ok || !profileResult?.success) {
        const message = profileResult?.error || 'Conta criada, mas houve um problema ao salvar seus dados. Entre em contato com o suporte.'
        throw new Error(message)
      }

      // Se ainda não fizemos login (caso tenha falhado antes), tentar novamente
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        const { error: signInErrorRetry } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: formData.password
        })

        if (signInErrorRetry) {
          // Se o login falhar, mas a conta foi criada, redirecionar para login
          throw new Error('Conta criada com sucesso! Faça login para continuar.')
        }
      }

      const params = new URLSearchParams({
        redirectTo,
        signup: 'success',
        identifier: cleanEmail
      })
      router.push(`/login?${params.toString()}`)
    } catch (error: any) {
      console.error('Erro completo no cadastro:', error)
      // Garantir que o erro seja tratado corretamente
      const translatedError = translateError(error)
      setError(translatedError)
    } finally {
      setLoading(false)
      // Aguardar um pouco antes de permitir nova submissão para evitar rate limit
      setTimeout(() => {
        isSubmittingRef.current = false
      }, 1000)
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
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={fieldErrors.fullName ? 'border-destructive' : ''}
              />
              {fieldErrors.fullName && (
                <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                onBlur={() => handleBlur('cpf')}
                maxLength={14}
                className={fieldErrors.cpf ? 'border-destructive' : ''}
              />
              {fieldErrors.cpf && (
                <p className="text-sm text-destructive">{fieldErrors.cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                maxLength={15}
                className={fieldErrors.phone ? 'border-destructive' : ''}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-destructive">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                onBlur={() => handleBlur('birthDate')}
                max={new Date().toISOString().split('T')[0]}
                className={fieldErrors.birthDate ? 'border-destructive' : ''}
              />
              {fieldErrors.birthDate && (
                <p className="text-sm text-destructive">{fieldErrors.birthDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={fieldErrors.password ? 'border-destructive' : ''}
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || isSubmittingRef.current}
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

