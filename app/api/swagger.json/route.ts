import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

