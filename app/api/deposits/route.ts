import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { txHash, amount } = await request.json()

  if (typeof txHash !== 'string' || !txHash.trim()) {
    return NextResponse.json({ error: 'Hash della transazione mancante' }, { status: 400 })
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Importo non valido' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked')
    .eq('id', user.id)
    .single()

  if (profile?.is_blocked) {
    return NextResponse.json({ error: 'Account bloccato' }, { status: 403 })
  }

  const { data: deposit, error } = await supabase
    .from('deposits')
    .insert({
      user_id: user.id,
      tx_hash: txHash.trim(),
      amount_claimed: amount,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Questo hash di transazione è già stato segnalato' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, deposit })
}
