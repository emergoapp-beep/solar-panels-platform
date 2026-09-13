import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Registra ogni pagina visitata (per le statistiche in /admin/analytics).
// Non blocca mai la navigazione: se il tracciamento fallisce, la richiesta
// prosegue comunque normalmente.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  // "Fire and forget": non aspettiamo la risposta per non rallentare la pagina.
  fetch(new URL('/api/track', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: request.nextUrl.pathname,
      userId: user?.id ?? null,
      ip,
      userAgent: request.headers.get('user-agent'),
    }),
  }).catch(() => {})

  return response
}

export const config = {
  // Traccia tutte le pagine, escludendo asset statici, immagini e le API stesse
  // (altrimenti ogni chiamata /api/track genererebbe un'altra chiamata /api/track).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
