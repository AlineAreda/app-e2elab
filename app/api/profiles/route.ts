import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Valida CPF usando algoritmo local (sem chamadas externas)
 * Retorna true se o CPF for válido, false caso contrário
 */
function validateCPFLocal(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '')
  
  // Deve ter exatamente 11 dígitos
  if (numbers.length !== 11) return false
  
  // Não aceitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Rejeitar CPFs conhecidos inválidos
  const invalidCPFs = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ]
  if (invalidCPFs.includes(numbers)) return false
  
  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(numbers.charAt(9))) return false
  
  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(numbers.charAt(10))) return false
  
  return true
}

/**
 * Verifica CPF externamente (opcional, não bloqueia o cadastro)
 * Retorna 'verified' se bem-sucedido, 'pending' se falhar ou não implementado
 * 
 * DECISÃO: Esta função é sempre chamada (se implementada), independente de duplicidade.
 * Se não houver API externa configurada, sempre retorna 'pending'.
 */
async function verifyCPFExternal(cpf: string): Promise<'verified' | 'pending'> {
  // Se houver uma API externa de verificação de CPF, implemente aqui
  // Por enquanto, retorna 'pending' (não há verificação externa)
  // Exemplo de implementação futura:
  // try {
  //   const response = await fetch('https://api-cpf-verification.com/verify', {
  //     method: 'POST',
  //     body: JSON.stringify({ cpf }),
  //     signal: AbortSignal.timeout(5000) // timeout de 5s
  //   })
  //   if (response.ok) return 'verified'
  // } catch (error) {
  //   console.warn('Erro ao verificar CPF externamente:', error)
  // }
  return 'pending'
}

/**
 * Verifica duplicidade de CPF no banco, suportando schemas com 'id' ou 'user_id'
 * Retorna { found: boolean, existingUserId: string | null, error: any }
 * 
 * DECISÃO: Suporta ambos os schemas (id e user_id) com fallback automático.
 * Se uma coluna não existir, o Supabase retornará erro que será tratado.
 */
async function checkCPFDuplicate(
  supabaseAdmin: any,
  cpf: string
): Promise<{ found: boolean; existingUserId: string | null; error: any }> {
  // Tentar primeiro com schema que tem 'id' e 'user_id'
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id')
      .eq('cpf', cpf)
      .maybeSingle()

    if (error) {
      // Se erro for de coluna inexistente, tentar fallback
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        // Fallback: tentar apenas com 'id' (assumindo que id = user_id)
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('cpf', cpf)
          .maybeSingle()

        if (fallbackError) {
          return { found: false, existingUserId: null, error: fallbackError }
        }

        if (fallbackData && fallbackData.id) {
          return { found: true, existingUserId: fallbackData.id, error: null }
        }

        return { found: false, existingUserId: null, error: null }
      }

      // Outro tipo de erro
      return { found: false, existingUserId: null, error }
    }

    if (data) {
      // Usar user_id se existir, senão usar id (assumindo id = user_id)
      const existingUserId = (data as any).user_id || (data as any).id
      if (existingUserId) {
        return { found: true, existingUserId, error: null }
      }
    }

    return { found: false, existingUserId: null, error: null }
  } catch (error) {
    return { found: false, existingUserId: null, error }
  }
}

/**
 * Cria resposta de erro padronizada com details e hint para debug
 * 
 * DECISÃO: Incluir details e hint sempre, mas em produção pode ser limitado
 * para não expor informações sensíveis. Por enquanto, incluímos sempre.
 */
function createErrorResponse(
  error: string,
  code: string,
  status: number,
  details?: string,
  hint?: string
) {
  const response: any = {
    ok: false,
    error,
    code
  }

  // Incluir details e hint para debug (sempre, mas pode ser filtrado em produção se necessário)
  if (details) {
    response.details = details
  }
  if (hint) {
    response.hint = hint
  }

  return NextResponse.json(response, { status })
}

