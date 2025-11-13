import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// Service role key para operações administrativas (atualizar exames)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id

    // Validar se o ID foi fornecido
    if (!examId) {
      return NextResponse.json(
        { error: 'ID do exame é obrigatório' },
        { status: 400 }
      )
    }

    // Ler o body da requisição
    let updateData: UpdateExamData
    try {
      updateData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Body da requisição inválido. Deve ser um JSON válido' },
        { status: 400 }
      )
    }

    // Validar se pelo menos um campo foi fornecido para atualização
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um campo deve ser fornecido para atualização' },
        { status: 400 }
      )
    }

    // Validações dos campos
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Nome do exame deve ser uma string não vazia' },
          { status: 400 }
        )
      }
    }

    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string') {
        return NextResponse.json(
          { error: 'Descrição deve ser uma string' },
          { status: 400 }
        )
      }
    }

    if (updateData.duration !== undefined) {
      if (typeof updateData.duration !== 'number' || updateData.duration <= 0) {
        return NextResponse.json(
          { error: 'Duração deve ser um número positivo' },
          { status: 400 }
        )
      }
    }

    if (updateData.price !== undefined) {
      if (typeof updateData.price !== 'number' || updateData.price < 0) {
        return NextResponse.json(
          { error: 'Preço deve ser um número maior ou igual a zero' },
          { status: 400 }
        )
      }
    }

    if (updateData.category !== undefined) {
      if (typeof updateData.category !== 'string' || updateData.category.trim().length === 0) {
        return NextResponse.json(
          { error: 'Categoria deve ser uma string não vazia' },
          { status: 400 }
        )
      }
    }

    if (updateData.preparation !== undefined) {
      if (typeof updateData.preparation !== 'string') {
        return NextResponse.json(
          { error: 'Preparo deve ser uma string' },
          { status: 400 }
        )
      }
    }

    if (updateData.fasting_required !== undefined) {
      if (typeof updateData.fasting_required !== 'boolean') {
        return NextResponse.json(
          { error: 'fasting_required deve ser um booleano' },
          { status: 400 }
        )
      }
    }

    if (updateData.fasting_hours !== undefined) {
      if (typeof updateData.fasting_hours !== 'number' || updateData.fasting_hours < 0) {
        return NextResponse.json(
          { error: 'Horas de jejum deve ser um número maior ou igual a zero' },
          { status: 400 }
        )
      }
    }

    if (updateData.active !== undefined) {
      if (typeof updateData.active !== 'boolean') {
        return NextResponse.json(
          { error: 'active deve ser um booleano' },
          { status: 400 }
        )
      }
    }

    // Criar cliente Supabase com service role key para operações administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o exame existe
    const { data: existingExam, error: fetchError } = await supabaseAdmin
      .from('exams')
      .select('id')
      .eq('id', examId)
      .single()

    if (fetchError || !existingExam) {
      return NextResponse.json(
        { error: 'Exame não encontrado' },
        { status: 404 }
      )
    }

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
      console.error('Erro ao atualizar exame:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar exame', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Exame atualizado com sucesso',
        exam: updatedExam
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro na rota de atualizar exame:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Também suportar PATCH para atualização parcial
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PATCH usa a mesma lógica do PUT
  return PUT(request, { params })
}

