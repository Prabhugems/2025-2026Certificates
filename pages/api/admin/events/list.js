import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (eventsError) throw eventsError

    // Get template count for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const { count } = await supabase
          .from('certificate_templates')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)

        return {
          ...event,
          template_count: count || 0
        }
      })
    )

    res.status(200).json({ events: eventsWithCounts })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
}
