export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'E2ELAB API',
    version: '1.0.0',
    description: 'API RESTful para gerenciamento de agendamentos de exames laboratoriais - E2ELAB. Esta API permite operações administrativas e de gerenciamento de usuários e agendamentos.',
    contact: {
      name: 'E2ELAB Support',
      email: 'contato@e2elab.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://e2elab.com/terms'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desenvolvimento local'
    },
    {
      url: 'https://api.e2elab.com',
      description: 'Servidor de produção'
    }
  ],
  tags: [
    {
      name: 'Users',
      description: 'Operações relacionadas ao gerenciamento de usuários do sistema. Estas rotas são utilizadas principalmente pelo time de testes e administradores.',
      'x-tagGroups': [
        {
          name: 'Administração',
          tags: ['Users']
        }
      ]
    },
    {
      name: 'Exams',
      description: 'Operações relacionadas ao gerenciamento de exames do catálogo. Estas rotas são utilizadas para atualizar informações dos exames disponíveis.',
      'x-tagGroups': [
        {
          name: 'Administração',
          tags: ['Exams']
        }
      ]
    }
  ],
  paths: {
    '/api/users/delete': {
      delete: {
        tags: ['Users'],
        summary: 'Deletar usuário por e-mail',
        description: 'Deleta um usuário do sistema pelo e-mail. Remove o perfil, agendamentos relacionados e o usuário do sistema de autenticação. Esta rota é usada pelo time de testes via Postman.',
        operationId: 'deleteUserByEmail',
        parameters: [
          {
            name: 'email',
            in: 'query',
            description: 'E-mail do usuário a ser deletado. Pode ser fornecido como query parameter ou no body da requisição.',
            required: false,
            schema: {
              type: 'string',
              format: 'email',
              example: 'usuario@exemplo.com'
            },
            examples: {
              example1: {
                summary: 'E-mail de exemplo',
                value: 'teste@exemplo.com'
              }
            }
          }
        ],
        requestBody: {
          required: false,
          description: 'Corpo da requisição contendo o e-mail do usuário. Alternativa ao query parameter.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'usuario@exemplo.com',
                    description: 'E-mail do usuário a ser deletado'
                  }
                },
                required: ['email']
              },
              examples: {
                example1: {
                  summary: 'Exemplo de requisição com body',
                  description: 'Forma recomendada quando usando ferramentas como Postman',
                  value: {
                    email: 'teste@exemplo.com'
                  }
                },
                example2: {
                  summary: 'Exemplo com query parameter',
                  description: 'URL: DELETE /api/users/delete?email=teste@exemplo.com',
                  value: null
                }
              }
            }
          }
        },
        security: [
          {
            ApiKeyAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Usuário deletado com sucesso. O sistema remove o perfil do usuário, todos os agendamentos relacionados e o registro de autenticação.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DeleteUserResponse'
                },
                examples: {
                  success: {
                    summary: 'Resposta de sucesso',
                    value: {
                      success: true,
                      message: 'Usuário deletado com sucesso',
                      deletedUserId: '123e4567-e89b-12d3-a456-426614174000',
                      deletedEmail: 'usuario@exemplo.com'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Erro de validação - E-mail inválido ou ausente. O e-mail deve ser fornecido e estar em formato válido.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  missingEmail: {
                    summary: 'E-mail ausente',
                    value: {
                      error: 'E-mail é obrigatório e deve ser uma string'
                    }
                  },
                  invalidEmail: {
                    summary: 'Formato de e-mail inválido',
                    value: {
                      error: 'Formato de e-mail inválido'
                    }
                  },
                  validationError: {
                    summary: 'Erro de validação',
                    value: {
                      error: 'E-mail é obrigatório e deve ser uma string'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Usuário não encontrado no sistema. O e-mail fornecido não está cadastrado.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  notFound: {
                    summary: 'Usuário não encontrado',
                    value: {
                      error: 'Usuário não encontrado com este e-mail'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor. Ocorreu um erro ao processar a requisição. Verifique os logs do servidor para mais detalhes.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  serverError: {
                    summary: 'Erro interno do servidor',
                    value: {
                      error: 'Erro ao deletar usuário',
                      details: 'Erro ao buscar usuário no banco de dados'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/exams/{id}': {
      put: {
        tags: ['Exams'],
        summary: 'Atualizar exame por ID',
        description: 'Atualiza informações de um exame existente no catálogo. Permite atualização parcial ou completa dos dados do exame. Esta rota é usada para manter o catálogo de exames atualizado.',
        operationId: 'updateExamById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'ID único do exame a ser atualizado',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        ],
        requestBody: {
          required: true,
          description: 'Dados do exame a serem atualizados. Todos os campos são opcionais - apenas os campos fornecidos serão atualizados.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateExamRequest'
              },
              examples: {
                updatePrice: {
                  summary: 'Atualizar apenas o preço',
                  value: {
                    price: 150.00
                  }
                },
                updateMultiple: {
                  summary: 'Atualizar múltiplos campos',
                  value: {
                    name: 'Hemograma Completo',
                    description: 'Análise completa do sangue',
                    duration: 30,
                    price: 120.00,
                    category: 'Hematologia',
                    preparation: 'Jejum de 4 horas',
                    fasting_required: true,
                    fasting_hours: 4
                  }
                },
                deactivate: {
                  summary: 'Desativar exame',
                  value: {
                    active: false
                  }
                }
              }
            }
          }
        },
        security: [
          {
            ApiKeyAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Exame atualizado com sucesso. Retorna o exame atualizado com todos os dados.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateExamResponse'
                },
                examples: {
                  success: {
                    summary: 'Resposta de sucesso',
                    value: {
                      success: true,
                      message: 'Exame atualizado com sucesso',
                      exam: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Hemograma Completo',
                        description: 'Análise completa do sangue',
                        duration: 30,
                        price: 120.00,
                        category: 'Hematologia',
                        preparation: 'Jejum de 4 horas',
                        fasting_required: true,
                        fasting_hours: 4,
                        active: true,
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-15T10:30:00Z'
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Erro de validação - Dados inválidos fornecidos.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  invalidData: {
                    summary: 'Dados inválidos',
                    value: {
                      error: 'Nome do exame deve ser uma string não vazia'
                    }
                  },
                  emptyBody: {
                    summary: 'Body vazio',
                    value: {
                      error: 'Pelo menos um campo deve ser fornecido para atualização'
                    }
                  },
                  invalidPrice: {
                    summary: 'Preço inválido',
                    value: {
                      error: 'Preço deve ser um número maior ou igual a zero'
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Exame não encontrado. O ID fornecido não existe no sistema.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  notFound: {
                    summary: 'Exame não encontrado',
                    value: {
                      error: 'Exame não encontrado'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor. Ocorreu um erro ao processar a requisição.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                },
                examples: {
                  serverError: {
                    summary: 'Erro interno do servidor',
                    value: {
                      error: 'Erro ao atualizar exame',
                      details: 'Erro ao atualizar registro no banco de dados'
                    }
                  }
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Exams'],
        summary: 'Atualizar exame por ID (PATCH)',
        description: 'Atualiza informações de um exame existente no catálogo. Funciona de forma idêntica ao PUT, permitindo atualização parcial dos dados do exame.',
        operationId: 'patchExamById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'ID único do exame a ser atualizado',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        ],
        requestBody: {
          required: true,
          description: 'Dados do exame a serem atualizados. Todos os campos são opcionais.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateExamRequest'
              }
            }
          }
        },
        security: [
          {
            ApiKeyAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Exame atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateExamResponse'
                }
              }
            }
          },
          '400': {
            description: 'Erro de validação',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '404': {
            description: 'Exame não encontrado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Chave de API para autenticação (opcional para desenvolvimento)'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Mensagem de erro descritiva',
            example: 'E-mail é obrigatório e deve ser uma string'
          },
          details: {
            type: 'string',
            description: 'Detalhes adicionais do erro (opcional)',
            example: 'Erro ao buscar usuário no banco de dados'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Indica se a operação foi bem-sucedida'
          },
          message: {
            type: 'string',
            description: 'Mensagem de sucesso',
            example: 'Usuário deletado com sucesso'
          }
        }
      },
      DeleteUserResponse: {
        type: 'object',
        required: ['success', 'message', 'deletedUserId', 'deletedEmail'],
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Usuário deletado com sucesso'
          },
          deletedUserId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID único do usuário deletado'
          },
          deletedEmail: {
            type: 'string',
            format: 'email',
            example: 'usuario@exemplo.com',
            description: 'E-mail do usuário deletado'
          }
        }
      },
      UpdateExamRequest: {
        type: 'object',
        description: 'Dados para atualização de um exame. Todos os campos são opcionais.',
        properties: {
          name: {
            type: 'string',
            description: 'Nome do exame',
            example: 'Hemograma Completo',
            minLength: 1
          },
          description: {
            type: 'string',
            description: 'Descrição detalhada do exame',
            example: 'Análise completa do sangue incluindo contagem de células'
          },
          duration: {
            type: 'integer',
            description: 'Duração do exame em minutos',
            example: 30,
            minimum: 1
          },
          price: {
            type: 'number',
            format: 'float',
            description: 'Preço do exame em reais',
            example: 120.00,
            minimum: 0
          },
          category: {
            type: 'string',
            description: 'Categoria do exame',
            example: 'Hematologia',
            minLength: 1
          },
          preparation: {
            type: 'string',
            description: 'Instruções de preparo para o exame',
            example: 'Jejum de 4 horas. Evitar exercícios físicos no dia anterior.'
          },
          fasting_required: {
            type: 'boolean',
            description: 'Indica se o exame requer jejum',
            example: true
          },
          fasting_hours: {
            type: 'integer',
            description: 'Número de horas de jejum necessárias',
            example: 4,
            minimum: 0
          },
          active: {
            type: 'boolean',
            description: 'Indica se o exame está ativo e disponível para agendamento',
            example: true
          }
        }
      },
      Exam: {
        type: 'object',
        required: ['id', 'name', 'description', 'duration', 'price', 'category', 'active'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID único do exame'
          },
          name: {
            type: 'string',
            example: 'Hemograma Completo',
            description: 'Nome do exame'
          },
          description: {
            type: 'string',
            example: 'Análise completa do sangue',
            description: 'Descrição do exame'
          },
          duration: {
            type: 'integer',
            example: 30,
            description: 'Duração em minutos'
          },
          price: {
            type: 'number',
            format: 'float',
            example: 120.00,
            description: 'Preço em reais'
          },
          category: {
            type: 'string',
            example: 'Hematologia',
            description: 'Categoria do exame'
          },
          preparation: {
            type: 'string',
            example: 'Jejum de 4 horas',
            description: 'Instruções de preparo',
            nullable: true
          },
          fasting_required: {
            type: 'boolean',
            example: true,
            description: 'Requer jejum',
            nullable: true
          },
          fasting_hours: {
            type: 'integer',
            example: 4,
            description: 'Horas de jejum necessárias',
            nullable: true
          },
          active: {
            type: 'boolean',
            example: true,
            description: 'Exame ativo'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z',
            description: 'Data de criação'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
            description: 'Data de última atualização'
          }
        }
      },
      UpdateExamResponse: {
        type: 'object',
        required: ['success', 'message', 'exam'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Indica se a operação foi bem-sucedida'
          },
          message: {
            type: 'string',
            example: 'Exame atualizado com sucesso',
            description: 'Mensagem de sucesso'
          },
          exam: {
            $ref: '#/components/schemas/Exam',
            description: 'Exame atualizado com todos os dados'
          }
        }
      }
    },
    examples: {
      DeleteUserSuccess: {
        summary: 'Resposta de sucesso ao deletar usuário',
        value: {
          success: true,
          message: 'Usuário deletado com sucesso',
          deletedUserId: '123e4567-e89b-12d3-a456-426614174000',
          deletedEmail: 'usuario@exemplo.com'
        }
      },
      DeleteUserError400: {
        summary: 'Erro de validação',
        value: {
          error: 'E-mail é obrigatório e deve ser uma string'
        }
      },
      DeleteUserError404: {
        summary: 'Usuário não encontrado',
        value: {
          error: 'Usuário não encontrado com este e-mail'
        }
      },
      DeleteUserError500: {
        summary: 'Erro interno do servidor',
        value: {
          error: 'Erro ao deletar usuário',
          details: 'Erro ao buscar usuário no banco de dados'
        }
      }
    }
  }
}

