'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Calendar, FileText, Shield, Clock, CheckCircle2, ArrowRight, HelpCircle, MapPin, Phone } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { supabase } from '@/lib/supabase'

interface Unit {
  id: string
  name: string
  city: string
  address: string
  neighborhood: string
  phone?: string
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [units, setUnits] = useState<Unit[]>([])

  const handleAgendarExame = () => {
    if (!user) {
      router.push('/login?redirectTo=/exams')
    } else {
      router.push('/exams')
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

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
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const features = [
    {
      icon: Calendar,
      title: 'Agendamento Online',
      description: 'Agende seus exames 24 horas por dia, 7 dias por semana, de forma rápida e prática',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'Resultados Digitais',
      description: 'Receba seus resultados de forma rápida e segura, diretamente na plataforma',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Atendimento de Qualidade',
      description: 'Profissionais qualificados e equipamentos modernos para garantir a melhor experiência',
      color: 'text-purple-600'
    }
  ]

  const benefits = [
    'Sem necessidade de ligar ou ir até o laboratório',
    'Escolha o melhor horário para você',
    'Lembrete automático do seu agendamento',
    'Histórico completo dos seus exames'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-blue-50/50 to-transparent">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4 py-2 animate-fade-in">
              <Image
                src="/img.svg"
                alt="E2ELAB Banner"
                width={320}
                height={107}
                priority
                className="h-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Agende seus exames de forma{' '}
              <span className="text-primary">rápida e fácil</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Plataforma moderna e segura para gerenciar seus exames médicos.{' '}
              <span className="font-medium text-gray-700">Agendamento online, resultados digitais e muito mais.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                onClick={handleAgendarExame}
                className="text-lg px-10 py-7 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90"
              >
                Agendar Exame
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {user && (
                <Link href="/exams">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-10 py-7 h-auto border-2 hover:bg-gray-50 transition-all duration-300"
                  >
                    Ver Exames Disponíveis
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>100% Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Seguro e Confiável</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Disponível 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher o E2ELAB?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos a melhor experiência em agendamento de exames
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 ${feature.color} flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-primary/5 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vantagens do nosso serviço
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-lg text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Units Section */}
      {units.length > 0 && (
        <section className="bg-white py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Nossas Unidades
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Encontre a unidade mais próxima de você
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {units.map((unit) => (
                <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{unit.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-primary">
                      {unit.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p>{unit.address}</p>
                        <p>{unit.neighborhood}</p>
                        <p className="font-medium mt-1">{unit.city} - SC</p>
                      </div>
                    </div>
                    {unit.phone && (
                      <div className="flex items-center space-x-3 pt-2 border-t">
                        <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${unit.phone.replace(/\D/g, '')}`}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {unit.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dúvidas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Encontre respostas para as principais perguntas sobre nossos serviços
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                É permitido levar acompanhantes no atendimento?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Para que possamos respeitar os protocolos de segurança e distanciamento social nas nossas unidades, sugerimos 01 acompanhante apenas para: gestantes, crianças, pessoas com necessidades especiais e pacientes que irão realizar exames onde acompanhantes são indispensáveis (esses casos serão informados no momento do agendamento).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Quanto tempo antes devo chegar na unidade?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Chegue com antecedência de 30 minutos do horário marcado em nossas unidades, para realizar os processos de recepção e garantir que tudo esteja pronto para o seu atendimento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Posso reagendar meu exame?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Sim, você pode reagendar seu exame através da plataforma acessando "Meus Agendamentos". Recomendamos fazer o reagendamento com pelo menos 24 horas de antecedência. Caso precise cancelar, você também pode fazer isso pela plataforma.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Como recebo os resultados dos exames?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Os resultados ficam disponíveis na plataforma assim que são liberados pelo laboratório. Você receberá uma notificação por e-mail quando os resultados estiverem prontos. O tempo de liberação varia conforme o tipo de exame realizado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Preciso estar em jejum para todos os exames?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Não. A necessidade de jejum depende do tipo de exame. Quando você visualiza os detalhes do exame na plataforma, todas as informações sobre preparo, incluindo necessidade de jejum e tempo necessário, são informadas claramente. Sempre verifique as instruções antes do seu agendamento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Posso agendar múltiplos exames no mesmo dia?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Sim, é possível agendar múltiplos exames no mesmo dia. Recomendamos que você verifique se há necessidade de jejum e organize os horários de forma que seja possível realizar todos os exames. Alguns exames podem ter restrições específicas que serão informadas durante o agendamento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                O que fazer se eu perder meu horário?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Se você perder seu horário, entre em contato conosco o quanto antes. Dependendo da disponibilidade, podemos reagendar para outro horário no mesmo dia ou em outra data. Recomendamos sempre chegar com antecedência para evitar imprevistos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white rounded-lg border px-6 shadow-sm">
              <AccordionTrigger className="text-left font-semibold text-lg">
                Quais formas de pagamento são aceitas?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Aceitamos diversas formas de pagamento: cartão de crédito, cartão de débito, PIX e dinheiro. O pagamento é realizado no dia do atendimento na unidade. Alguns convênios também são aceitos - consulte a disponibilidade na unidade escolhida.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para começar?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Cadastre-se gratuitamente e comece a agendar seus exames hoje mesmo
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push('/signup')}
                  className="text-lg px-8 py-6 h-auto"
                >
                  Criar Conta Grátis
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="text-lg px-8 py-6 h-auto bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  Já tenho conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
