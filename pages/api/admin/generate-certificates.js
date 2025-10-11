import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { event_id, participants } = req.body

  if (!event_id || !participants || !Array.isArray(participants)) {
    return res.status(400).json({ error: 'Invalid request data' })
  }

  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (eventError) {
      console.error('Event error:', eventError)
      throw new Error('Event not found')
    }

    // Get all templates for this event
    const { data: templates, error: templatesError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('event_id', event_id)

    if (templatesError) {
      console.error('Templates error:', templatesError)
      throw templatesError
    }

    if (!templates || templates.length === 0) {
      return res.status(400).json({ error: 'No templates found for this event' })
    }

    // Create a map of category to template
    const templateMap = {}
    templates.forEach(template => {
      templateMap[template.category.toLowerCase()] = template
    })

    let generated = 0
    let failed = 0
    const errors = []

    // Process each participant
    for (const participant of participants) {
      try {
        const { email, name, category } = participant

        if (!email || !name || !category) {
          failed++
          errors.push(`Missing required fields for ${email || name || 'unknown'}`)
          continue
        }

        // Find matching template
        const template = templateMap[category.toLowerCase()]
        if (!template) {
          failed++
          errors.push(`No template found for category: ${category} (Available: ${Object.keys(templateMap).join(', ')})`)
          continue
        }

        // Generate certificate URL (using template as placeholder for now)
        // PDFs will be generated later via the generate-pdfs page
        const certificateUrl = template.template_url

        // Check if certificate already exists for this email + event
        const { data: existing } = await supabase
          .from('certificates')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .eq('event_id', parseInt(event_id))
          .maybeSingle()

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('certificates')
            .update({
              name: name.trim(),
              event_name: event.event_name,
              date_of_event: event.event_date,
              category: category.trim(),
              certificate_url: certificateUrl,
              event_id: parseInt(event_id)
            })
            .eq('id', existing.id)

          if (updateError) {
            console.error('Update error:', updateError)
            failed++
            errors.push(`Failed to update ${email}: ${updateError.message}`)
            continue
          }
        } else {
          // Insert new - CRITICAL FIX: parseInt(event_id)
          const { error: insertError } = await supabase
            .from('certificates')
            .insert([{
              email: email.toLowerCase().trim(),
              name: name.trim(),
              event_name: event.event_name,
              date_of_event: event.event_date,
              category: category.trim(),
              certificate_url: certificateUrl,
              event_id: parseInt(event_id)
            }])

          if (insertError) {
            console.error('Insert error:', insertError)
            failed++
            errors.push(`Failed to insert ${email}: ${insertError.message}`)
            continue
          }
        }

        generated++
      } catch (err) {
        console.error('Processing error:', err)
        failed++
        errors.push(`Error processing ${participant.email}: ${err.message}`)
      }
    }

    res.status(200).json({
      success: true,
      generated,
      failed,
      errors: errors.slice(0, 10),
      message: `Generated ${generated} certificates. ${failed} failed.`
    })
  } catch (error) {
    console.error('Error generating certificates:', error)
    res.status(500).json({
      error: 'Failed to generate certificates',
      details: error.message
    })
  }
}
