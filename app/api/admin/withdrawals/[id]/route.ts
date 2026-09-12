import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const { action, txHash, note } = await request.json()

  if (action === 'approve') {
    const { data, error } = await supabase.rpc('admin_approve_withdrawal', {
      p_withdrawal_id: id,
      p_tx_hash: txHash ?? null,
      p_note: note ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, withdrawal: data })
  }

  if (action === 'reject') {
    const { data, error } = await supabase.rpc('admin_reject_withdrawal', {
      p_withdrawal_id: id,
      p_note: note ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, withdrawal: data })
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
}
