import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface UpdateExamData {
  name?: string
  description?: string
  duration?: number
  price?: number
  category?: string
  preparation?: string
  fasting_required?: boolean
  fasting_hours?: number
  active?: boolean
}

/**
 * Verifica se o usuário é admin consultando a tabela profiles
 * Suporta schemas com coluna 'role' ou 'is_admin'
 * 
 * DECISÃO: Suporta ambos os schemas (role='admin' ou is_admin=true) com fallback.
 * Retorna true se for admin, false caso contrário.
 */
async function checkIsAdmin(
  supabaseAdmin: any,
  userId: string
): Promise<boolean> {
  try {
    // Tentar primeiro com coluna 'role'
    const { data: profileWithRole, error: roleError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!roleError && profileWithRole) {
      // Se tiver coluna role, verificar se é 'admin'
      if (profileWithRole.role === 'admin') {
        return true
      }
      // Se não for admin, não precisa verificar is_admin
      if (profileWithRole.role !== undefined && profileWithRole.role !== null) {
        return false
      }
    }

    // Se não encontrou role ou erro de coluna, tentar com is_admin
    const { data: profileWithIsAdmin, error: isAdminError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (!isAdminError && profileWithIsAdmin) {
      return profileWithIsAdmin.is_admin === true
    }

    // Se nenhuma coluna existe ou erro inesperado, considerar não admin por segurança
    return false
  } catch (error) {
    console.warn('Erro ao verificar permissão de admin:', error)
    return false
  }
}

/**
 * Extrai e valida o token Bearer do header Authorization
 * Retorna o token ou null se inválido
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove "Bearer "
}

/**
 * Cria resposta de erro padronizada
 */
function createErrorResponse(
  error: string,
  code: string,
  status: number,
  details?: string
) {
  const response: any = {
    error,
    code
  }
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ============================================
  // VALIDAÇÃO DE ENV VARS (DEVE SER PRIMEIRA)
  // ============================================
  // DECISÃO: Rotas administrativas DEVEM falhar se env vars não existirem.
  // Não usar fallback perigoso (service_role key nunca deve usar anon key).
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('Missing Supabase URL environment variable')
    return createErrorResponse(
      'Missing SUPABASE_URL environment variable.',
      'MISSING_ENV_VAR',
      500,
      'Set either SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL'
    )
  }

  if (!supabaseAnonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    return createErrorResponse(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.',
      'MISSING_ENV_VAR',
      500,
      'Configure NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  // DECISÃO: Service role key é OBRIGATÓRIA para rotas administrativas.
  // Não usar fallback para anon key (seria um risco de segurança).
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey.trim() === '') {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    return createErrorResponse(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.',
      'MISSING_ENV_VAR',
      500,
      'Configure SUPABASE_SERVICE_ROLE_KEY in .env.local (server-side only)'
    )
  }

  // Validar formato básico da service_role key (deve começar com eyJ)
  if (!supabaseServiceRoleKey.startsWith('eyJ')) {
    console.error('Invalid SUPABASE_SERVICE_ROLE_KEY format')
    return createErrorResponse(
      'Invalid SUPABASE_SERVICE_ROLE_KEY format.',
      'INVALID_ENV_VAR',
      500,
      'Service role key should start with eyJ'
    )
  }

  // ============================================
  // AUTENTICAÇÃO E AUTORIZAÇÃO
  // ============================================
  // DECISÃO: Validar token Bearer e verificar permissões de admin antes de qualquer operação.

  // Extrair token do header Authorization
  const token = extractBearerToken(request)
  if (!token) {
    return createErrorResponse(
      'Token de autenticação não fornecido.',
      'UNAUTHORIZED',
      401,
      'Authorization header must include Bearer token'
    )
  }

  // Criar cliente com anon key para validar o usuário
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

  // Validar o token e obter o usuário
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)

  if (authError || !user) {
    console.warn('Erro ao validar token:', authError?.message || 'User not found')
    return createErrorResponse(
      'Token de autenticação inválido ou expirado.',
      'UNAUTHORIZED',
      401,
      authError?.message || 'Invalid or expired token'
    )
  }

  // Criar cliente admin para verificar permissões e executar operações
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Verificar se o usuário é admin
  const isAdmin = await checkIsAdmin(supabaseAdmin, user.id)
  if (!isAdmin) {
    console.warn(`Tentativa de atualizar exame por usuário não admin: ${user.id}`)
    return createErrorResponse(
      'Acesso negado. Apenas administradores podem atualizar exames.',
      'FORBIDDEN',
      403,
      'User does not have admin privileges'
    )
  }

  // ============================================
  // VALIDAÇÃO DE PARÂMETROS E PAYLOAD
  // ============================================

  try {
    const examId = params.id

    // Validar se o ID foi fornecido
    if (!examId) {
      return createErrorResponse(
        'ID do exame é obrigatório',
        'MISSING_EXAM_ID',
        400
      )
    }

    // Ler o body da requisição
    let updateData: UpdateExamData
    try {
      updateData = await request.json()
    } catch (error) {
      return createErrorResponse(
        'Body da requisição inválido. Deve ser um JSON válido',
        'INVALID_BODY',
        400,
        'Request body must be valid JSON'
      )
    }

    // Validar se pelo menos um campo foi fornecido para atualização
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(
        'Pelo menos um campo deve ser fornecido para atualização',
        'EMPTY_UPDATE',
        400
      )
    }

    // Validações dos campos (mantidas do código original)
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
        return createErrorResponse(
          'Nome do exame deve ser uma string não vazia',
          'INVALID_NAME',
          400
        )
      }
    }

    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string') {
        return createErrorResponse(
          'Descrição deve ser uma string',
          'INVALID_DESCRIPTION',
          400
        )
      }
    }

    if (updateData.duration !== undefined) {
      if (typeof updateData.duration !== 'number' || updateData.duration <= 0) {
        return createErrorResponse(
          'Duração deve ser um número positivo',
          'INVALID_DURATION',
          400
        )
      }
    }

    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return createErrorResponse(
          'Preço deve ser um número maior ou igual a zero',
          'INVALID_PRICE',
          400
        )
      }
    }

    if (updateData.category !== undefined) {
      if (typeof updateData.category !== 'string' || updateData.category.trim().length === 0) {
        return createErrorResponse(
          'Categoria deve ser uma string não vazia',
          'INVALID_CATEGORY',
          400
        )
      }
    }

    if (updateData.preparation !== undefined) {
      if (typeof updateData.preparation !== 'string') {
        return createErrorResponse(
          'Preparo deve ser uma string',
          'INVALID_PREPARATION',
          400
        )
      }
    }

    if (updateData.fasting_required !== undefined) {
      if (typeof updateData.fasting_required !== 'boolean') {
        return createErrorResponse(
          'fasting_required deve ser um booleano',
          'INVALID_FASTING_REQUIRED',
          400
        )
      }
    }

    if (updateData.fasting_hours !== undefined) {
      if (typeof updateData.fasting_hours !== 'number' || updateData.fasting_hours < 0) {
        return createErrorResponse(
          'Horas de jejum deve ser um número maior ou igual a zero',
          'INVALID_FASTING_HOURS',
          400
        )
      }
    }

    if (updateData.active !== undefined) {
      if (typeof updateData.active !== 'boolean') {
        return createErrorResponse(
          'active deve ser um booleano',
          'INVALID_ACTIVE',
          400
        )
      }
    }

    // ============================================
    // VERIFICAÇÃO DE EXISTÊNCIA DO EXAME
    // ============================================
    // DECISÃO: Usar .maybeSingle() ao invés de .single() para evitar erro se não existir.

    const { data: existingExam, error: fetchError } = await supabaseAdmin
      .from('exams')
      .select('id')
      .eq('id', examId)
      .maybeSingle()

    if (fetchError) {
      // Log sem vazar segredos (não logar service_role key)
      console.error('Erro ao buscar exame:', {
        examId,
        error: fetchError.message,
        code: fetchError.code
      })
      return createErrorResponse(
        'Erro ao verificar exame',
        'FETCH_ERROR',
        500,
        fetchError.message
      )
    }

    if (!existingExam) {
      return createErrorResponse(
        'Exame não encontrado',
        'EXAM_NOT_FOUND',
        404
      )
    }

    // ============================================
    // ATUALIZAÇÃO DO EXAME
    // ============================================

    // Preparar dados para atualização (remover campos undefined)
    const dataToUpdate: UpdateExamData = {}
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name.trim()
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description
    if (updateData.duration !== undefined) dataToUpdate.duration = updateData.duration
    if (updateData.price !== undefined) dataToUpdate.price = updateData.price
    if (updateData.category !== undefined) dataToUpdate.category = updateData.category.trim()
    if (updateData.preparation !== undefined) dataToUpdate.preparation = updateData.preparation
    if (updateData.fasting_required !== undefined) dataToUpdate.fasting_required = updateData.fasting_required
    if (updateData.fasting_hours !== undefined) dataToUpdate.fasting_hours = updateData.fasting_hours
    if (updateData.active !== undefined) dataToUpdate.active = updateData.active

    // Atualizar o exame
    const { data: updatedExam, error: updateError } = await supabaseAdmin
      .from('exams')
      .update(dataToUpdate)
      .eq('id', examId)
      .select()
      .single()

    if (updateError) {
      // Log sem vazar segredos
      console.error('Erro ao atualizar exame:', {
        examId,
        error: updateError.message,
        code: updateError.code,
        userId: user.id
        // DECISÃO: Não logar service_role key ou dados sensíveis
      })
      return createErrorResponse(
        'Erro ao atualizar exame',
        'UPDATE_ERROR',
        500,
        updateError.message
      )
    }

    // Sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Exame atualizado com sucesso',
        exam: updatedExam
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Log de erro genérico sem vazar segredos
    console.error('Erro na rota de atualizar exame:', {
      error: error?.message || 'Unknown error',
      userId: user?.id
      // DECISÃO: Não logar stack trace completo ou segredos em produção
    })
    return createErrorResponse(
      'Erro interno do servidor',
      'INTERNAL_ERROR',
      500,
      error?.message || 'Unknown error'
    )
  }
}

// Também suportar PATCH para atualização parcial
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // DECISÃO: PATCH usa a mesma lógica do PUT (atualização parcial)
  return PUT(request, { params })
}
