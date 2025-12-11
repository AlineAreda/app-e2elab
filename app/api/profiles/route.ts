import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase env vars missing for profiles API')
    return NextResponse.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente em instantes.' },
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
    console.error('Erro ao verificar CPF duplicado:', cpfCheckError)
    return NextResponse.json(
      { error: 'Não foi possível concluir o cadastro. Tente novamente em instantes.' },
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
    console.error('Erro ao criar perfil via service role:', error)
    const isDuplicate = error.code === '23505' || error.message?.includes('duplicate key')
    const status = isDuplicate ? 409 : 500
    const message = isDuplicate
      ? 'Este CPF já está cadastrado.'
      : 'Não foi possível concluir o cadastro. Tente novamente em instantes.'

    return NextResponse.json(
      { error: message, code: error.code },
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


