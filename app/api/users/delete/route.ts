import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
 * Verifica se o usuário é admin consultando a tabela profiles
 * Suporta schema com coluna 'role' ou 'is_admin'
 * 
 * DECISÃO: Implementado com verificação de role='admin' primeiro,
 * com fallback para is_admin=true. Retorna true se for admin, false caso contrário.
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
      // Se não for admin e role existe, não precisa verificar is_admin
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
 * Busca userId em profiles pelo email
 * Retorna { userId: string } | null se encontrado, null se não encontrado
 * 
 * DECISÃO: Buscar userId via profiles.email é mais seguro e escalável
 * que listar todos os usuários do Auth.
 */
async function findUserIdByEmail(
  supabaseAdmin: any,
  email: string
): Promise<{ userId: string; email: string } | null> {
  try {
    // Normalizar email para busca
    const normalizedEmail = email.toLowerCase().trim()
    
    // Buscar em profiles (assumindo que profiles tem coluna email)
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      // Se erro for de coluna inexistente, tentar buscar em auth.users
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        // Fallback: buscar diretamente em auth.users (menos eficiente, mas funcional)
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) {
          console.error('Erro ao listar usuários (fallback):', listError)
          return null
        }
        const user = users.users.find((u: any) => u.email?.toLowerCase().trim() === normalizedEmail)
        if (user) {
          return { userId: user.id, email: user.email || normalizedEmail }
        }
        return null
      }
      console.error('Erro ao buscar perfil por email:', error)
      return null
    }

    if (profile && profile.id) {
      return { userId: profile.id, email: profile.email || normalizedEmail }
    }

    return null
  } catch (error) {
    console.error('Erro ao buscar userId por email:', error)
    return null
  }
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
    ok: false,
    error,
    code
  }
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

export async function DELETE(request: NextRequest) {
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

  // DECISÃO: Service role key é OBRIGATÓRIA para deletar usuários.
  // Não usar fallback para anon key (seria um risco crítico de segurança).
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
    console.warn(`Tentativa de deletar usuário por usuário não admin: ${user.id}`)
    return createErrorResponse(
      'Acesso negado. Apenas administradores podem deletar usuários.',
      'FORBIDDEN',
      403,
      'User does not have admin privileges'
    )
  }

  // ============================================
  // VALIDAÇÃO DE PARÂMETROS
  // ============================================

  try {
    // Buscar email do query parameter ou do body
    const { searchParams } = new URL(request.url)
    let email = searchParams.get('email')

    // Se não estiver no query, tentar no body
    if (!email) {
      try {
        const body = await request.json()
        email = body.email
      } catch {
        // Se não conseguir ler o body, continuar
      }
    }

    // Normalizar email
    if (email) {
      email = email.toLowerCase().trim()
    }

    // Validação do e-mail
    if (!email || typeof email !== 'string') {
      return createErrorResponse(
        'E-mail é obrigatório e deve ser uma string',
        'MISSING_EMAIL',
        400,
        'Email must be provided as query parameter or in request body'
      )
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        'Formato de e-mail inválido',
        'INVALID_EMAIL',
        400,
        'Email format is invalid'
      )
    }

    // Não permitir que admin delete a si mesmo (proteção adicional)
    const { data: { user: currentUser } } = await supabaseAnon.auth.getUser(token)
    if (currentUser?.email?.toLowerCase().trim() === email) {
      return createErrorResponse(
        'Não é permitido deletar sua própria conta.',
        'FORBIDDEN',
        403,
        'Users cannot delete their own account'
      )
    }

    // ============================================
    // BUSCAR USER ID POR EMAIL
    // ============================================
    // DECISÃO: Buscar userId via profiles.email (mais eficiente e escalável)
    // Se profiles não tiver email, faz fallback para auth.admin.listUsers()

    const userInfo = await findUserIdByEmail(supabaseAdmin, email)

    if (!userInfo) {
      return createErrorResponse(
        'Usuário não encontrado com este e-mail',
        'USER_NOT_FOUND',
        404,
        `No user found with email: ${email}`
      )
    }

    const { userId, email: foundEmail } = userInfo

    // ============================================
    // DELEÇÃO EM ORDEM (DEPENDÊNCIAS PRIMEIRO)
    // ============================================
    // DECISÃO: Deletar dependências primeiro para minimizar inconsistências.
    // Ordem: appointments -> profiles -> auth.users

    // 1. Deletar agendamentos relacionados (dependências)
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('user_id', userId)

    if (appointmentsError) {
      // Log sem vazar segredos
      console.error('Erro ao deletar agendamentos:', {
        userId,
        error: appointmentsError.message,
        code: appointmentsError.code
      })
      // Continuar mesmo se houver erro (agendamentos podem não existir)
    }

    // 2. Deletar perfil da tabela profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Erro ao deletar perfil:', {
        userId,
        error: profileError.message,
        code: profileError.code
      })
      // Continuar mesmo se o perfil não existir (pode já ter sido deletado)
    }

    // 3. Deletar usuário do Supabase Auth (último passo)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Erro ao deletar usuário do Auth:', {
        userId,
        error: deleteError.message,
        code: deleteError.message
        // DECISÃO: Não logar service_role key ou dados sensíveis
      })
      return createErrorResponse(
        'Erro ao deletar usuário',
        'DELETE_ERROR',
        500,
        deleteError.message
      )
    }

    // Sucesso
    return NextResponse.json(
      {
        ok: true,
        message: 'Usuário deletado com sucesso',
        deletedUserId: userId,
        deletedEmail: foundEmail
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Log de erro genérico sem vazar segredos
    console.error('Erro na rota de deletar usuário:', {
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
