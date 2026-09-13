import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ComposeMessageForm from '@/components/admin/ComposeMessageForm'

export default async function AdminNewTicketPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'user')
    .order('email', { ascending: true })

  return (
    <div className="max-w-xl space-y-4">
      <Link href="/admin/tickets" className="text-white/60 hover:text-white text-sm">
        ← Ticket
      </Link>

      <ComposeMessageForm users={users ?? []} />
    </div>
  )
}
