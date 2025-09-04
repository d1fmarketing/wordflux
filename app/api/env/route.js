import { NextResponse } from 'next/server'
import { envStatus } from '../../lib/board.js'

export async function GET(){
  const status = envStatus()
  return NextResponse.json(status)
}

