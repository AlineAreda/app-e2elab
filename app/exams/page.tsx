'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Search, X } from 'lucide-react'

interface Exam {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
}

export default function ExamsPage() {
  const { user, loading } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && user) {
      fetchExams()
    }
  }, [user, loading])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error

      setExams(data || [])
    } catch (error) {
      console.error('Erro ao buscar exames:', error)
    } finally {
      setExamsLoading(false)
    }
  }

  // Filtrar exames baseado na busca (a partir da terceira letra)
  const filteredExams = useMemo(() => {
    if (searchQuery.length < 3) {
      return exams
    }

    const query = searchQuery.toLowerCase().trim()
    return exams.filter(exam =>
      exam.name.toLowerCase().includes(query) ||
      exam.description.toLowerCase().includes(query) ||
      exam.category.toLowerCase().includes(query)
    )
  }, [exams, searchQuery])

  if (loading || examsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exames Disponíveis</h1>
        <p className="text-muted-foreground mb-6">
          Selecione um exame para ver detalhes e agendar
        </p>
        
        {/* Campo de busca */}
        <div className="flex justify-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar um exame"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            Digite pelo menos 3 letras para buscar
          </p>
        </div>
      )}

      {searchQuery.length >= 3 && filteredExams.length === 0 && (
        <div className="mb-4 p-4 bg-muted rounded-md text-center">
          <p className="text-muted-foreground">
            Nenhum exame encontrado para "{searchQuery}"
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{exam.name}</CardTitle>
              <CardDescription>{exam.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {exam.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="font-medium">{exam.duration} min</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="font-bold text-lg">R$ {exam.price.toFixed(2)}</p>
                </div>
              </div>
              <Link href={`/exams/${exam.id}`}>
                <Button className="w-full">Ver Detalhes</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

