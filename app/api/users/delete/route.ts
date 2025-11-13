import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// Service role key para operações administrativas (deletar usuários)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

export async function DELETE(request: NextRequest) {
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

    // Validação do e-mail
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'E-mail é obrigatório e deve ser uma string' },
        { status: 400 }
      )
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de e-mail inválido' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase com service role key para operações administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar usuário pelo e-mail
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Erro ao listar usuários:', listError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuário', details: listError.message },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email.toLowerCase().trim())

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado com este e-mail' },
        { status: 404 }
      )
    }

    const userId = user.id

    // Deletar perfil da tabela profiles primeiro
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Erro ao deletar perfil:', profileError)
      // Continuar mesmo se o perfil não existir
    }

    // Deletar agendamentos relacionados
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('user_id', userId)

    if (appointmentsError) {
      console.error('Erro ao deletar agendamentos:', appointmentsError)
      // Continuar mesmo se houver erro
    }

    // Deletar usuário do Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar usuário', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário deletado com sucesso',
        deletedUserId: userId,
        deletedEmail: email
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro na rota de deletar usuário:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

