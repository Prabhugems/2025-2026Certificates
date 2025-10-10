import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { certificates } = req.body

  if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
    return res.status(400).json({ error: 'Certificates array is required' })
  }

  try {
    // Prepare data for insertion
    const preparedData = certificates.map(cert => ({
      email: cert.email?.toLowerCase().trim(),
      name: cert.name?.trim(),
      event_name: cert.event_name?.trim(),
      date_of_event: cert.date_of_event || null,
      category: cert.category || null,
      tags: cert.tags || null,
      certificate_url: cert.certificate_url?.trim()
    }))

    // Filter out invalid entries
    const validData = preparedData.filter(cert => 
      cert.email && cert.name && cert.event_name && cert.certificate_url
    )

    if (validData.length === 0) {
      return res.status(400).json({ error: 'No valid certificates to upload' })
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert(validData)
      .select()

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: `${validData.length} certificates uploaded successfully`,
      uploaded: validData.length,
      skipped: certificates.length - validData.length
    })
  } catch (error) {
    console.error('Error bulk uploading certificates:', error)
    res.status(500).json({ error: 'Failed to upload certificates' })
  }
}
