import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      event_id,
      category,
      file,
      filename,
      name_position_x,
      name_position_y
    } = req.body

    if (!event_id || !category || !file) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if template already exists for this event + category
    const { data: existing } = await supabase
      .from('certificate_templates')
      .select('id')
      .eq('event_id', event_id)
      .eq('category', category)
      .single()

    if (existing) {
      return res.status(400).json({ 
        error: `Template for ${category} already exists. Please delete it first or choose a different category.` 
      })
    }

    // Convert base64 to buffer
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate filename
    const fileExt = filename.split('.').pop()
    const fileName = `templates/${event_id}/${category}_${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error('Failed to upload file to storage')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName)

    // Save template to database
    const { data: templateData, error: dbError } = await supabase
      .from('certificate_templates')
      .insert([{
        event_id,
        category,
        template_url: urlData.publicUrl,
        name_position_x: name_position_x || 50,
        name_position_y: name_position_y || 50,
        name_font_size: 48,
        name_font_color: '#000000',
        name_font_family: 'serif'
      }])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save template to database')
    }

    res.status(200).json({ 
      success: true,
      message: 'Template uploaded successfully',
      template: templateData
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to upload template'
    })
  }
}

// Increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
