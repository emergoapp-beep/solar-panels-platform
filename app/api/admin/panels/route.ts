import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Non autenticato' }, { status: 401 }) }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Accesso negato' }, { status: 403 }) }

  return { error: null }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { name, description, price, dailyYieldType, dailyYieldValue, durationDays } = await request.json()

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nome mancante' }, { status: 400 })
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 })
  }
  if (dailyYieldType !== 'percent' && dailyYieldType !== 'fixed') {
    return NextResponse.json({ error: 'Tipo di resa non valido' }, { status: 400 })
  }
  if (typeof dailyYieldValue !== 'number' || !Number.isFinite(dailyYieldValue) || dailyYieldValue <= 0) {
    return NextResponse.json({ error: 'Valore di resa non valido' }, { status: 400 })
  }
  if (durationDays !== null && durationDays !== undefined && (!Number.isInteger(durationDays) || durationDays <= 0)) {
    return NextResponse.json({ error: 'Durata non valida' }, { status: 400 })
  }

  const { data: panelType, error } = await supabase
    .from('panel_types')
    .insert({
      name: name.trim(),
      description: description ?? null,
      price,
      daily_yield_type: dailyYieldType,
      daily_yield_value: dailyYieldValue,
      duration_days: durationDays ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, panelType })
}
