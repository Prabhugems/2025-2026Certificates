import { createClient } from '@supabase/supabase-js'
import { createCanvas, loadImage, registerFont } from 'canvas'
import PDFDocument from 'pdfkit'
import fetch from 'node-fetch'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { certificate_id } = req.body

  if (!certificate_id) {
    return res.status(400).json({ error: 'Certificate ID required' })
  }

  try {
    // Get certificate details
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*, event_id')
      .eq('id', certificate_id)
      .single()

    if (certError) throw certError

    // Get template for this certificate
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('event_id', cert.event_id)
      .eq('category', cert.category)
      .single()

    if (templateError) throw templateError

    // Load template image
    const imageResponse = await fetch(template.template_url)
    const imageBuffer = await imageResponse.buffer()
    const templateImage = await loadImage(imageBuffer)

    // Create canvas with template dimensions
    const canvas = createCanvas(templateImage.width, templateImage.height)
    const ctx = canvas.getContext('2d')

    // Draw template
    ctx.drawImage(templateImage, 0, 0)

    // Configure text
    ctx.font = `${template.name_font_size || 48}px ${template.name_font_family || 'serif'}`
    ctx.fillStyle = template.name_font_color || '#000000'
    ctx.textAlign = 'center'

    // Calculate position (convert percentage to pixels)
    const x = (template.name_position_x / 100) * canvas.width
    const y = (template.name_position_y / 100) * canvas.height

    // Draw name
    ctx.fillText(cert.name, x, y)

    // Convert canvas to buffer
    const imageBufferWithName = canvas.toBuffer('image/png')

    // Generate filename
    const filename = `certificates/${cert.event_id}/${cert.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filename, imageBufferWithName, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filename)

    // Update certificate with new URL
    await supabase
      .from('certificates')
      .update({ certificate_url: urlData.publicUrl })
      .eq('id', certificate_id)

    res.status(200).json({
      success: true,
      certificate_url: urlData.publicUrl
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({ error: error.message })
  }
}
