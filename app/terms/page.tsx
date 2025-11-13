import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Termos de Uso - E2ELAB",
  description: "Termos de Uso da plataforma E2ELAB",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
        <p className="text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar a plataforma E2ELAB, operada pela E2ETreinamentos, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma E2ELAB oferece um serviço de agendamento online de exames médicos, permitindo que os usuários visualizem exames disponíveis, agendem horários e gerenciem seus agendamentos de forma conveniente e segura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta de Usuário</h2>
            <div className="space-y-3">
              <h3 className="text-xl font-medium">3.1. Requisitos para Cadastro</h3>
              <p className="text-muted-foreground leading-relaxed">
                Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas, completas e atualizadas, incluindo nome completo, CPF, data de nascimento, e-mail e telefone.
              </p>

              <h3 className="text-xl font-medium mt-4">3.2. Responsabilidade pela Conta</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Uso da Plataforma</h2>
            <div className="space-y-3">
              <h3 className="text-xl font-medium">4.1. Uso Permitido</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos de Uso. É permitido:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Agendar exames para você ou pessoas sob sua responsabilidade</li>
                <li>Visualizar e gerenciar seus agendamentos</li>
                <li>Acessar informações sobre exames disponíveis</li>
              </ul>

              <h3 className="text-xl font-medium mt-4">4.2. Uso Proibido</h3>
              <p className="text-muted-foreground leading-relaxed">
                É expressamente proibido:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Usar a plataforma para qualquer finalidade ilegal ou não autorizada</li>
                <li>Tentar acessar áreas restritas da plataforma sem autorização</li>
                <li>Interferir ou interromper o funcionamento da plataforma</li>
                <li>Transmitir vírus, malware ou qualquer código malicioso</li>
                <li>Coletar informações de outros usuários sem consentimento</li>
                <li>Falsificar informações pessoais ou de terceiros</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Agendamentos</h2>
            <div className="space-y-3">
              <h3 className="text-xl font-medium">5.1. Disponibilidade</h3>
              <p className="text-muted-foreground leading-relaxed">
                A disponibilidade de horários e exames está sujeita a alterações sem aviso prévio. Não garantimos a disponibilidade de horários específicos.
              </p>

              <h3 className="text-xl font-medium mt-4">5.2. Confirmação</h3>
              <p className="text-muted-foreground leading-relaxed">
                O agendamento é confirmado após o preenchimento completo do formulário e seleção de data, horário e unidade. Você receberá uma confirmação por e-mail.
              </p>

              <h3 className="text-xl font-medium mt-4">5.3. Cancelamento e Reagendamento</h3>
              <p className="text-muted-foreground leading-relaxed">
                Você pode cancelar ou reagendar seu agendamento através da plataforma, respeitando os prazos estabelecidos. Cancelamentos em cima da hora podem estar sujeitos a políticas específicas da unidade.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Pagamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os valores dos exames são informados na plataforma e podem variar. O pagamento é realizado no dia do atendimento na unidade escolhida, conforme as formas de pagamento aceitas pela unidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, imagens e software, é propriedade da E2ETreinamentos ou de seus licenciadores e está protegido por leis de direitos autorais e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A E2ETreinamentos não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Danos diretos, indiretos, incidentais ou consequenciais resultantes do uso da plataforma</li>
              <li>Interrupções, erros ou falhas na plataforma</li>
              <li>Perda de dados ou informações</li>
              <li>Problemas relacionados ao atendimento nas unidades, que são de responsabilidade das unidades parceiras</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Modificações do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto da plataforma a qualquer momento, com ou sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Rescisão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos encerrar ou suspender sua conta e acesso à plataforma imediatamente, sem aviso prévio, por qualquer motivo, incluindo violação destes Termos de Uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar estes Termos de Uso periodicamente. Alterações significativas serão comunicadas através da plataforma ou por e-mail. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questões sobre estes Termos de Uso, entre em contato conosco através dos canais disponíveis na plataforma ou pelo e-mail de suporte.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

