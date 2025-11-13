'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

interface Appointment {
  id: string
  exam_id: string
  unit_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
}

export default function ReschedulePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [rescheduling, setRescheduling] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchAppointmentData()
      } else {
        // Se não houver usuário, redirecionar para login
        setPageLoading(false)
        router.push('/login')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.appointmentId, user?.id, loading])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchAppointmentData = async () => {
    if (!user) {
      setPageLoading(false)
      return
    }

    try {
      const appointmentId = Array.isArray(params.appointmentId) 
        ? params.appointmentId[0] 
        : params.appointmentId as string
      
      if (!appointmentId) {
        toast.error('ID do agendamento não encontrado')
        router.push('/me/appointments')
        setPageLoading(false)
        return
      }
      
      // Buscar dados do agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          exam_id,
          unit_id,
          scheduled_date,
          scheduled_time,
          status,
          exams (
            id,
            name,
            price
          ),
          units (
            id,
            name,
            city,
            address,
            neighborhood,
            phone
          )
        `)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single()

      if (appointmentError) {
        console.error('Erro ao buscar agendamento:', appointmentError)
        setPageLoading(false)
        toast.error('Erro ao carregar agendamento', {
          description: translateError(appointmentError),
        })
        setTimeout(() => router.push('/me/appointments'), 2000)
        return
      }
      
      if (!appointmentData) {
        setPageLoading(false)
        toast.error('Agendamento não encontrado')
        setTimeout(() => router.push('/me/appointments'), 2000)
        return
      }

      // Verificar se o agendamento pode ser reagendado
      if (appointmentData.status !== 'scheduled') {
        setPageLoading(false)
        toast.error('Apenas agendamentos com status "agendado" podem ser reagendados')
        setTimeout(() => router.push('/me/appointments'), 2000)
        return
      }

      setAppointment({
        id: appointmentData.id,
        exam_id: appointmentData.exam_id,
        unit_id: appointmentData.unit_id,
        scheduled_date: appointmentData.scheduled_date,
        scheduled_time: appointmentData.scheduled_time,
        status: appointmentData.status
      })

      setExam({
        id: (appointmentData.exams as any)?.id,
        name: (appointmentData.exams as any)?.name,
        price: Number((appointmentData.exams as any)?.price ?? 0)
      })

      setUnit({
        id: (appointmentData.units as any)?.id,
        name: (appointmentData.units as any)?.name,
        city: (appointmentData.units as any)?.city,
        address: (appointmentData.units as any)?.address,
        neighborhood: (appointmentData.units as any)?.neighborhood,
        phone: (appointmentData.units as any)?.phone
      })

      // Preencher data e horário atuais
      setSelectedDate(appointmentData.scheduled_date)
      setSelectedTime(appointmentData.scheduled_time)
      
      // Marcar como carregado
      setPageLoading(false)
    } catch (error) {
      console.error('Erro ao buscar dados do agendamento:', error)
      setPageLoading(false)
      try {
        toast.error('Erro ao carregar dados do agendamento', {
          description: translateError(error as any),
          duration: 5000,
        })
      } catch (toastError) {
        console.error('Erro ao exibir toast:', toastError)
      }
      setTimeout(() => router.push('/me/appointments'), 2000)
    }
  }

  const generateTimeSlots = () => {
    if (!selectedDate) return

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()
    
    const slots: TimeSlot[] = []
    const isSaturday = dayOfWeek === 6
    const closingHour = isSaturday ? 12 : 19
    
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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime || !appointment || !user) {
      toast.error('Dados incompletos para reagendamento')
      return
    }

    // Verificar se a data ou horário mudaram
    if (selectedDate === appointment.scheduled_date && selectedTime === appointment.scheduled_time) {
      toast.error('Selecione uma nova data ou horário para reagendar')
      return
    }

    setRescheduling(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_date: selectedDate,
          scheduled_time: selectedTime
        })
        .eq('id', appointment.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Agendamento reagendado com sucesso!', {
        description: `${exam?.name} reagendado para ${format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime}`,
        duration: 5000,
      })
      
      setTimeout(() => {
        router.push('/me/appointments')
      }, 1500)
    } catch (error: any) {
      console.error('Erro ao reagendar:', error)
      toast.error('Erro ao reagendar agendamento', {
        description: translateError(error),
        duration: 5000,
      })
    } finally {
      setRescheduling(false)
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

  if (loading || pageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!appointment || !exam || !unit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Agendamento não encontrado
            </p>
            <Link href="/me/appointments">
              <Button>Voltar para Meus Agendamentos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableDates = getAvailableDates()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/me/appointments">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Reagendar Exame</CardTitle>
          <CardDescription>{exam.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unidade (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade</Label>
            <div className="p-3 bg-muted rounded-md border">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{unit.name}</p>
                  <p className="text-muted-foreground">
                    {unit.address}, {unit.neighborhood} - {unit.city}
                  </p>
                  {unit.phone && (
                    <p className="text-muted-foreground mt-1">
                      Tel: {unit.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A unidade não pode ser alterada no reagendamento
            </p>
          </div>

          {/* Data atual */}
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Data e Horário Atuais:</p>
            <p className="text-sm text-blue-700">
              {format(new Date(appointment.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {appointment.scheduled_time}
            </p>
          </div>

          {/* Nova Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Nova Data *</Label>
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

          {/* Novo Horário */}
          {selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="time">Novo Horário *</Label>
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
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || rescheduling}
            >
              {rescheduling ? 'Reagendando...' : 'Confirmar Reagendamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

