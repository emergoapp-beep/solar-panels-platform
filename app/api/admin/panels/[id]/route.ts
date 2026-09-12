import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Accesso negato' }, { status: 403 }) }

  return { error: null }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const body = await request.json()
  const update: Record<string, unknown> = {}

  if (body.name !== undefined) update.name = String(body.name).trim()
  if (body.description !== undefined) update.description = body.description
  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0) {
      return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 })
    }
    update.price = body.price
  }
  if (body.dailyYieldType !== undefined) {
    if (body.dailyYieldType !== 'percent' && body.dailyYieldType !== 'fixed') {
      return NextResponse.json({ error: 'Tipo di resa non valido' }, { status: 400 })
    }
    update.daily_yield_type = body.dailyYieldType
  }
  if (body.dailyYieldValue !== undefined) {
    if (typeof body.dailyYieldValue !== 'number' || !Number.isFinite(body.dailyYieldValue) || body.dailyYieldValue <= 0) {
      return NextResponse.json({ error: 'Valore di resa non valido' }, { status: 400 })
    }
    update.daily_yield_value = body.dailyYieldValue
  }
  if (body.durationDays !== undefined) {
    if (body.durationDays !== null && (!Number.isInteger(body.durationDays) || body.durationDays <= 0)) {
      return NextResponse.json({ error: 'Durata non valida' }, { status: 400 })
    }
    update.duration_days = body.durationDays
  }
  if (body.isActive !== undefined) update.is_active = Boolean(body.isActive)

  update.updated_at = new Date().toISOString()

  const { data: panelType, error } = await supabase
    .from('panel_types')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, panelType })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('panel_types').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