export async function POST(request: NextRequest) {
  // Aceitar SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL (com fallback)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validação clara das env vars com mensagens específicas
  if (!supabaseUrl) {
    console.error('Missing Supabase URL environment variable')
    return createErrorResponse(
      'Missing SUPABASE_URL environment variable. Set either SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.',
      'MISSING_ENV_VAR',
      500,
      'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not set',
      'Configure the Supabase URL in your .env.local file'
    )
  }

  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '') {
    // DECISÃO: Não logar a key por segurança, apenas indicar que está ausente
    console.error('Missing or empty SUPABASE_SERVICE_ROLE_KEY environment variable')
    return createErrorResponse(
      'Configuração do servidor incompleta: faltando SUPABASE_SERVICE_ROLE_KEY.',
      'MISSING_ENV_VAR',
      500,
      'SUPABASE_SERVICE_ROLE_KEY not set or empty',
      'Configure SUPABASE_SERVICE_ROLE_KEY in your .env.local file (Settings > API > service_role secret)'
    )
  }

  // Validar formato básico da service_role key (deve começar com eyJ)
  // DECISÃO: Validar formato antes de usar, mas não logar a key
  if (!supabaseServiceRoleKey.startsWith('eyJ')) {
    console.error('Invalid SUPABASE_SERVICE_ROLE_KEY format (should start with eyJ)')
    return createErrorResponse(
      'Configuração do servidor inválida: SUPABASE_SERVICE_ROLE_KEY com formato incorreto.',
      'INVALID_ENV_VAR',
      500,
      'SUPABASE_SERVICE_ROLE_KEY does not start with eyJ',
      'Verify that you copied the complete service_role key from Supabase dashboard'
    )
  }

  // Validar e parsear body
  let body: {
    userId?: string
    fullName?: string
    cpf?: string
    phone?: string
    birthDate?: string
  }

  try {
    body = await request.json()
  } catch {
    return createErrorResponse(
      'Corpo da requisição inválido.',
      'INVALID_BODY',
      400,
      'Request body is not valid JSON'
    )
  }

  const { userId, fullName, cpf, phone, birthDate } = body

  // Validação de campos obrigatórios
  if (!userId || !fullName || !cpf || !phone || !birthDate) {
    return createErrorResponse(
      'Dados obrigatórios ausentes para criar o perfil.',
      'MISSING_FIELDS',
      400,
      `Missing required fields: ${!userId ? 'userId ' : ''}${!fullName ? 'fullName ' : ''}${!cpf ? 'cpf ' : ''}${!phone ? 'phone ' : ''}${!birthDate ? 'birthDate' : ''}`
    )
  }

  // Normalizar CPF e telefone (apenas dígitos)
  const normalizedCpf = cpf.replace(/\D/g, '')
  const normalizedPhone = phone.replace(/\D/g, '')

  // Validar formato do CPF (11 dígitos)
  if (normalizedCpf.length !== 11) {
    return createErrorResponse(
      'CPF deve conter 11 dígitos.',
      'CPF_INVALID',
      400,
      `CPF has ${normalizedCpf.length} digits, expected 11`
    )
  }

  // Validar CPF usando algoritmo local
  if (!validateCPFLocal(normalizedCpf)) {
    return createErrorResponse(
      'CPF inválido.',
      'CPF_INVALID',
      400,
      'CPF failed local validation algorithm'
    )
  }

  // Criar cliente Supabase com service role (apenas no servidor)
  // DECISÃO: Service role key nunca é logada ou exposta ao client
  let supabaseAdmin: any
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar cliente Supabase com service_role:', error?.message || 'Unknown error')
    return createErrorResponse(
      'Erro de configuração do servidor. Verifique as variáveis de ambiente.',
      'SUPABASE_CLIENT_ERROR',
      500,
      error?.message || 'Unknown error creating Supabase client',
      'Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }

  // DECISÃO: Verificação externa de CPF é sempre executada (se implementada),
  // independente de duplicidade. Não bloqueia o cadastro se falhar.
  let cpfStatus: 'verified' | 'pending' = 'pending'
  try {
    cpfStatus = await verifyCPFExternal(normalizedCpf)
  } catch (error) {
    // Falha na verificação externa não impede o cadastro
    console.warn('Verificação externa de CPF falhou (não bloqueia cadastro):', error)
    cpfStatus = 'pending'
  }

  // Verificar duplicidade de CPF (suporta schemas com 'id' ou 'user_id')
  // DECISÃO: Esta verificação é crítica e deve retornar erro se falhar de forma inesperada
  let existingUserId: string | null = null
  const duplicateCheck = await checkCPFDuplicate(supabaseAdmin, normalizedCpf)

  if (duplicateCheck.error) {
    // Se for erro de API key inválida, retornar erro específico
    if (duplicateCheck.error.message?.includes('Invalid API key') || 
        duplicateCheck.error.message?.includes('JWT')) {
      console.error('Invalid API key error during CPF check')
      return createErrorResponse(
        'Configuração do servidor inválida: SUPABASE_SERVICE_ROLE_KEY incorreta.',
        'INVALID_API_KEY',
        500,
        duplicateCheck.error.message,
        'Verify SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings > API > service_role secret)'
      )
    }

    // Outros erros na verificação: logar mas não bloquear (pode ser problema temporário)
    console.warn('Erro ao verificar CPF duplicado (continuando com cadastro):', {
      message: duplicateCheck.error.message,
      code: duplicateCheck.error.code,
      details: duplicateCheck.error.details
    })
  } else if (duplicateCheck.found) {
    existingUserId = duplicateCheck.existingUserId
  }

  // Se CPF já existe e pertence a outro usuário, retornar erro 409
  // DECISÃO: Comparar com userId fornecido (que deve ser o auth.users.id)
  if (existingUserId && existingUserId !== userId) {
    return createErrorResponse(
      'Este CPF já está cadastrado.',
      'CPF_DUPLICATED',
      409,
      `CPF ${normalizedCpf} already registered for user ${existingUserId}`,
      'This CPF is already associated with another account'
    )
  }

  // Upsert do perfil (idempotente - pode ser chamado múltiplas vezes)
  // DECISÃO: Suporta schemas com 'id' ou 'user_id' como PK
  // Tentamos primeiro com 'id', se falhar por coluna inexistente, tentamos 'user_id'
  let profileData: any = null
  let upsertError: any = null
  let includeCpfStatus = true

  const hasMissingColumn = (error: any, column: string) => {
    const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
    return message.includes(column) && message.toLowerCase().includes('column')
  }

  const upsertProfile = async (primaryKey: 'id' | 'user_id', withCpfStatus: boolean) => {
    const basePayload = {
      [primaryKey]: userId,
      full_name: fullName,
      cpf: normalizedCpf,
      phone: normalizedPhone,
      birth_date: birthDate
    }
    const payload = withCpfStatus ? { ...basePayload, cpf_status: cpfStatus } : basePayload
    const selectFields = withCpfStatus ? `${primaryKey}, cpf_status` : primaryKey

    return supabaseAdmin
      .from('profiles')
      .upsert(payload, { onConflict: primaryKey })
      .select(selectFields)
      .single()
  }

  // Tentar upsert com 'id' como PK (schema padrão: profiles.id = auth.users.id)
  let { data: upsertData, error: upsertErr } = await upsertProfile('id', includeCpfStatus)

  if (upsertErr) {
    if (hasMissingColumn(upsertErr, 'cpf_status')) {
      includeCpfStatus = false
      ;({ data: upsertData, error: upsertErr } = await upsertProfile('id', includeCpfStatus))
    }

    // Se erro for de coluna 'id' inexistente, tentar com 'user_id'
    if (upsertErr.message?.includes('column') && 
        (upsertErr.message?.includes('id') || upsertErr.code === '42703')) {
      // Fallback: tentar com 'user_id' como PK
      let { data: fallbackData, error: fallbackError } = await upsertProfile('user_id', includeCpfStatus)

      if (fallbackError && includeCpfStatus && hasMissingColumn(fallbackError, 'cpf_status')) {
        includeCpfStatus = false
        ;({ data: fallbackData, error: fallbackError } = await upsertProfile('user_id', includeCpfStatus))
      }

      if (fallbackError) {
        upsertError = fallbackError
      } else {
        profileData = fallbackData
      }
    } else {
      upsertError = upsertErr
    }
  } else {
    profileData = upsertData
  }

  if (upsertError) {
    // Log completo do erro real (sem expor a service_role key)
    console.error('Erro ao criar/atualizar perfil via service role:', {
      message: upsertError.message,
      code: upsertError.code,
      details: upsertError.details,
      hint: upsertError.hint,
      userId,
      cpf: normalizedCpf
      // DECISÃO: Não logar a service_role key por segurança
    })
    
    // Verificar se é erro de API key inválida
    if (upsertError.message?.includes('Invalid API key') || 
        upsertError.message?.includes('JWT') ||
        upsertError.hint?.includes('API key')) {
      return createErrorResponse(
        'Configuração do servidor inválida: SUPABASE_SERVICE_ROLE_KEY incorreta.',
        'INVALID_API_KEY',
        500,
        upsertError.message,
        'Verify SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings > API > service_role secret)'
      )
    }
    
    const isDuplicate = upsertError.code === '23505' || upsertError.message?.includes('duplicate key')
    const isRLS = upsertError.message?.includes('row-level security') || upsertError.code === '42501'
    const status = isDuplicate ? 409 : isRLS ? 403 : 500
    
    let message = 'Não foi possível concluir o cadastro. Tente novamente.'
    let code = 'PROFILE_CREATE_ERROR'
    
    if (isDuplicate) {
      message = 'Este CPF já está cadastrado.'
      code = 'CPF_DUPLICATED'
    } else if (isRLS) {
      message = 'Erro de permissão. Entre em contato com o suporte.'
      code = 'RLS_ERROR'
    }

    return createErrorResponse(
      message,
      code,
      status,
      upsertError.message || 'Erro desconhecido do Supabase',
      upsertError.hint
    )
  }

  // Sucesso - handler é idempotente (pode ser chamado múltiplas vezes com mesmo resultado)
  return NextResponse.json(
    {
      ok: true,
      profile: {
        id: profileData?.id || profileData?.user_id || userId,
        cpf_status: profileData?.cpf_status || cpfStatus
      },
      cpf_status: profileData?.cpf_status || cpfStatus
    },
    { status: 201 }
  )
}
