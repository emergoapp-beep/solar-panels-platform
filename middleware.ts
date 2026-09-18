import { NextResponse, type NextRequest } from 'next/server'

// Registra ogni pagina visitata (per le statistiche in /admin/analytics).
// Non blocca mai la navigazione: se il tracciamento fallisce, la richiesta
// prosegue comunque normalmente.
//
// NOTA PERFORMANCE: qui NON verifichiamo più l'utente con supabase.auth.getUser(),
// perché questo middleware gira su ogni singola pagina e quella chiamata è un
// round-trip di rete verso il server Auth di Supabase — che si sommava a quello
// già fatto da ogni pagina protetta per il proprio controllo di accesso,
// raddoppiando di fatto il tempo prima che l'utente vedesse qualcosa. Il
// tracciamento anonimo (path, IP, user agent) resta identico; per legare le
// visite a un utente specifico si può leggere l'id direttamente nella pagina
// (che l'user già recupera) e passarlo a /api/track da lì, se in futuro serve.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Next.js (e alcuni browser) caricano in anticipo le pagine dei link
  // visibili a schermo o al passaggio del mouse, PRIMA che l'utente ci
  // clicchi davvero sopra ("prefetch"). Queste richieste arrivano al
  // middleware come qualsiasi altra, ma non sono visite reali: se non le
  // escludiamo, ogni pagina "sfiorata" col mouse finisce nelle statistiche
  // anche senza essere mai stata aperta.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose')?.includes('prefetch')

  if (isPrefetch) {
    return response
  }

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
      userId: null,
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
