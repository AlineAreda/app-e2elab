'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/error-messages'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'

interface Appointment {
  id: string
  exam_name: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'completed' | 'cancelled' 
  price: number
  exam_id: string
  unit_name?: string
  unit_city?: string
  unit_address?: string
}

export default function AppointmentsPage() {
  const { user, loading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    
    const currentUser = user
    if (currentUser) {
      fetchAppointments(currentUser.id) 
    } else {
      setAppointments([])
      setAppointmentsLoading(false)
    }
  }, [user, loading])

  const fetchAppointments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          exam_id,
          exams (
            name,
            price
          ),
          units (
            name,
            city,
            address
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true })

      if (error) throw error

      const formattedAppointments: Appointment[] = (data || []).map((apt: any) => ({
        id: apt.id,
        exam_name: apt.exams?.name ?? 'Exame não encontrado',
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        status: apt.status,
        price: Number(apt.exams?.price ?? 0),
        exam_id: apt.exam_id,
        unit_name: apt.units?.name,
        unit_city: apt.units?.city,
        unit_address: apt.units?.address
      }))

      setAppointments(formattedAppointments)
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const handleCancel = async (appointmentId: string) => {
    const currentUser = user
    if (!currentUser) return

    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (!appointment) return

    if (!window.confirm(`Tem certeza que deseja cancelar o agendamento de ${appointment.exam_name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' }) // troque para 'canceled' se o DB usar 1 L
        .eq('id', appointmentId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        )
      )

      toast.success('Agendamento cancelado com sucesso', {
        description: `O agendamento de ${appointment.exam_name} foi cancelado.`,
        duration: 5000,
      })
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error)
      toast.error('Erro ao cancelar agendamento', {
        description: translateError(error),
        duration: 5000,
      })
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Agendado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading || appointmentsLoading) {
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
        <h1 className="text-3xl font-bold mb-2">Meus Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus exames agendados
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Você ainda não possui agendamentos
            </p>
            <div className="text-center">
              <Button asChild>
                <a href="/exams">Ver Exames Disponíveis</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{appointment.exam_name}</CardTitle>
                    <CardDescription>
                      {format(
                        new Date(appointment.scheduled_date),
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                      {' às '}
                      {appointment.scheduled_time}
                    </CardDescription>
                    {appointment.unit_name && (
                      <div className="flex items-start space-x-2 mt-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">{appointment.unit_name}</p>
                          {appointment.unit_address && (
                            <p>{appointment.unit_address} - {appointment.unit_city}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-lg font-bold">R$ {appointment.price.toFixed(2)}</p>
                  </div>
                  {appointment.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(appointment.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
