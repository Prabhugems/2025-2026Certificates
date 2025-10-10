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
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json({ certificates: data })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
}
