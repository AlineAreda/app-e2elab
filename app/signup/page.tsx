'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { translateError } from '@/lib/error-messages'
import { Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const formatDate = (date: string) => {
    // Remove tudo que não é número
    const numbers = date.replace(/\D/g, '')
    
    // Limita a 8 dígitos (ddMMyyyy)
    const limitedNumbers = numbers.slice(0, 8)
    
    // Aplica a máscara dd/MM/yyyy
    if (limitedNumbers.length <= 2) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 4) {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`
    } else {
      return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2, 4)}/${limitedNumbers.slice(4)}`
    }
  }

  const convertDateToISO = (date: string): string => {
    // Converte dd/MM/yyyy para yyyy-MM-dd
    const parts = date.split('/')
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return date
  }

  const validateCPF = (cpf: string) => {
    const numbers = normalizeCPF(cpf)
    if (numbers.length !== 11) return false
    
    // Não aceitar CPFs óbvios inválidos (ex.: 000.000.000-00, 111.111.111-11, etc)
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    // Rejeitar CPFs com todos os dígitos iguais
    if (numbers === '00000000000' || 
        numbers === '11111111111' || 
        numbers === '22222222222' ||
        numbers === '33333333333' ||
        numbers === '44444444444' ||
        numbers === '55555555555' ||
        numbers === '66666666666' ||
        numbers === '77777777777' ||
        numbers === '88888888888' ||
        numbers === '99999999999') {
      return false
    }
    
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
    } else if (field === 'birthDate') {
      value = formatDate(value)
    } else if (field === 'fullName') {
      // Normalizar nome completo: remover espaços duplicados (mas manter espaços simples)
      // Não remover espaços durante digitação, apenas normalizar ao final
      // Permitir que o usuário digite normalmente
    } else if (field === 'email') {
      // Remover espaços do email
      value = value.replace(/\s/g, '')
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
      case 'fullName': {
        const error = validateFullName(value)
        if (error) errors.fullName = error
        break
      }
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
      case 'phone': {
        const error = validatePhone(value)
        if (error) errors.phone = error
        break
      }
      case 'birthDate': {
        const error = validateBirthDate(value)
        if (error) errors.birthDate = error
        break
      }
      case 'password': {
        const error = validatePassword(value, currentFormData)
        if (error) errors.password = error
        break
      }
      case 'confirmPassword':
        if (!value.trim()) {
          errors.confirmPassword = 'Confirme sua senha.'
        } else if (value !== currentFormData.password) {
          errors.confirmPassword = 'A confirmação de senha não confere com a senha informada.'
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

  const validateFullName = (name: string): string | null => {
    const trimmed = name.trim()
    
    if (!trimmed) {
      return 'O campo de nome é obrigatório.'
    }
    
    // Mínimo 3 caracteres desconsiderando espaços nas extremidades
    if (trimmed.length < 3) {
      return 'O nome deve conter no mínimo 3 caracteres.'
    }
    
    // Deve conter pelo menos um espaço entre nome e sobrenome
    if (!trimmed.includes(' ')) {
      return 'Informe seu nome completo (nome e sobrenome).'
    }
    
    // Não deve permitir apenas números ou caracteres especiais
    const hasLetter = /[a-zA-ZÀ-ÿ]/.test(trimmed)
    if (!hasLetter) {
      return 'O nome deve conter pelo menos uma letra.'
    }
    
    // Verificar se não é apenas números
    const onlyNumbers = /^\d+$/.test(trimmed.replace(/\s/g, ''))
    if (onlyNumbers) {
      return 'O nome não pode conter apenas números.'
    }
    
    return null
  }

  const validatePhone = (phone: string): string | null => {
    const numbers = phone.replace(/\D/g, '')
    
    if (!phone.trim()) {
      return 'O campo de telefone é obrigatório.'
    }
    
    // DDD com 2 dígitos + número com 9 dígitos (celular) = 11 dígitos
    // Ou DDD com 2 dígitos + número com 8 dígitos (fixo) = 10 dígitos
    if (numbers.length !== 10 && numbers.length !== 11) {
      return 'Informe um telefone válido no formato (00) 00000-0000.'
    }
    
    // DDD deve ter 2 dígitos
    const ddd = numbers.substring(0, 2)
    if (ddd.length !== 2 || !/^[1-9][0-9]$/.test(ddd)) {
      return 'Informe um telefone válido no formato (00) 00000-0000.'
    }
    
    return null
  }

  const validateBirthDate = (date: string): string | null => {
    if (!date.trim()) {
      return 'O campo de data de nascimento é obrigatório.'
    }
    
    // Validar formato dd/MM/yyyy
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = date.match(dateRegex)
    
    if (!match) {
      return 'Informe uma data válida no formato dd/mm/aaaa.'
    }
    
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)
    
    // Validar mês
    if (month < 1 || month > 12) {
      return 'Informe uma data válida no formato dd/mm/aaaa.'
    }
    
    // Validar dia
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) {
      return 'Informe uma data válida no formato dd/mm/aaaa.'
    }
    
    // Converter para Date object
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    birthDate.setHours(0, 0, 0, 0)
    
    // Verificar se é uma data válida
    if (isNaN(birthDate.getTime())) {
      return 'Informe uma data válida no formato dd/mm/aaaa.'
    }
    
    // Não pode ser data futura
    if (birthDate > today) {
      return 'A data de nascimento não pode ser futura.'
    }
    
    // Não pode ser muito antiga (mais de 120 anos)
    const maxAge = new Date()
    maxAge.setFullYear(maxAge.getFullYear() - 120)
    if (birthDate < maxAge) {
      return 'A data de nascimento informada é inválida.'
    }
    
    // Idade mínima: 16 anos
    const minAge = new Date()
    minAge.setFullYear(minAge.getFullYear() - 16)
    if (birthDate > minAge) {
      return 'Para menores de 16 anos, o cadastro deve ser realizado pelo responsável.'
    }
    
    return null
  }

  const validatePassword = (password: string, formData: typeof formData): string | null => {
    if (!password.trim()) {
      return 'O campo de senha é obrigatório.'
    }
    
    // Mínimo 6 caracteres
    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.'
    }
    
    // Deve conter pelo menos uma letra e um número
    const hasLetter = /[a-zA-ZÀ-ÿ]/.test(password)
    const hasNumber = /\d/.test(password)
    
    if (!hasLetter || !hasNumber) {
      return 'A senha deve ter pelo menos 6 caracteres e combinar letras e números.'
    }
    
    // Não pode ser igual ao CPF
    const normalizedCPF = normalizeCPF(formData.cpf)
    if (password === normalizedCPF || password === formData.cpf) {
      return 'A senha não pode ser igual ao CPF.'
    }
    
    // Não pode ser igual ao e-mail
    if (password.toLowerCase() === formData.email.toLowerCase().trim()) {
      return 'A senha não pode ser igual ao e-mail.'
    }
    
    // Não pode ser igual ao nome completo (normalizado)
    const normalizedName = formData.fullName.trim().toLowerCase().replace(/\s+/g, '')
    if (password.toLowerCase() === normalizedName) {
      return 'A senha não pode ser igual ao nome completo.'
    }
    
    return null
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
      
      const fullNameError = validateFullName(formData.fullName)
      if (fullNameError) finalErrors.fullName = fullNameError
      
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
      
      const phoneError = validatePhone(formData.phone)
      if (phoneError) finalErrors.phone = phoneError
      
      const birthDateError = validateBirthDate(formData.birthDate)
      if (birthDateError) finalErrors.birthDate = birthDateError
      
      const passwordError = validatePassword(formData.password, formData)
      if (passwordError) finalErrors.password = passwordError
      
      if (!formData.confirmPassword.trim()) {
        finalErrors.confirmPassword = 'Confirme sua senha.'
      } else if (formData.password !== formData.confirmPassword) {
        finalErrors.confirmPassword = 'A confirmação de senha não confere com a senha informada.'
      }

      setFieldErrors(finalErrors)
      setLoading(false)
      isSubmittingRef.current = false
      return
    }

    try {
      // Limpar e normalizar email
      const cleanEmail = formData.email.trim().toLowerCase()
      
      // Normalizar CPF (remover formatação)
      const normalizedCPF = normalizeCPF(formData.cpf)
      
      // Normalizar nome completo (remover espaços duplicados)
      const normalizedFullName = formData.fullName.trim().replace(/\s+/g, ' ')
      
      // Criar usuário no Supabase Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
            data: {
            full_name: normalizedFullName,
            cpf: normalizedCPF,
            phone: formData.phone.replace(/\D/g, ''),
            birth_date: convertDateToISO(formData.birthDate)
          }
        }
      })

      if (authError) {
        // Verificar se é erro de email já cadastrado
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('Já existe uma conta cadastrada com este e-mail.')
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
      // Converter data de dd/MM/yyyy para yyyy-MM-dd para o backend
      const birthDateISO = convertDateToISO(formData.birthDate)
      
      const profilePayload = {
        userId: authData.user.id,
        fullName: normalizedFullName,
        cpf: normalizedCPF,
        phone: formData.phone.replace(/\D/g, ''),
        birthDate: birthDateISO
      }

      const profileResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profilePayload)
      })

      let profileResult: { success?: boolean; error?: string; code?: string; details?: string } | null = null
      try {
        profileResult = await profileResponse.json()
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta do perfil:', parseError)
        // Se não conseguir fazer parse, tentar ler o texto da resposta
        const textResponse = await profileResponse.text()
        console.error('Resposta da API (texto):', textResponse)
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.')
      }

      if (!profileResponse.ok || !profileResult?.success) {
        const errorCode = profileResult?.code
        let message = profileResult?.error || 'Conta criada, mas houve um problema ao salvar seus dados. Entre em contato com o suporte.'
        
        // Mensagens específicas por código de erro
        if (errorCode === 'CPF_DUPLICATED' || profileResponse.status === 409) {
          message = 'Já existe uma conta cadastrada para este CPF.'
        } else if (errorCode === 'CPF_CHECK_ERROR') {
          message = 'Erro ao validar CPF. Verifique se o CPF está correto e tente novamente.'
        } else if (profileResponse.status === 400) {
          message = profileResult?.error || 'Dados inválidos. Verifique os campos preenchidos.'
        } else if (profileResponse.status === 500) {
          message = profileResult?.error || 'Erro no servidor. Tente novamente em alguns instantes.'
        }
        
        console.error('Erro ao criar perfil:', {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          result: profileResult,
          payload: profilePayload
        })
        
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
      
      // Limpar senhas após erro (por segurança)
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }))
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
                type="text"
                placeholder="dd/mm/aaaa"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                onBlur={() => handleBlur('birthDate')}
                maxLength={10}
                className={fieldErrors.birthDate ? 'border-destructive' : ''}
              />
              {fieldErrors.birthDate && (
                <p className="text-sm text-destructive">{fieldErrors.birthDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={fieldErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={fieldErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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

