import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { panelTypeId } = await request.json()

  if (typeof panelTypeId !== 'string' || !panelTypeId) {
    return NextResponse.json({ error: 'Pannello mancante' }, { status: 400 })
  }

  const { data: userPanel, error } = await supabase.rpc('buy_panel', {
    p_panel_type_id: panelTypeId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userPanel })
}
