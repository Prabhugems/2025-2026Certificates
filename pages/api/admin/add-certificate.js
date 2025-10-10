import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name, event_name, date_of_event, category, tags, certificate_url } = req.body

  // Validation
  if (!email || !name || !event_name || !certificate_url) {
    return res.status(400).json({ error: 'Required fields: email, name, event_name, certificate_url' })
  }

  try {
    const { data, error } = await supabase
      .from('certificates')
      .insert([{
        email: email.toLowerCase().trim(),
        name: name.trim(),
        event_name: event_name.trim(),
        date_of_event: date_of_event || null,
        category: category || null,
        tags: tags || null,
        certificate_url: certificate_url.trim()
      }])
      .select()

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: 'Certificate added successfully',
      certificate: data[0]
    })
  } catch (error) {
    console.error('Error adding certificate:', error)
    res.status(500).json({ error: 'Failed to add certificate' })
  }
}
