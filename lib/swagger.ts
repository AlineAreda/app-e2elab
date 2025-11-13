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

