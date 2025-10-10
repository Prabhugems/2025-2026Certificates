import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { event_name, event_date, location } = req.body

  if (!event_name) {
    return res.status(400).json({ error: 'Event name is required' })
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        event_name: event_name.trim(),
        event_date: event_date?.trim() || null,
        location: location?.trim() || null
      }])
      .select()

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: 'Event created successfully',
      event: data[0]
    })
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ error: 'Failed to create event' })
  }
}
