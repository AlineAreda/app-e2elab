# Regras de Negócio e Critérios de Aceite (E2ELAB)

Este documento consolida as regras de negócio e os critérios de aceite observados no código da aplicação.

## 1. Autenticação (Login)

### Regras de negócio
- O login aceita **CPF ou e-mail** como identificador.
- Um identificador é considerado CPF **apenas se** não parecer e-mail **e** possuir exatamente 11 dígitos numéricos (com ou sem máscara).
- Ao informar CPF, o sistema tenta resolver o e-mail via RPC `get_user_email_by_cpf`.
- Se o CPF não for encontrado (RPC retorna erro ou `null`), o usuário é redirecionado para o cadastro com o CPF pré-preenchido.
- Após autenticação bem-sucedida, o usuário é redirecionado para `redirectTo` (padrão `/exams`).

### Critérios de aceite
- Dado um CPF válido que exista, ao submeter login o sistema deve autenticar e redirecionar para o `redirectTo` informado.
- Dado um CPF inexistente, ao tentar login o usuário deve ser redirecionado para `/signup` com `identifier` preenchido.
- Dado um e-mail válido, o login deve autenticar com senha e redirecionar para o `redirectTo`.
- Ao falhar o login, o sistema deve exibir mensagem de erro amigável.

## 2. Cadastro (Sign up)

### Regras de negócio
- Campos obrigatórios: **nome completo**, **CPF**, **e-mail**, **telefone**, **data de nascimento**, **senha**, **confirmar senha**.
- **Nome completo**:
  - Mínimo 3 caracteres (ignorando espaços nas extremidades).
  - Deve conter pelo menos um espaço (nome + sobrenome).
  - Deve conter pelo menos uma letra; não pode ser apenas números.
- **CPF**:
  - Deve ter 11 dígitos numéricos.
  - Não pode ser sequência repetida (ex.: 000.000.000-00).
  - Deve passar no algoritmo de validação dos dígitos verificadores.
- **E-mail**:
  - Normalizado (sem espaços/caracteres invisíveis, minúsculo).
  - Deve seguir formato válido `usuario@dominio`.
- **Telefone**:
  - Deve ter DDD (2 dígitos) e 8 ou 9 dígitos de número (10 ou 11 dígitos no total).
- **Data de nascimento**:
  - Formato `dd/MM/yyyy`.
  - Não pode ser futura.
  - Não pode indicar idade acima de 120 anos.
  - Idade mínima: 16 anos (menores devem ser cadastrados por responsável).
- **Senha**:
  - Mínimo de 6 caracteres.
  - Deve conter letras e números.
  - Não pode ser igual ao CPF, ao e-mail ou ao nome completo (normalizado).
- Após criar usuário no Supabase Auth, o perfil é criado/atualizado via `POST /api/profiles`.
- Se o e-mail exigir confirmação (sem sessão retornada pelo Supabase), o usuário é direcionado ao login com aviso de confirmação.

### Critérios de aceite
- O cadastro deve bloquear o envio quando qualquer campo obrigatório estiver inválido ou vazio, exibindo mensagem de erro específica no campo.
- O cadastro deve recusar CPF inválido (algoritmo) e CPF duplicado, com mensagens apropriadas.
- O cadastro deve recusar senha menor que 6 caracteres ou sem combinação de letras e números, bem como senha igual ao CPF, e-mail ou nome completo.
- O cadastro deve recusar data de nascimento futura, inválida ou com idade menor que 16 anos.
- Após cadastro bem-sucedido, o usuário deve ser redirecionado ao login com `signup=success` e `identifier` preenchido.

## 3. Catálogo de Exames

### Regras de negócio
- Apenas exames **ativos** são exibidos na listagem.
- A lista de exames é ordenada por nome.
- A busca só filtra resultados **a partir de 3 caracteres**.
- O filtro considera **nome, descrição e categoria**.

### Critérios de aceite
- Ao abrir a página, a lista deve mostrar apenas exames ativos ordenados por nome.
- Ao digitar menos de 3 caracteres, a lista deve permanecer inalterada e exibir aviso.
- Ao digitar 3 ou mais caracteres, o sistema deve filtrar por nome, descrição ou categoria.
- Quando não houver correspondência, deve ser exibida mensagem de “Nenhum exame encontrado”.

## 4. Detalhe do Exame

### Regras de negócio
- Exibe nome, descrição, categoria, duração e preço.
- Exibe preparo; se não houver, mostra mensagem padrão.
- Se o exame exigir jejum, indica horas de jejum.
- Disponibiliza ação para agendar o exame.

