import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .ilike('email', email.trim())
      .order('date_of_event', { ascending: false })

    if (error) throw error

    const certificates = data.map(cert => ({
      name: cert.name,
      email: cert.email,
      eventName: cert.event_name,
      date: cert.date_of_event,
      category: cert.category,
      tags: cert.tags,
      certificateUrl: cert.certificate_url
    }))

    res.status(200).json({ certificates })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
}
