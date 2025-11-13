'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Importar SwaggerUI dinamicamente para evitar problemas de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Documentação da API - E2ELAB</h1>
          <p className="text-muted-foreground mb-4">
            Documentação completa da API para gerenciamento de agendamentos de exames
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a 
              href="/api/swagger.json" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Ver especificação JSON
            </a>
          </div>
        </div>
        <div className="swagger-container">
          <SwaggerUI url="/api/swagger.json" />
        </div>
      </div>
    </div>
  )
}