### Critérios de aceite
- Ao abrir um exame existente, a página deve renderizar todas as informações do exame.
- Ao abrir um exame inexistente, deve exibir mensagem de “Exame não encontrado” com opção de voltar.
- Se `fasting_required` for verdadeiro, deve exibir aviso com `fasting_hours`.

## 5. Agendamento de Exame

### Regras de negócio
- O usuário deve estar autenticado.
- Apenas unidades **ativas** são exibidas.
- Datas disponíveis são os **próximos 30 dias**, excluindo **domingos**.
- Horários disponíveis:
  - Segunda a sexta: 07:00 até 18:30 (intervalos de 30 min).
  - Sábado: 07:00 até 11:30 (intervalos de 30 min).
- O agendamento exige **unidade**, **data** e **horário**.
- Ao confirmar, um registro é criado em `appointments` com status `scheduled`.
- Após sucesso, o usuário é redirecionado para **Meus Agendamentos**.

### Critérios de aceite
- O botão de confirmar deve ficar desabilitado até unidade, data e horário serem selecionados.
- A lista de horários deve respeitar o dia da semana (sábado com janela reduzida).
- Ao confirmar com dados válidos, deve criar agendamento com status `scheduled`.
- Após sucesso, o usuário deve ser redirecionado para `/me/appointments`.

## 6. Meus Agendamentos

### Regras de negócio
- Exibe os agendamentos do usuário autenticado, ordenados por data.
- Status possíveis: `scheduled`, `completed`, `cancelled`.
- Agendamentos com status `scheduled` permitem **reagendar** e **cancelar**.
- Cancelamento atualiza o status para `cancelled`.

### Critérios de aceite
- Quando não houver agendamentos, deve exibir estado vazio com link para exames.
- Agendamentos devem mostrar data, horário, unidade (quando disponível) e valor.
- Ao cancelar, o status deve mudar para `cancelled` e o botão deve mostrar estado de carregamento.

## 7. Reagendamento

### Regras de negócio
- Apenas agendamentos com status `scheduled` podem ser reagendados.
- A **unidade é fixa** e não pode ser alterada no reagendamento.
- Datas disponíveis são os **próximos 30 dias**, excluindo **domingos**.
- Horários disponíveis seguem a mesma regra do agendamento (intervalos de 30 min).
- O reagendamento só é permitido se **data ou horário** forem alterados.

### Critérios de aceite
- Se o agendamento não estiver com status `scheduled`, o usuário deve ser redirecionado com mensagem de erro.
- O botão de confirmar deve ficar desabilitado enquanto data e horário não estiverem selecionados.
- Se a data/horário não mudarem, o sistema deve bloquear o reagendamento e exibir aviso.
- Após reagendar com sucesso, deve redirecionar para `/me/appointments`.

## 8. Criação/Atualização de Perfil (API)

### Regras de negócio
- A rota `POST /api/profiles` exige `SUPABASE_URL` (ou `NEXT_PUBLIC_SUPABASE_URL`) e `SUPABASE_SERVICE_ROLE_KEY`.
- Campos obrigatórios: `userId`, `fullName`, `cpf`, `phone`, `birthDate`.
- CPF deve ter 11 dígitos e ser válido pelo algoritmo local.
- CPF duplicado para outro usuário retorna erro `CPF_DUPLICATED` (HTTP 409).
- A operação é **idempotente** (upsert), suportando schemas com `id` ou `user_id`.

### Critérios de aceite
- Se faltar variável de ambiente crítica, a API deve responder com erro 500 e código adequado.
- Se o CPF for inválido, deve retornar erro 400 com `CPF_INVALID`.
- Se o CPF já estiver cadastrado para outro usuário, deve retornar 409 com `CPF_DUPLICATED`.
- Em sucesso, deve retornar 201 com `ok: true` e dados do perfil.

## 9. Atualização de Exames (API Administrativa)

### Regras de negócio
- A rota `PUT /api/exams/[id]` exige `SUPABASE_SERVICE_ROLE_KEY` válida e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- É obrigatório enviar **token Bearer** e o usuário precisa ser **admin** (`role=admin` ou `is_admin=true`).

### Critérios de aceite
- Sem token Bearer, a API deve retornar 401.
- Com token válido, mas usuário sem permissão de admin, deve retornar 403.
- Com token válido e usuário admin, a API deve permitir atualização do exame.
