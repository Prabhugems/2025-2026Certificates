import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { event_id } = req.query

  if (!event_id) {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  try {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json({ templates: data })
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
}
