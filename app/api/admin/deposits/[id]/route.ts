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

  const { action, amountCredited, note } = await request.json()

  if (action === 'confirm') {
    if (typeof amountCredited !== 'number' || !Number.isFinite(amountCredited) || amountCredited <= 0) {
      return NextResponse.json({ error: 'Importo da accreditare non valido' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('admin_confirm_deposit', {
      p_deposit_id: id,
      p_amount_credited: amountCredited,
      p_note: note ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, deposit: data })
  }

  if (action === 'reject') {
    const { data, error } = await supabase.rpc('admin_reject_deposit', {
      p_deposit_id: id,
      p_note: note ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, deposit: data })
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
}
