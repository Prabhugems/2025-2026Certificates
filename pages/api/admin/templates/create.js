import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    event_id,
    category,
    template_url,
    name_position_x,
    name_position_y,
    name_font_size,
    name_font_color,
    name_font_family
  } = req.body

  if (!event_id || !category || !template_url) {
    return res.status(400).json({ error: 'Required fields: event_id, category, template_url' })
  }

  try {
    // Check if template already exists for this event + category
    const { data: existing } = await supabase
      .from('certificate_templates')
      .select('id')
      .eq('event_id', event_id)
      .eq('category', category)
      .single()

    if (existing) {
      return res.status(400).json({ error: `Template for ${category} already exists. Please delete it first or choose a different category.` })
    }

    // Insert new template
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert([{
        event_id,
        category,
        template_url,
        name_position_x: name_position_x || 50,
        name_position_y: name_position_y || 50,
        name_font_size: name_font_size || 48,
        name_font_color: name_font_color || '#000000',
        name_font_family: name_font_family || 'serif'
      }])
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ 
      success: true, 
      message: 'Template created successfully',
      template: data
    })
  } catch (error) {
    console.error('Error creating template:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
}
