import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { walletAddress, amount } = await request.json()

  if (typeof walletAddress !== 'string' || !walletAddress.trim()) {
    return NextResponse.json({ error: 'Indirizzo wallet mancante' }, { status: 400 })
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Importo non valido' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_wallet_address: walletAddress.trim(),
    p_amount: amount,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, withdrawal: data })
}
