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
