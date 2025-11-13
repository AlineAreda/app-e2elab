'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Exam {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  preparation?: string
  fasting_required?: boolean
  fasting_hours?: number
}

export default function ExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [examLoading, setExamLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      fetchExam()
    }
  }, [params.id, user, loading])

  const fetchExam = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setExam(data)
    } catch (error) {
      console.error('Erro ao buscar exame:', error)
    } finally {
      setExamLoading(false)
    }
  }

  if (loading || examLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Exame não encontrado
            </p>
            <Link href="/exams">
              <Button>Voltar para Exames</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/exams">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{exam.name}</CardTitle>
          <CardDescription className="text-base">{exam.category}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground">{exam.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Duração</h3>
              <p className="text-muted-foreground">{exam.duration} minutos</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Preço</h3>
              <p className="text-2xl font-bold text-primary">R$ {exam.price.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preparo</h3>
            <p className="text-muted-foreground">
              {exam.preparation || 'Não é necessário preparo especial'}
            </p>
            {exam.fasting_required && (
              <p className="text-sm text-muted-foreground mt-1">
                ⚠️ Jejum de {exam.fasting_hours} horas necessário
              </p>
            )}
          </div>

          <div className="pt-4">
            <Link href={`/schedule/${exam.id}`}>
              <Button size="lg" className="w-full">
                Agendar Exame
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

