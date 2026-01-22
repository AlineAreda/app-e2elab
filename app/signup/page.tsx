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

  /** Normaliza e-mail: remove espaços, caracteres invisíveis (ex.: copy-paste) e deixa em minúsculas. */
  const normalizeEmail = (email: string) => {
    return email
      .replace(/\s/g, '')
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
      .trim()
      .toLowerCase()
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
      // Remover espaços e caracteres invisíveis (ex.: copy-paste)
      value = value.replace(/\s/g, '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
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
      case 'email': {
        const normalized = normalizeEmail(value)
        if (!normalized) {
          errors.email = 'O campo de e-mail é obrigatório.'
        } else if (!validateEmail(normalized)) {
          errors.email = 'E-mail inválido. Verifique o formato do e-mail.'
        }
        break
      }
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
    return emailRegex.test(email.trim().toLowerCase())
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

  const validatePassword = (password: string, formData: {
    fullName: string
    cpf: string
    email: string
    phone: string
    birthDate: string
    password: string
    confirmPassword: string
  }): string | null => {
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

  /**
   * Valida todos os campos do formulário e retorna objeto de erros
   * DECISÃO: Não depende de state assíncrono - validação síncrona local
   * Retorna Record<field, errorMessage> - vazio se sem erros
   */
  const validateAll = (currentFormData: {
    fullName: string
    cpf: string
    email: string
    phone: string
    birthDate: string
    password: string
    confirmPassword: string
  }): Record<string, string> => {
    const errors: Record<string, string> = {}

    // Validar nome completo
    const fullNameError = validateFullName(currentFormData.fullName)
    if (fullNameError) errors.fullName = fullNameError

    // Validar CPF
    if (!currentFormData.cpf.trim()) {
      errors.cpf = 'O campo de CPF é obrigatório.'
    } else {
      const normalizedCPF = normalizeCPF(currentFormData.cpf)
      if (!validateCPF(normalizedCPF)) {
        errors.cpf = 'CPF inválido.'
      }
    }

    // Validar email (usa normalização para evitar falsos "inválido" por espaços/caracteres invisíveis)
    const normalizedEmail = normalizeEmail(currentFormData.email)
    if (!normalizedEmail) {
      errors.email = 'O campo de e-mail é obrigatório.'
    } else if (!validateEmail(normalizedEmail)) {
      errors.email = 'E-mail inválido. Verifique o formato do e-mail.'
    }

    // Validar telefone
    const phoneError = validatePhone(currentFormData.phone)
    if (phoneError) errors.phone = phoneError

    // Validar data de nascimento
    const birthDateError = validateBirthDate(currentFormData.birthDate)
    if (birthDateError) errors.birthDate = birthDateError

    // Validar senha
    const passwordError = validatePassword(currentFormData.password, currentFormData)
    if (passwordError) errors.password = passwordError

    // Validar confirmação de senha
    if (!currentFormData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirme sua senha.'
    } else if (currentFormData.password !== currentFormData.confirmPassword) {
      errors.confirmPassword = 'A confirmação de senha não confere com a senha informada.'
    }

    return errors
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

    // DECISÃO: Validar todos os campos usando função local validateAll
    // Não depende de state assíncrono - validação síncrona retorna objeto de erros diretamente
    const validationErrors = validateAll(formData)

    // Se houver erros, atualizar state e bloquear submit
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setLoading(false)
      isSubmittingRef.current = false
      return
    }

    try {
      // Limpar e normalizar email (remove espaços, caracteres invisíveis, minúsculas)
      const cleanEmail = normalizeEmail(formData.email)
      
      // Normalizar CPF (remover formatação)
      const normalizedCPF = normalizeCPF(formData.cpf)
      
      // Normalizar nome completo (remover espaços duplicados)
      const normalizedFullName = formData.fullName.trim().replace(/\s+/g, ' ')
      
      // Criar usuário no Supabase Auth (sem envio de e-mail de confirmação se
      // "Enable email confirmations" estiver desabilitado em Supabase > Authentication)
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
        throw authError
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar a conta. Tente novamente.')
      }

      // Verificar se o email precisa ser confirmado
      // Se authData.session é null, significa que o email não foi confirmado
      const emailNeedsConfirmation = !authData.session

      // Criar/atualizar perfil usando rota interna (funciona mesmo sem sessão confirmada)
      // O profile será criado usando service_role no backend, então não precisa de sessão
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

      // DECISÃO: Parse robusto - usar response.text() uma vez e depois JSON.parse
      // Evita erro "body already used" que pode ocorrer ao chamar .json() e depois .text()
      let profileResult: { ok?: boolean; error?: string; code?: string; details?: string; missing?: string; cpf_status?: string; hint?: string } | null = null
      const responseText = await profileResponse.text()
      
      try {
        profileResult = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta do perfil:', parseError)
        console.error('Resposta da API (texto):', responseText)
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.')
      }

      // Tratar erros específicos do backend
      if (!profileResponse.ok || (profileResult && !profileResult.ok)) {
        if (!profileResult) {
          throw new Error('Resposta inválida do servidor. Tente novamente.')
        }
        
        const errorCode = profileResult.code
        let message = profileResult?.error || 'Conta criada, mas houve um problema ao salvar seus dados. Entre em contato com o suporte.'
        
        // Mensagens específicas por código de erro
        if (errorCode === 'MISSING_ENV_VAR' || errorCode === 'INVALID_ENV_VAR') {
          message = `Erro de configuração: faltando ou inválida a variável de ambiente ${profileResult.missing || 'SUPABASE_SERVICE_ROLE_KEY'}. Entre em contato com o suporte.`
        } else if (errorCode === 'INVALID_API_KEY') {
          message = 'Erro de configuração: chave de API do Supabase inválida. Verifique a configuração do servidor.'
          if (profileResult?.hint) {
            message += ` ${profileResult.hint}`
          }
        } else if (errorCode === 'CPF_INVALID') {
          message = 'CPF inválido. Verifique se o CPF está correto e tente novamente.'
        } else if (errorCode === 'CPF_DUPLICATED' || profileResponse.status === 409) {
          message = 'Já existe uma conta cadastrada para este CPF.'
        } else if (errorCode === 'MISSING_FIELDS' || errorCode === 'INVALID_BODY') {
          message = profileResult?.error || 'Dados inválidos. Verifique os campos preenchidos.'
        } else if (profileResponse.status === 400) {
          message = profileResult?.error || 'Dados inválidos. Verifique os campos preenchidos.'
        } else if (profileResponse.status === 500) {
          // Erros 500 são críticos e devem impedir o cadastro
          message = profileResult?.error || 'Erro no servidor. Tente novamente em alguns instantes.'
          if (profileResult?.hint) {
            message += ` ${profileResult.hint}`
          }
        }
        
        console.error('Erro ao criar perfil:', {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          result: profileResult,
          payload: profilePayload
        })
        
        // Se for erro crítico (500, CPF inválido, CPF duplicado, API key inválida), lançar erro
        // Erros de verificação externa não devem bloquear (mas não há mais CPF_CHECK_ERROR)
        if (profileResponse.status >= 500 || 
            errorCode === 'CPF_INVALID' || 
            errorCode === 'CPF_DUPLICATED' || 
            errorCode === 'MISSING_ENV_VAR' || 
            errorCode === 'INVALID_ENV_VAR' ||
            errorCode === 'INVALID_API_KEY') {
          throw new Error(message)
        }
        
        // Para outros erros, continuar o fluxo (perfil pode ter sido criado mesmo assim)
        console.warn('Erro não crítico ao criar perfil, continuando fluxo:', errorCode)
      }

      // Após cadastro bem-sucedido, redirecionar para login
      // Sempre redirecionar, mesmo se email precisar de confirmação
      const params = new URLSearchParams({
        redirectTo,
        signup: 'success',
        identifier: cleanEmail
      })
      
      // Adicionar parâmetro se email precisa ser confirmado
      if (emailNeedsConfirmation) {
        params.append('emailConfirmation', 'required')
      }
      
      // Redirecionar para login (sempre, mesmo com email não confirmado)
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
      // Resetar imediatamente para permitir nova tentativa sem espera
      isSubmittingRef.current = false
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

