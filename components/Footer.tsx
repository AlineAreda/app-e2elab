'use client'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} E2ETreinamentos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

