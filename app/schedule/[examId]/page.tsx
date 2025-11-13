'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/error-messages'
import { toast } from 'sonner'

interface Exam {
  id: string
  name: string
  price: number
}

interface Unit {
  id: string
  name: string
  city: string
  address: string
  neighborhood: string
  phone?: string
}

interface TimeSlot {
  time: string
  available: boolean
}

export default function SchedulePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [scheduling, setScheduling] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      fetchExam()
      fetchUnits()
    }
  }, [params.examId, user, loading])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots()
    }
  }, [selectedDate])

  const fetchExam = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, price')
        .eq('id', params.examId)
        .single()

      if (error) throw error

      setExam(data)
    } catch (error) {
      console.error('Erro ao buscar exame:', error)
    }
  }

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, city, address, neighborhood, phone')
        .eq('active', true)
        .order('city')

      if (error) throw error

      setUnits(data || [])
    } catch (error) {
      console.error('Erro ao buscar unidades:', error)
    } finally {
      setLoadingUnits(false)
    }
  }

  const generateTimeSlots = () => {
    if (!selectedDate) return

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay() // 0 = Domingo, 6 = Sábado
    
    // Horário de funcionamento:
    // Segunda a Sexta: 07h às 19h (último horário: 18:30)
    // Sábado: 07h às 12h (último horário: 11:30)
    // Domingo: não funciona (já filtrado em getAvailableDates)
    
    const slots: TimeSlot[] = []
    
    // Determinar horário de fechamento baseado no dia da semana
    const isSaturday = dayOfWeek === 6
    const closingHour = isSaturday ? 12 : 19 // Sábado fecha às 12h, outros dias às 19h
    
    // Gerar horários de 30 em 30 minutos das 07h até o horário de fechamento
    // Para sábado: 07:00, 07:30, ..., 11:00, 11:30
    // Para outros dias: 07:00, 07:30, ..., 18:00, 18:30
    for (let hour = 7; hour < closingHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        // Simular alguns horários ocupados (70% disponíveis)
        const available = Math.random() > 0.3
        slots.push({ time, available })
      }
    }
    
    setTimeSlots(slots)
  }

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedUnit || !exam || !user) return

    setScheduling(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          unit_id: selectedUnit,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          status: 'scheduled'
        })

      if (error) throw error

      const selectedUnitData = units.find(u => u.id === selectedUnit)

      toast.success('Agendamento realizado com sucesso!', {
        description: `${exam.name} agendado para ${format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime} na unidade ${selectedUnitData?.name}`,
        duration: 5000,
      })
      
      // Aguardar um pouco para o usuário ver o toast antes de redirecionar
      setTimeout(() => {
        router.push('/me/appointments')
      }, 1500)
    } catch (error: any) {
      console.error('Erro ao agendar:', error)
      toast.error('Erro ao realizar agendamento', {
        description: translateError(error),
        duration: 5000,
      })
    } finally {
      setScheduling(false)
    }
  }

  // Gerar próximos 30 dias para seleção
  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      // Não permitir domingos
      if (date.getDay() !== 0) {
        dates.push(format(date, 'yyyy-MM-dd'))
      }
    }
    return dates
  }

  if (loading || loadingUnits) {
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

  const availableDates = getAvailableDates()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href={`/exams/${params.examId}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Agendar Exame</CardTitle>
          <CardDescription>{exam.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    <div className="flex flex-col">
                      <span className="font-semibold">{unit.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {unit.address}, {unit.neighborhood} - {unit.city}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUnit && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {units.find(u => u.id === selectedUnit)?.name}
                    </p>
                    <p className="text-muted-foreground">
                      {units.find(u => u.id === selectedUnit)?.address}, {units.find(u => u.id === selectedUnit)?.neighborhood}
                    </p>
                    <p className="text-muted-foreground">
                      {units.find(u => u.id === selectedUnit)?.city}
                    </p>
                    {units.find(u => u.id === selectedUnit)?.phone && (
                      <p className="text-muted-foreground mt-1">
                        Tel: {units.find(u => u.id === selectedUnit)?.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger id="date">
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <SelectItem key={slot.time} value={slot.time}>
                        {slot.time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {timeSlots.filter(slot => slot.available).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário disponível para esta data
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {exam.price.toFixed(2)}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSchedule}
              disabled={!selectedUnit || !selectedDate || !selectedTime || scheduling}
            >
              {scheduling ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

