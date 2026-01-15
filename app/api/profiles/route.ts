import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase env vars missing for profiles API', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceRoleKey
    })
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta. Entre em contato com o suporte.' },
      { status: 500 }
    )
  }

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
    return NextResponse.json(
      { error: 'Corpo da requisição inválido.' },
      { status: 400 }
    )
  }

  const { userId, fullName, cpf, phone, birthDate } = body

  if (!userId || !fullName || !cpf || !phone || !birthDate) {
    return NextResponse.json(
      { error: 'Dados obrigatórios ausentes para criar o perfil.' },
      { status: 400 }
    )
  }

  const normalizedCpf = cpf.replace(/\D/g, '')
  if (normalizedCpf.length !== 11) {
    return NextResponse.json(
      { error: 'CPF inválido.' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Garantir CPF único antes de inserir
  const { data: existingByCpf, error: cpfCheckError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('cpf', normalizedCpf)
    .maybeSingle()

  if (cpfCheckError) {
    console.error('Erro ao verificar CPF duplicado:', {
      error: cpfCheckError,
      message: cpfCheckError.message,
      code: cpfCheckError.code,
      details: cpfCheckError.details
    })
    return NextResponse.json(
      { 
        error: 'Erro ao verificar CPF. Tente novamente.',
        code: cpfCheckError.code || 'CPF_CHECK_ERROR'
      },
      { status: 500 }
    )
  }

  if (existingByCpf && existingByCpf.id !== userId) {
    return NextResponse.json(
      { error: 'Este CPF já está cadastrado.', code: 'CPF_DUPLICATED' },
      { status: 409 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName,
        cpf: normalizedCpf,
        phone,
        birth_date: birthDate
      },
      { onConflict: 'id' }
    )
    .select('id')
    .single()

  if (error) {
    console.error('Erro ao criar perfil via service role:', {
      error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    const isDuplicate = error.code === '23505' || error.message?.includes('duplicate key')
    const isRLS = error.message?.includes('row-level security') || error.code === '42501'
    const status = isDuplicate ? 409 : isRLS ? 403 : 500
    
    let message = 'Não foi possível concluir o cadastro. Tente novamente.'
    if (isDuplicate) {
      message = 'Este CPF já está cadastrado.'
    } else if (isRLS) {
      message = 'Erro de permissão. Entre em contato com o suporte.'
    } else if (error.message) {
      // Incluir mais detalhes do erro em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        message = `Erro: ${error.message}`
      }
    }

    return NextResponse.json(
      { 
        error: message, 
        code: error.code || 'PROFILE_CREATE_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status }
    )
  }

  return NextResponse.json(
    {
      success: true,
      profileId: data?.id
    },
    { status: 200 }
  )
}


