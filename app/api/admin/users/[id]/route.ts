import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accesso negato' }, { status: 403 }) }
  }

  return { user }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()

  const check = await requireAdmin(supabase)
  if (check.error) return check.error

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.balance === 'number' && Number.isFinite(body.balance)) {
    updates.balance = body.balance
  }
  if (body.role === 'admin' || body.role === 'user') {
    updates.role = body.role
  }
  if (typeof body.is_blocked === 'boolean') {
    updates.is_blocked = body.is_blocked
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nessun campo valido da aggiornare' }, { status: 400 })
  }

  // Se viene modificato il saldo, registriamo il movimento per tenere traccia della modifica manuale
  if (typeof updates.balance === 'number') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', id)
      .single()

    const delta = updates.balance - Number(targetProfile?.balance ?? 0)

    if (delta !== 0) {
      await supabase.from('balance_transactions').insert({
        user_id: id,
        amount: delta,
        type: 'admin_adjustment',
        reference_id: check.user!.id,
        note: 'Modifica manuale saldo da parte di un admin',
      })
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, profile: data })
}
