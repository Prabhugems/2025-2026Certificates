import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, email, name, event_name, date_of_event, category, tags, certificate_url } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Certificate ID is required' })
  }

  try {
    const updateData = {}
    if (email) updateData.email = email.toLowerCase().trim()
    if (name) updateData.name = name.trim()
    if (event_name) updateData.event_name = event_name.trim()
    if (date_of_event !== undefined) updateData.date_of_event = date_of_event
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (certificate_url) updateData.certificate_url = certificate_url.trim()

    const { data, error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: 'Certificate updated successfully',
      certificate: data[0]
    })
  } catch (error) {
    console.error('Error updating certificate:', error)
    res.status(500).json({ error: 'Failed to update certificate' })
  }
}
